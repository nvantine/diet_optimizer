import { describe, expect, it } from 'vitest';
import { buildAndSolve } from './solver';

const baseGoals = { minCalories: 300, minProtein: 0, maxSodium: 100000 };

describe('buildAndSolve', () => {
  it('returns servings keyed by food id so duplicate names do not collide', () => {
    const foods = [
      { id: 'cheap', name: 'Same', cost: 0.5, calories: 200, protein: 1, sodium: 10, maxServing: 10 },
      { id: 'expensive', name: 'Same', cost: 1, calories: 100, protein: 10, sodium: 10, maxServing: 10 },
    ];

    const solution = buildAndSolve(foods, baseGoals);

    expect(solution.feasible).toBe(true);
    expect(solution.totalCost).toBeCloseTo(0.75);
    expect(solution.servingsByFoodId).toEqual({ cheap: 1.5 });
  });

  it('reports infeasible when constraints cannot be satisfied', () => {
    const foods = [
      { id: 'lettuce', name: 'Lettuce', cost: 1, calories: 10, protein: 1, sodium: 5, maxServing: 1 },
    ];

    const solution = buildAndSolve(foods, { minCalories: 1000, minProtein: 100, maxSodium: 10 });

    expect(solution.feasible).toBe(false);
    expect(solution.servingsByFoodId).toEqual({});
  });
});
