import { describe, expect, it } from 'vitest';
import { buildAndSolve } from './solver';

const constraints = {
  calories: { max: 500 },
  protein: { min: 30 },
  calcium: { min: 200 },
};

describe('buildAndSolve', () => {
  it('uses highs.js to minimize calories while tracking cost separately', async () => {
    const foods = [
      { id: 'cheap-high-cal', name: 'Cheap high calorie', cost: 0.01, nutrients: { calories: 200, protein: 10, calcium: 10 }, servingBounds: { min: 0, max: 10 } },
      { id: 'expensive-low-cal', name: 'Expensive low calorie', cost: 100, nutrients: { calories: 50, protein: 10, calcium: 100 }, servingBounds: { min: 0, max: 10 } },
    ];

    const solution = await buildAndSolve(foods, constraints, { nutrientKey: 'calories', direction: 'min' });

    expect(solution.feasible).toBe(true);
    expect(solution.solver).toBe('highs.js');
    expect(solution.objective).toEqual({ nutrientKey: 'calories', direction: 'min' });
    expect(solution.servingsByFoodId['expensive-low-cal']).toBeGreaterThan(0);
    expect(solution.nutrientTotals.protein).toBeGreaterThanOrEqual(30);
    expect(solution.nutrientTotals.calcium).toBeGreaterThanOrEqual(200);
    expect(solution.totalCost).toBeGreaterThan(0);
  });

  it('can minimize cost using per-100g food costs', async () => {
    const foods = [
      { id: 'cheap', name: 'Cheap', cost: 1, nutrients: { calories: 200, protein: 10 }, servingBounds: { min: 0, max: 10 } },
      { id: 'expensive', name: 'Expensive', cost: 5, nutrients: { calories: 50, protein: 10 }, servingBounds: { min: 0, max: 10 } },
    ];

    const solution = await buildAndSolve(foods, { protein: { min: 20 }, calories: { max: 500 } }, { nutrientKey: 'cost', direction: 'min' });

    expect(solution.feasible).toBe(true);
    expect(solution.objective).toEqual({ nutrientKey: 'cost', direction: 'min' });
    expect(solution.servingsByFoodId.cheap).toBeCloseTo(2, 4);
    expect(solution.totalCost).toBeCloseTo(2, 4);
    expect(solution.objectiveValue).toBeCloseTo(solution.totalCost, 4);
  });

  it('can maximize a selected nutrient subject to all active min/max bounds', async () => {
    const foods = [
      { id: 'lean', name: 'Lean', nutrients: { calories: 100, protein: 30, fat: 2 }, servingBounds: { min: 0, max: 10 } },
      { id: 'fatty', name: 'Fatty', nutrients: { calories: 100, protein: 5, fat: 20 }, servingBounds: { min: 0, max: 10 } },
    ];

    const solution = await buildAndSolve(foods, { calories: { max: 300 }, fat: { max: 10 } }, { nutrientKey: 'protein', direction: 'max' });

    expect(solution.feasible).toBe(true);
    expect(solution.objective).toEqual({ nutrientKey: 'protein', direction: 'max' });
    expect(solution.objectiveValue).toBeCloseTo(90, 4);
    expect(solution.nutrientTotals.calories).toBeLessThanOrEqual(300);
    expect(solution.nutrientTotals.fat).toBeLessThanOrEqual(10);
    expect(solution.servingsByFoodId.lean).toBeCloseTo(3, 4);
  });

  it('exposes shadow prices and perturbation verification for binding constraints', async () => {
    const foods = [
      { id: 'protein-food', name: 'Protein food', cost: 2, nutrients: { calories: 100, protein: 10 }, servingBounds: { min: 0, max: 10 } },
      { id: 'calorie-food', name: 'Calorie food', cost: 1, nutrients: { calories: 10, protein: 0 }, servingBounds: { min: 0, max: 10 } },
    ];

    const solution = await buildAndSolve(foods, { protein: { min: 20 } }, { nutrientKey: 'cost', direction: 'min' });

    expect(solution.feasible).toBe(true);
    expect(solution.nutrientTotals.protein).toBeCloseTo(20, 4);
    expect(solution.dualValues.protein.min.binding).toBe(true);
    expect(solution.dualValues.protein.min.dual).toBeGreaterThan(0);
    expect(solution.dualVerification).toEqual(expect.objectContaining({ nutrientKey: 'protein', bound: 'min', epsilon: 1 }));
    expect(solution.dualVerification.predictedDelta).toBeCloseTo(solution.dualVerification.actualDelta, 3);
  });

  it('honors min and max serving bounds once per food per day', async () => {
    const foods = [
      { id: 'required', name: 'Required', nutrients: { calories: 10, protein: 1, calcium: 5 }, servingBounds: { min: 2, max: 2 } },
      { id: 'helper', name: 'Helper', nutrients: { calories: 20, protein: 20, calcium: 200 }, servingBounds: { min: 0, max: 10 } },
    ];

    const solution = await buildAndSolve(foods, { protein: { min: 1 } });

    expect(solution.feasible).toBe(true);
    expect(solution.servingsByFoodId.required).toBe(2);
    expect(solution.mealServings).toBeUndefined();
    expect(solution.lp).not.toContain('breakfast');
  });

  it('reports infeasible when constraints cannot be satisfied', async () => {
    const foods = [
      { id: 'lettuce', name: 'Lettuce', nutrients: { calories: 10, protein: 1, calcium: 5 }, servingBounds: { min: 0, max: 1 } },
    ];

    const solution = await buildAndSolve(foods, { protein: { min: 100 } });

    expect(solution.feasible).toBe(false);
    expect(solution.servingsByFoodId).toEqual({});
    expect(solution.infeasibilityReason).toBe('nutrient-bounds');
  });
});
