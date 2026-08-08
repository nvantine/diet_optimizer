import highsLoader from 'highs';
import highsWasmUrl from 'highs/runtime?url';
import { NUTRIENTS, NUTRIENT_BY_KEY } from './nutrientMap';

const DEFAULT_OBJECTIVE = { nutrientKey: 'calories', direction: 'min' };
const TOLERANCE = 1e-6;
const COST_KEY = 'cost';
export const TRADEOFF_SWEEP_STEP_DEGREES = 10;
let highsPromise;

async function getHighs() {
  if (!highsPromise) {
    highsPromise = createHighsOptions().then(options => highsLoader(options));
  }
  return highsPromise;
}

async function createHighsOptions() {
  if (import.meta.env?.MODE === 'test') {
    const fsModule = 'node:fs/promises';
    const pathModule = 'node:path';
    const processModule = 'node:process';
    const [{ readFile }, { join }, { default: process }] = await Promise.all([
      import(/* @vite-ignore */ fsModule),
      import(/* @vite-ignore */ pathModule),
      import(/* @vite-ignore */ processModule),
    ]);
    return { wasmBinary: await readFile(join(process.cwd(), 'node_modules/highs/build/highs.wasm')) };
  }

  return { locateFile: () => highsWasmUrl };
}

export async function buildAndSolve(foods, constraints = {}, objective = DEFAULT_OBJECTIVE, categoryShares = {}) {
  const normalizedObjective = normalizeObjective(objective);
  if (!foods.length) return infeasibleResult(normalizedObjective);

  const lp = buildLpProblem(foods, constraints, normalizedObjective, categoryShares);
  const result = await solveLpString(lp, foods, constraints, normalizedObjective, categoryShares, { verifyDual: true });
  return result;
}

export function buildLpProblem(foods, constraints = {}, objective = DEFAULT_OBJECTIVE, categoryShares = {}) {
  const normalizedObjective = normalizeObjective(objective);
  return buildLpDocument({
    direction: normalizedObjective.direction === 'max' ? 'Maximize' : 'Minimize',
    objectiveExpression: linearExpression(foods, normalizedObjective.nutrientKey),
    foods,
    constraints,
    categoryShares,
  });
}

export function buildWeightedSumLpProblem(foods, constraints = {}, objectiveKeys = [], weights = [], categoryShares = {}) {
  const normalizedKeys = normalizeObjectiveKeys(objectiveKeys);
  return buildLpDocument({
    direction: 'Minimize',
    objectiveExpression: weightedLinearExpression(foods, normalizedKeys, weights),
    foods,
    constraints,
    categoryShares,
  });
}

export async function generateTradeoffCurve(foods, constraints = {}, objectiveKeys = [], categoryShares = {}, options = {}) {
  const normalizedKeys = normalizeObjectiveKeys(objectiveKeys);
  const stepDegrees = normalizeStepDegrees(options.stepDegrees ?? TRADEOFF_SWEEP_STEP_DEGREES);
  if (!foods.length) return emptyTradeoffCurve(normalizedKeys, stepDegrees);

  const highs = await getHighs();
  const points = [];
  for (const thetaDegrees of sweepAngles(stepDegrees)) {
    const radians = (thetaDegrees * Math.PI) / 180;
    const weights = [round(Math.cos(radians)), round(Math.sin(radians))];
    // Optional refinement: scale each objective before weighting when magnitudes differ greatly
    // (for example dollars vs. thousands of calories) to improve point spacing along the curve.
    const lp = buildWeightedSumLpProblem(foods, constraints, normalizedKeys, weights, categoryShares);
    const raw = highs.solve(lp);
    const solution = normalizeResult(raw, foods, constraints, { nutrientKey: normalizedKeys[0], direction: 'min' }, lp, categoryShares);
    const objectiveValues = Object.fromEntries(normalizedKeys.map(key => [key, metricValue(solution, key)]));
    const paretoOptimal = thetaDegrees > 0 && thetaDegrees < 90 && weights[0] > 0 && weights[1] > 0;
    points.push({
      thetaDegrees,
      weights: { [normalizedKeys[0]]: weights[0], [normalizedKeys[1]]: weights[1] },
      feasible: solution.feasible,
      paretoOptimal,
      objectiveValues,
      solution,
      lp,
    });
  }

  const feasiblePoints = points.filter(point => point.feasible);
  const paretoPoints = feasiblePoints.filter(point => point.paretoOptimal);
  return {
    objectives: normalizedKeys,
    stepDegrees,
    points,
    paretoPoints,
    ranges: buildParetoRanges(paretoPoints, normalizedKeys),
    sanity: boundarySanity(feasiblePoints, normalizedKeys),
  };
}

