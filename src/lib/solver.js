import highsLoader from 'highs';
import highsWasmUrl from 'highs/runtime?url';
import { NUTRIENTS, NUTRIENT_BY_KEY } from './nutrientMap';

export const MEALS = ['breakfast', 'lunch', 'dinner'];

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

export async function buildAndSolve(foods, constraints = {}, objective = DEFAULT_OBJECTIVE, mealShareLimits = {}) {
  const normalizedObjective = normalizeObjective(objective);
  if (!foods.length) return infeasibleResult(normalizedObjective);

  const lp = buildLpProblem(foods, constraints, normalizedObjective, mealShareLimits);
  const highs = await getHighs();
  const raw = highs.solve(lp);
  return normalizeResult(raw, foods, constraints, normalizedObjective, lp, mealShareLimits);
}

export function buildLpProblem(foods, constraints = {}, objective = DEFAULT_OBJECTIVE, mealShareLimits = {}) {
  const normalizedObjective = normalizeObjective(objective);
  const normalizedShares = normalizeMealShareLimits(mealShareLimits);
  const lines = [
    normalizedObjective.direction === 'max' ? 'Maximize' : 'Minimize',
    ` obj: ${dailyLinearExpression(foods, normalizedObjective.nutrientKey)}`,
    'Subject To',
  ];

  for (const [key, bounds] of Object.entries(constraints || {})) {
    const normalized = normalizeBounds(bounds);
    if (normalized.min != null) {
      lines.push(` ${constraintRowName(key, 'min')}: ${dailyLinearExpression(foods, key)} >= ${formatNumber(normalized.min)}`);
    }
    if (normalized.max != null) {
      lines.push(` ${constraintRowName(key, 'max')}: ${dailyLinearExpression(foods, key)} <= ${formatNumber(normalized.max)}`);
    }
  }

  for (const [key, alpha] of Object.entries(normalizedShares)) {
    for (const meal of MEALS) {
      lines.push(` ${mealShareRowName(key, meal)}: ${mealShareExpression(foods, key, meal, alpha)} <= 0`);
    }
  }

  lines.push('Bounds');
  for (const food of foods) {
    const bounds = normalizeBounds(food.servingBounds || { min: 0, max: food.maxServing ?? 10 });
    const lower = bounds.min ?? 0;
    for (const meal of MEALS) {
      const variable = variableName(food.id, meal);
      if (bounds.max != null) {
        lines.push(` ${formatNumber(lower)} <= ${variable} <= ${formatNumber(bounds.max)}`);
      } else {
        lines.push(` ${formatNumber(lower)} <= ${variable}`);
      }
    }
  }
  lines.push('End');
  return lines.join('\n');
}

function dailyLinearExpression(foods, nutrientKey) {
  return linearTerms(foods, nutrientKey).map(term => `${formatNumber(term.coefficient)} ${term.variable}`).join(' + ') || '0';
}

function mealShareExpression(foods, nutrientKey, cappedMeal, alpha) {
  const terms = [];
  for (const food of foods) {
    const nutrientAmount = toNumber(food.nutrients?.[nutrientKey], 0);
    if (Math.abs(nutrientAmount) <= TOLERANCE) continue;
    for (const meal of MEALS) {
      const coefficient = nutrientAmount * (meal === cappedMeal ? 1 - alpha : -alpha);
      if (Math.abs(coefficient) > TOLERANCE) {
        terms.push(`${formatNumber(coefficient)} ${variableName(food.id, meal)}`);
      }
    }
  }
  return terms.length ? terms.join(' + ') : '0';
}

function linearTerms(foods, nutrientKey) {
  return foods.flatMap(food => MEALS.map(meal => ({
    coefficient: toNumber(food.nutrients?.[nutrientKey], 0),
    variable: variableName(food.id, meal),
  }))).filter(term => Math.abs(term.coefficient) > TOLERANCE);
}

