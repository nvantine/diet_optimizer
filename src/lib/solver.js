// solver.js
import solver from 'javascript-lp-solver';

export function buildAndSolve(foods, goals) {
  const { minCalories, minProtein, maxSodium } = goals;

  const model = {
    optimize: 'cost',
    opType: 'min',
    constraints: {
      calories: { min: minCalories || 0 },
      protein: { min: minProtein || 0 },
      sodium: { max: maxSodium ?? 1e9 },
    },
    variables: {},
  };

  foods.forEach(f => {
    model.variables[f.name] = {
      cost: f.cost,
      calories: f.calories,
      protein: f.protein,
      sodium: f.sodium,
      [f.name]: 1, // ties into the per-food max-serving constraint below
    };
    model.constraints[f.name] = { max: f.maxServing ?? 10 };
  });

  return solver.Solve(model); // { feasible, result, [foodName]: servings, ... }
}