function buildLpDocument({ direction, objectiveExpression, foods, constraints, categoryShares }) {
  const lines = [direction, ` obj: ${objectiveExpression}`, 'Subject To'];
  lines.push(...constraintRows(foods, constraints, categoryShares));
  lines.push('Bounds');
  lines.push(...boundRows(foods));
  lines.push('End');
  return lines.join('\n');
}

function constraintRows(foods, constraints = {}, categoryShares = {}) {
  const lines = [];
  for (const [key, bounds] of Object.entries(constraints || {})) {
    const normalized = normalizeBounds(bounds);
    if (normalized.min != null) {
      lines.push(` ${constraintRowName(key, 'min')}: ${linearExpression(foods, key)} >= ${formatNumber(normalized.min)}`);
    }
    if (normalized.max != null) {
      lines.push(` ${constraintRowName(key, 'max')}: ${linearExpression(foods, key)} <= ${formatNumber(normalized.max)}`);
    }
  }

  lines.push(...categoryShareRows(foods, constraints, categoryShares));
  return lines;
}

function boundRows(foods) {
  return foods.map(food => {
    const bounds = normalizeBounds(food.servingBounds || { min: 0, max: food.maxServing ?? 10 });
    const variable = variableName(food.id);
    const lower = bounds.min ?? 0;
    if (bounds.max != null) return ` ${formatNumber(lower)} <= ${variable} <= ${formatNumber(bounds.max)}`;
    return ` ${formatNumber(lower)} <= ${variable}`;
  });
}

async function solveLpString(lp, foods, constraints, objective, categoryShares, options = {}) {
  const highs = await getHighs();
  const raw = highs.solve(lp);
  const result = normalizeResult(raw, foods, constraints, objective, lp, categoryShares);
  if (options.verifyDual && result.feasible) {
    result.dualVerification = verifyFirstBindingDual(highs, foods, constraints, objective, result, categoryShares);
  }
  return result;
}

function linearExpression(foods, key) {
  const terms = foods
    .map(food => ({ coefficient: coefficientFor(food, key), variable: variableName(food.id) }))
    .filter(term => Math.abs(term.coefficient) > TOLERANCE)
    .map(term => `${formatNumber(term.coefficient)} ${term.variable}`);
  return terms.length ? terms.join(' + ') : '0';
}

function weightedLinearExpression(foods, keys, weights) {
  const terms = foods
    .map(food => ({ coefficient: weightedCoefficientFor(food, keys, weights), variable: variableName(food.id) }))
    .filter(term => Math.abs(term.coefficient) > TOLERANCE)
    .map(term => `${formatNumber(term.coefficient)} ${term.variable}`);
  return terms.length ? terms.join(' + ') : '0';
}

function weightedCoefficientFor(food, keys, weights) {
  return keys.reduce((total, key, index) => total + toNumber(weights[index], 0) * coefficientFor(food, key), 0);
}

function categoryShareRows(foods, constraints = {}, categoryShares = {}) {
  const calorieBounds = normalizeBounds(constraints.calories || {});
  const calorieTarget = calorieBounds.max ?? calorieBounds.min;
  if (calorieTarget == null) return [];
  return Object.entries(categoryShares || {}).flatMap(([category, share]) => {
    const categoryFoods = foods.filter(food => (food.category || 'other') === category);
    if (categoryFoods.length === 0 || !Number.isFinite(Number(share)) || Number(share) < 0) return [];
    return [` cat_${sanitizeName(category)}_max: ${linearExpression(categoryFoods, 'calories')} <= ${formatNumber(Number(share) * calorieTarget)}`];
  });
}

