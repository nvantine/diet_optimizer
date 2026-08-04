import solver from 'javascript-lp-solver';
import { NUTRIENTS } from './nutrientMap';

export function buildAndSolve(foods, constraints = {}) {
  if (!foods.length) return normalizeResult({ feasible: false }, foods);

  const model = {
    optimize: 'calories',
    opType: 'min',
    constraints: buildConstraints(foods, constraints),
    variables: {},
  };

  for (const food of foods) {
    const key = variableName(food.id);
    const nutrients = food.nutrients || {};
    model.variables[key] = {
      calories: toNumber(nutrients.calories, 0),
      [key]: 1,
    };

    for (const nutrient of NUTRIENTS) {
      model.variables[key][nutrient.key] = toNumber(nutrients[nutrient.key], 0);
    }
  }

  return normalizeResult(solver.Solve(model), foods);
}

function buildConstraints(foods, constraints) {
  const modelConstraints = {};

  for (const [key, bounds] of Object.entries(constraints || {})) {
    const normalized = normalizeBounds(bounds);
    if (normalized.min != null || normalized.max != null) {
      modelConstraints[key] = normalized;
    }
  }

  for (const food of foods) {
    const bounds = normalizeBounds(food.servingBounds || { min: 0, max: food.maxServing ?? 10 });
    const variable = variableName(food.id);
    modelConstraints[variable] = {};
    if (bounds.min != null) modelConstraints[variable].min = bounds.min;
    if (bounds.max != null) modelConstraints[variable].max = bounds.max;
  }

  return modelConstraints;
}

function normalizeResult(raw, foods) {
  if (!raw.feasible) {
    return {
      feasible: false,
      bounded: Boolean(raw.bounded),
      objective: 'calories',
      objectiveValue: Number.POSITIVE_INFINITY,
      result: Number.POSITIVE_INFINITY,
      totalCost: Number.POSITIVE_INFINITY,
      nutrientTotals: {},
      servingsByFoodId: {},
      selectedFoods: [],
    };
  }

  const servingsByFoodId = {};
  const selectedFoods = [];
  const nutrientTotals = Object.fromEntries(NUTRIENTS.map(nutrient => [nutrient.key, 0]));

  for (const food of foods) {
    const servings = raw[variableName(food.id)] || 0;
    if (servings > 1e-6) {
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

  const objectiveValue = round(raw.result || nutrientTotals.calories || 0);
  return {
    feasible: true,
    bounded: Boolean(raw.bounded),
    objective: 'calories',
    objectiveValue,
    result: objectiveValue,
    totalCost: 0,
    nutrientTotals,
    servingsByFoodId,
    selectedFoods,
  };
}

function normalizeBounds(bounds = {}) {
  const normalized = {};
  const min = toOptionalNumber(bounds.min);
  const max = toOptionalNumber(bounds.max);
  if (min != null) normalized.min = min;
  if (max != null) normalized.max = max;
  return normalized;
}

function variableName(id) {
  return `food_${String(id).replace(/[^a-zA-Z0-9_]/g, '_')}`;
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

function round(value) {
  return Math.round(value * 10000) / 10000;
}
