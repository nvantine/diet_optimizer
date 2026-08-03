import solver from 'javascript-lp-solver';

const DEFAULT_MAX_SODIUM = 1e9;

export function buildAndSolve(foods, goals) {
  if (!foods.length) {
    return normalizeResult({ feasible: false }, foods);
  }

  const model = {
    optimize: 'cost',
    opType: 'min',
    constraints: {
      calories: { min: toNumber(goals.minCalories, 0) },
      protein: { min: toNumber(goals.minProtein, 0) },
      sodium: { max: toNumber(goals.maxSodium, DEFAULT_MAX_SODIUM) },
    },
    variables: {},
  };

  for (const food of foods) {
    const variableKey = variableName(food.id);
    model.variables[variableKey] = {
      cost: toNumber(food.cost, 0),
      calories: toNumber(food.calories, 0),
      protein: toNumber(food.protein, 0),
      sodium: toNumber(food.sodium, 0),
      [variableKey]: 1,
    };
    model.constraints[variableKey] = { max: toNumber(food.maxServing, 10) };
  }

  return normalizeResult(solver.Solve(model), foods);
}

function normalizeResult(raw, foods) {
  if (!raw.feasible) {
    return {
      feasible: false,
      bounded: Boolean(raw.bounded),
      totalCost: Number.POSITIVE_INFINITY,
      result: Number.POSITIVE_INFINITY,
      servingsByFoodId: {},
    };
  }

  const servingsByFoodId = {};
  for (const food of foods) {
    const servings = raw[variableName(food.id)] || 0;
    if (servings > 1e-6) {
      servingsByFoodId[food.id] = round(servings);
    }
  }

  return {
    feasible: true,
    bounded: Boolean(raw.bounded),
    totalCost: round(raw.result || 0),
    result: round(raw.result || 0),
    servingsByFoodId,
  };
}

function variableName(id) {
  return `food_${String(id).replace(/[^a-zA-Z0-9_]/g, '_')}`;
}

function toNumber(value, fallback) {
  if (value === '' || value == null) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function round(value) {
  return Math.round(value * 10000) / 10000;
}