function normalizeResult(raw, foods, constraints, objective, lp, categoryShares = {}) {
  if (raw.Status !== 'Optimal') return infeasibleResult(objective, raw, lp, hasCategoryShareConstraints(categoryShares) ? 'category-shares' : 'nutrient-bounds');

  const servingsByFoodId = {};
  const selectedFoods = [];
  const nutrientTotals = Object.fromEntries(NUTRIENTS.map(nutrient => [nutrient.key, 0]));
  let totalCost = 0;

  for (const food of foods) {
    const servings = raw.Columns?.[variableName(food.id)]?.Primal || 0;
    if (servings > TOLERANCE) {
      const roundedServings = round(servings);
      servingsByFoodId[food.id] = roundedServings;
      selectedFoods.push({ ...food, servings: roundedServings });
    }

    totalCost += servings * toNumber(food.cost, 0);
    for (const nutrient of NUTRIENTS) {
      nutrientTotals[nutrient.key] += servings * toNumber(food.nutrients?.[nutrient.key], 0);
    }
  }

  for (const key of Object.keys(nutrientTotals)) nutrientTotals[key] = round(nutrientTotals[key]);
  totalCost = round(totalCost);
  const objectiveValue = round(objective.nutrientKey === COST_KEY ? totalCost : nutrientTotals[objective.nutrientKey] ?? raw.ObjectiveValue ?? 0);

  return {
    feasible: true,
    bounded: true,
    solver: 'highs.js',
    objective,
    objectiveValue,
    result: objectiveValue,
    totalCost,
    nutrientTotals,
    servingsByFoodId,
    selectedFoods,
    dualValues: extractDualValues(raw, constraints),
    rawStatus: raw.Status,
    lp,
  };
}

function extractDualValues(raw, constraints) {
  const byRowName = Object.fromEntries((raw.Rows || []).map(row => [row.Name, row]));
  const dualValues = {};
  for (const [key, bounds] of Object.entries(constraints || {})) {
    const normalized = normalizeBounds(bounds);
    if (normalized.min != null) {
      const row = byRowName[constraintRowName(key, 'min')];
      if (row) dualValues[key] = { ...(dualValues[key] || {}), min: shadowPrice(row, normalized.min) };
    }
    if (normalized.max != null) {
      const row = byRowName[constraintRowName(key, 'max')];
      if (row) dualValues[key] = { ...(dualValues[key] || {}), max: shadowPrice(row, normalized.max) };
    }
  }
  return dualValues;
}

function shadowPrice(row, bound) {
  return { dual: round(Math.abs(row.Dual || 0)), rawDual: round(row.Dual || 0), value: round(row.Primal || 0), binding: Math.abs((row.Primal || 0) - bound) <= 1e-5 };
}

function verifyFirstBindingDual(highs, foods, constraints, objective, solution, categoryShares = {}) {
  const epsilon = 1;
  for (const [key, values] of Object.entries(solution.dualValues)) {
    for (const bound of ['min', 'max']) {
      const dual = values[bound];
      if (!dual?.binding || dual.dual <= TOLERANCE) continue;
      const perturbed = structuredCloneConstraints(constraints);
      if (!perturbed[key]) continue;
      perturbed[key][bound] = toNumber(perturbed[key][bound], 0) + (bound === 'min' ? epsilon : -epsilon);
      const raw = highs.solve(buildLpProblem(foods, perturbed, objective, categoryShares));
      if (raw.Status !== 'Optimal') continue;
      const next = normalizeResult(raw, foods, perturbed, objective, '', categoryShares);
      const actualDelta = round(Math.abs(next.objectiveValue - solution.objectiveValue));
      return { nutrientKey: key, bound, epsilon, lambda: dual.dual, predictedDelta: round(dual.dual * epsilon), actualDelta };
    }
  }
  return null;
}

function infeasibleResult(objective = DEFAULT_OBJECTIVE, raw = {}, lp = '', infeasibilityReason = 'nutrient-bounds') {
  return { feasible: false, bounded: raw.Status !== 'Unbounded', solver: 'highs.js', objective, objectiveValue: Number.POSITIVE_INFINITY, result: Number.POSITIVE_INFINITY, totalCost: Number.POSITIVE_INFINITY, nutrientTotals: {}, servingsByFoodId: {}, selectedFoods: [], dualValues: {}, dualVerification: null, rawStatus: raw.Status || 'Not solved', infeasibilityReason, lp };
}

function emptyTradeoffCurve(objectives, stepDegrees) {
  return { objectives, stepDegrees, points: [], paretoPoints: [], ranges: buildParetoRanges([], objectives), sanity: { closed: false, convex: false } };
}