function normalizeResult(raw, foods, constraints, objective, lp, mealShareLimits = {}) {
  if (raw.Status !== 'Optimal') return infeasibleResult(objective, raw, lp, mealShareLimits);

  const mealServings = emptyMealMap({});
  const mealNutrientTotals = emptyMealMap(() => Object.fromEntries(NUTRIENTS.map(nutrient => [nutrient.key, 0])));
  const servingsByFoodId = {};
  const selectedMeals = [];
  const selectedFoods = [];
  const nutrientTotals = Object.fromEntries(NUTRIENTS.map(nutrient => [nutrient.key, 0]));

  for (const food of foods) {
    let totalServings = 0;
    for (const meal of MEALS) {
      const servings = raw.Columns?.[variableName(food.id, meal)]?.Primal || 0;
      if (servings > TOLERANCE) {
        const roundedServings = round(servings);
        mealServings[meal][food.id] = roundedServings;
        selectedMeals.push({ meal, ...food, servings: roundedServings });
        totalServings += servings;
      }

      for (const nutrient of NUTRIENTS) {
        const amount = servings * toNumber(food.nutrients?.[nutrient.key], 0);
        mealNutrientTotals[meal][nutrient.key] += amount;
        nutrientTotals[nutrient.key] += amount;
      }
    }

    if (totalServings > TOLERANCE) {
      const roundedTotal = round(totalServings);
      servingsByFoodId[food.id] = roundedTotal;
      selectedFoods.push({ ...food, servings: roundedTotal });
    }
  }

  for (const key of Object.keys(nutrientTotals)) {
    nutrientTotals[key] = round(nutrientTotals[key]);
  }
  for (const meal of MEALS) {
    for (const key of Object.keys(mealNutrientTotals[meal])) {
      mealNutrientTotals[meal][key] = round(mealNutrientTotals[meal][key]);
    }
  }

  const objectiveValue = round(nutrientTotals[objective.nutrientKey] ?? raw.ObjectiveValue ?? 0);
  return {
    feasible: true,
    bounded: true,
    solver: 'highs.js',
    meals: MEALS,
    objective,
    objectiveValue,
    result: objectiveValue,
    totalCost: 0,
    nutrientTotals,
    mealNutrientTotals,
    mealServings,
    servingsByFoodId,
    selectedFoods,
    selectedMeals,
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

function infeasibleResult(objective = DEFAULT_OBJECTIVE, raw = {}, lp = '', mealShareLimits = {}) {
  const hasMealShares = Object.keys(normalizeMealShareLimits(mealShareLimits)).length > 0;
  return {
    feasible: false,
    bounded: raw.Status !== 'Unbounded',
    solver: 'highs.js',
    meals: MEALS,
    objective,
    objectiveValue: Number.POSITIVE_INFINITY,
    result: Number.POSITIVE_INFINITY,
    totalCost: Number.POSITIVE_INFINITY,
    nutrientTotals: {},
    mealNutrientTotals: emptyMealMap({}),
    mealServings: emptyMealMap({}),
    servingsByFoodId: {},
    selectedFoods: [],
    selectedMeals: [],
    dualValues: {},
    rawStatus: raw.Status || 'Not solved',
    infeasibilityReason: hasMealShares ? 'meal-share' : 'nutrient-bounds',
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

function normalizeMealShareLimits(mealShareLimits = {}) {
  return Object.fromEntries(Object.entries(mealShareLimits || {})
    .map(([key, value]) => [key, toOptionalNumber(value)])
    .filter(([key, value]) => NUTRIENT_BY_KEY[key] && value != null && value > 0 && value <= 1));
}

function constraintRowName(key, bound) {
  return `c_${sanitizeName(key)}_${bound}`;
}

function mealShareRowName(key, meal) {
  return `meal_share_${sanitizeName(key)}_${sanitizeName(meal)}`;
}

function variableName(id, meal) {
  return `food_${sanitizeName(id)}_${sanitizeName(meal)}`;
}

function emptyMealMap(valueOrFactory) {
  return Object.fromEntries(MEALS.map(meal => [meal, typeof valueOrFactory === 'function' ? valueOrFactory(meal) : { ...valueOrFactory }]));
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
