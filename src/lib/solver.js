// solver.js
import solver from 'javascript-lp-solver';

export function buildAndSolve(foods, constraints) {
  const { minCalories, minProtein, maxSodium, maxServing } = constraints;

  const model = {
    optimize: 'cost',
    opType: 'min',
    constraints: {
      calories: { min: minCalories },
      protein:  { min: minProtein },
      sodium:   { max: maxSodium },
    },
    variables: {},
  };

  foods.forEach(f => {
    model.variables[f.name] = {
      cost: f.cost,
      calories: f.calories,
      protein: f.protein,
      sodium: f.sodium,
      [f.name]: 1, // for per-food serving cap constraint below
    };
    model.constraints[f.name] = { max: maxServing ?? 10 };
  });

  return solver.Solve(model); // { feasible, result, [foodName]: servings, ... }
}