function buildParetoRanges(points, keys) {
  return Object.fromEntries(keys.map(key => {
    const values = points.map(point => point.objectiveValues[key]).filter(value => Number.isFinite(value));
    return [key, values.length ? { min: Math.min(...values), max: Math.max(...values) } : { min: null, max: null }];
  }));
}

function boundarySanity(points, keys) {
  const xy = points
    .map(point => ({ x: point.objectiveValues[keys[0]], y: point.objectiveValues[keys[1]] }))
    .filter(point => Number.isFinite(point.x) && Number.isFinite(point.y));
  return { closed: xy.length >= 3, convex: isConvexBoundary(xy) };
}

function isConvexBoundary(points) {
  const unique = [];
  for (const point of points) {
    const previous = unique.at(-1);
    if (!previous || Math.abs(previous.x - point.x) > TOLERANCE || Math.abs(previous.y - point.y) > TOLERANCE) unique.push(point);
  }
  if (unique.length > 1) {
    const first = unique[0];
    const last = unique.at(-1);
    if (Math.abs(first.x - last.x) <= TOLERANCE && Math.abs(first.y - last.y) <= TOLERANCE) unique.pop();
  }
  if (unique.length < 3) return true;
  let sign = 0;
  for (let index = 0; index < unique.length; index += 1) {
    const a = unique[index];
    const b = unique[(index + 1) % unique.length];
    const c = unique[(index + 2) % unique.length];
    const cross = (b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x);
    if (Math.abs(cross) <= 1e-5) continue;
    const nextSign = Math.sign(cross);
    if (sign && nextSign !== sign) return false;
    sign = nextSign;
  }
  return true;
}

function metricValue(solution, key) {
  if (!solution.feasible) return Number.NaN;
  return key === COST_KEY ? solution.totalCost : solution.nutrientTotals[key] ?? Number.NaN;
}

function normalizeObjective(objective = DEFAULT_OBJECTIVE) {
  const nutrientKey = normalizeObjectiveKey(objective.nutrientKey);
  const direction = objective.direction === 'max' ? 'max' : 'min';
  return { nutrientKey, direction };
}

function normalizeObjectiveKeys(keys = []) {
  const normalized = keys.map(key => normalizeObjectiveKey(key));
  return [normalized[0] || COST_KEY, normalized[1] || DEFAULT_OBJECTIVE.nutrientKey];
}

function normalizeObjectiveKey(key) {
  return key === COST_KEY || NUTRIENT_BY_KEY[key] ? key : DEFAULT_OBJECTIVE.nutrientKey;
}

function normalizeStepDegrees(stepDegrees) {
  const parsed = Number(stepDegrees);
  if (!Number.isFinite(parsed) || parsed <= 0 || parsed > 180) return TRADEOFF_SWEEP_STEP_DEGREES;
  return parsed;
}

function sweepAngles(stepDegrees) {
  const angles = [];
  for (let theta = 0; theta < 360 - TOLERANCE; theta += stepDegrees) angles.push(round(theta));
  return angles;
}

function normalizeBounds(bounds = {}) {
  const normalized = {};
  const min = toOptionalNumber(bounds.min);
  const max = toOptionalNumber(bounds.max);
  if (min != null) normalized.min = min;
  if (max != null) normalized.max = max;
  return normalized;
}

function coefficientFor(food, key) {
  return key === COST_KEY ? toNumber(food.cost, 0) : toNumber(food.nutrients?.[key], 0);
}

function constraintRowName(key, bound) { return `c_${sanitizeName(key)}_${bound}`; }
function hasCategoryShareConstraints(categoryShares = {}) { return Object.values(categoryShares || {}).some(share => Number.isFinite(Number(share)) && Number(share) >= 0); }
function variableName(id) { return `food_${sanitizeName(id)}`; }
function sanitizeName(value) { return String(value).replace(/[^a-zA-Z0-9_]/g, '_'); }
function structuredCloneConstraints(constraints) { return JSON.parse(JSON.stringify(constraints || {})); }
function toOptionalNumber(value) { if (value === '' || value == null) return null; const parsed = Number(value); return Number.isFinite(parsed) ? parsed : null; }
function toNumber(value, fallback) { const parsed = toOptionalNumber(value); return parsed == null ? fallback : parsed; }
function formatNumber(value) { if (Object.is(value, -0)) return '0'; return String(round(value)); }
function round(value) { return Math.round(value * 10000) / 10000; }
