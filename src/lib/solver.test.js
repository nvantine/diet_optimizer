import { describe, expect, it } from 'vitest';
import { buildAndSolve } from './solver';

const constraints = {
  calories: { max: 500 },
  protein: { min: 30 },
  calcium: { min: 200 },
};

describe('buildAndSolve', () => {
  it('does not use food cost in the phase-1 objective', () => {
    const foods = [
      { id: 'cheap-high-cal', name: 'Cheap high calorie', cost: 0.01, nutrients: { calories: 200, protein: 10, calcium: 10 }, servingBounds: { min: 0, max: 10 } },
      { id: 'expensive-low-cal', name: 'Expensive low calorie', cost: 100, nutrients: { calories: 50, protein: 10, calcium: 100 }, servingBounds: { min: 0, max: 10 } },
    ];

    const solution = buildAndSolve(foods, constraints);

    expect(solution.feasible).toBe(true);
    expect(solution.objective).toBe('calories');
    expect(solution.servingsByFoodId['expensive-low-cal']).toBeGreaterThan(0);
    expect(solution.nutrientTotals.protein).toBeGreaterThanOrEqual(30);
    expect(solution.nutrientTotals.calcium).toBeGreaterThanOrEqual(200);
  });

  it('honors min and max serving bounds per food', () => {
    const foods = [
      { id: 'required', name: 'Required', nutrients: { calories: 10, protein: 1, calcium: 5 }, servingBounds: { min: 2, max: 2 } },
      { id: 'helper', name: 'Helper', nutrients: { calories: 20, protein: 20, calcium: 200 }, servingBounds: { min: 0, max: 10 } },
    ];

    const solution = buildAndSolve(foods, { protein: { min: 1 } });

    expect(solution.feasible).toBe(true);
    expect(solution.servingsByFoodId.required).toBe(2);
  });

  it('reports infeasible when constraints cannot be satisfied', () => {
    const foods = [
      { id: 'lettuce', name: 'Lettuce', nutrients: { calories: 10, protein: 1, calcium: 5 }, servingBounds: { min: 0, max: 1 } },
    ];

    const solution = buildAndSolve(foods, { protein: { min: 100 } });

    expect(solution.feasible).toBe(false);
    expect(solution.servingsByFoodId).toEqual({});
  });
});
