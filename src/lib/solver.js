import highsLoader from 'highs';
import highsWasmUrl from 'highs/runtime?url';
import { NUTRIENTS, NUTRIENT_BY_KEY } from './nutrientMap';

const DEFAULT_OBJECTIVE = { nutrientKey: 'calories', direction: 'min' };
const TOLERANCE = 1e-6;
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
    return {
      wasmBinary: await readFile(join(process.cwd(), 'node_modules/highs/build/highs.wasm')),
    };
  }

  return {
    locateFile: () => highsWasmUrl,
  };
}

export async function buildAndSolve(foods, constraints = {}, objective = DEFAULT_OBJECTIVE) {
  const normalizedObjective = normalizeObjective(objective);
  if (!foods.length) return infeasibleResult(normalizedObjective);

  const lp = buildLpProblem(foods, constraints, normalizedObjective);
  const highs = await getHighs();
  const raw = highs.solve(lp);
  return normalizeResult(raw, foods, constraints, normalizedObjective, lp);
}

export function buildLpProblem(foods, constraints = {}, objective = DEFAULT_OBJECTIVE) {
  const normalizedObjective = normalizeObjective(objective);
  const lines = [
    normalizedObjective.direction === 'max' ? 'Maximize' : 'Minimize',
    ` obj: ${linearExpression(foods, normalizedObjective.nutrientKey)}`,
    'Subject To',
  ];

  for (const [key, bounds] of Object.entries(constraints || {})) {
    const normalized = normalizeBounds(bounds);
    if (normalized.min != null) {
      lines.push(` ${constraintRowName(key, 'min')}: ${linearExpression(foods, key)} >= ${formatNumber(normalized.min)}`);
    }
    if (normalized.max != null) {
      lines.push(` ${constraintRowName(key, 'max')}: ${linearExpression(foods, key)} <= ${formatNumber(normalized.max)}`);
    }
  }

  lines.push('Bounds');
  for (const food of foods) {
    const bounds = normalizeBounds(food.servingBounds || { min: 0, max: food.maxServing ?? 10 });
    const variable = variableName(food.id);
    const lower = bounds.min ?? 0;
    if (bounds.max != null) {
      lines.push(` ${formatNumber(lower)} <= ${variable} <= ${formatNumber(bounds.max)}`);
    } else {
      lines.push(` ${formatNumber(lower)} <= ${variable}`);
    }
  }
  lines.push('End');
  return lines.join('\n');
}

function linearExpression(foods, nutrientKey) {
  const terms = foods
    .map(food => ({ coefficient: toNumber(food.nutrients?.[nutrientKey], 0), variable: variableName(food.id) }))
    .filter(term => Math.abs(term.coefficient) > TOLERANCE)
    .map(term => `${formatNumber(term.coefficient)} ${term.variable}`);
  return terms.length ? terms.join(' + ') : '0';
}

function normalizeResult(raw, foods, constraints, objective, lp) {
  if (raw.Status !== 'Optimal') return infeasibleResult(objective, raw, lp);

  const servingsByFoodId = {};
  const selectedFoods = [];
  const nutrientTotals = Object.fromEntries(NUTRIENTS.map(nutrient => [nutrient.key, 0]));

  for (const food of foods) {
    const servings = raw.Columns?.[variableName(food.id)]?.Primal || 0;
    if (servings > TOLERANCE) {
      const roundedServings = round(servings);
      servingsByFoodId[food.id] = roundedServings;
      selectedFoods.push({ ...food, servings: roundedServings });
    }

    for (const nutrient of NUTRIENTS) {
      nutrientTotals[nutrient.key] += servings * toNumber(food.nutrients?.[nutrient.key], 0);
    }
  }

  for (const key of Object.keys(nutrientTotals)) {
    nutrientTotals[key] = round(nutrientTotals[key]);
  }

  const objectiveValue = round(nutrientTotals[objective.nutrientKey] ?? raw.ObjectiveValue ?? 0);
  return {
    feasible: true,
    bounded: true,
    solver: 'highs.js',
    objective,
    objectiveValue,
    result: objectiveValue,
    totalCost: 0,
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
  return {
    dual: round(Math.abs(row.Dual || 0)),
    rawDual: round(row.Dual || 0),
    value: round(row.Primal || 0),
    binding: Math.abs((row.Primal || 0) - bound) <= 1e-5,
  };
}

function infeasibleResult(objective = DEFAULT_OBJECTIVE, raw = {}, lp = '') {
  return {
    feasible: false,
    bounded: raw.Status !== 'Unbounded',
    solver: 'highs.js',
    objective,
    objectiveValue: Number.POSITIVE_INFINITY,
    result: Number.POSITIVE_INFINITY,
    totalCost: Number.POSITIVE_INFINITY,
    nutrientTotals: {},
    servingsByFoodId: {},
    selectedFoods: [],
    dualValues: {},
    rawStatus: raw.Status || 'Not solved',
    lp,
  };
}

function normalizeObjective(objective = DEFAULT_OBJECTIVE) {
  const nutrientKey = NUTRIENT_BY_KEY[objective.nutrientKey] ? objective.nutrientKey : DEFAULT_OBJECTIVE.nutrientKey;
  const direction = objective.direction === 'max' ? 'max' : 'min';
  return { nutrientKey, direction };
}

function normalizeBounds(bounds = {}) {
  const normalized = {};
  const min = toOptionalNumber(bounds.min);
  const max = toOptionalNumber(bounds.max);
  if (min != null) normalized.min = min;
  if (max != null) normalized.max = max;
  return normalized;
}

function constraintRowName(key, bound) {
  return `c_${sanitizeName(key)}_${bound}`;
}

function variableName(id) {
  return `food_${sanitizeName(id)}`;
}

function sanitizeName(value) {
  return String(value).replace(/[^a-zA-Z0-9_]/g, '_');
}

function toOptionalNumber(value) {
  if (value === '' || value == null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toNumber(value, fallback) {
  const parsed = toOptionalNumber(value);
  return parsed == null ? fallback : parsed;
}

function formatNumber(value) {
  if (Object.is(value, -0)) return '0';
  return String(round(value));
}

function round(value) {
  return Math.round(value * 10000) / 10000;
}
