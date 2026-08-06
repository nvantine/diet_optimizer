import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import DietOptimizer from './DietOptimizer';
import IngredientSearch from './IngredientSearch';
import { buildAndSolve } from '../lib/solver';

vi.mock('../lib/foodApi', async importOriginal => {
  const actual = await importOriginal();
  return { ...actual, listRandomFoundationFoods: vi.fn() };
});

vi.mock('./IngredientSearch', () => ({ default: vi.fn(() => null) }));

vi.mock('../lib/solver', async importOriginal => {
  const actual = await importOriginal();
  return {
    ...actual,
    buildAndSolve: vi.fn(async (foods, constraints, objective) => ({
      feasible: true,
      solver: 'mock',
      objective,
      objectiveValue: 100,
      totalCost: 0,
      nutrientTotals: { calories: 100, protein: 20, fiber: 5, sodium: 10 },
      servingsByFoodId: { [foods[0]?.id]: 1 },
      selectedFoods: foods.slice(0, 1).map(food => ({ ...food, servings: 1 })),
      dualValues: {},
      rawStatus: 'Optimal',
    })),
  };
});

describe('DietOptimizer category share solving cadence', () => {
  it('does not trigger solver re-runs from pointer drags on the read-only treemap', async () => {
    IngredientSearch.mockClear();
    buildAndSolve.mockClear();
    localStorage.setItem('diet-optimizer-foods', JSON.stringify([
      { id: 'protein-food', name: 'Protein food', category: 'protein', dataType: 'Manual', unit: 'per 100g', cost: 0, servingBounds: { min: 0, max: 10 }, nutrients: { calories: 100, protein: 20, fat: 1, carbs: 1, fiber: 5, sodium: 1 } },
      { id: 'grain-food', name: 'Grain food', category: 'grain', dataType: 'Manual', unit: 'per 100g', cost: 0, servingBounds: { min: 0, max: 10 }, nutrients: { calories: 120, protein: 3, fat: 1, carbs: 20, fiber: 2, sodium: 1 } },
    ]));

    render(<DietOptimizer />);
    await waitFor(() => expect(buildAndSolve).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByLabelText(/Category calorie share treemap/i)).toHaveAttribute('aria-disabled', 'false'));
    buildAndSolve.mockClear();

    const treemap = screen.getByLabelText(/Category calorie share treemap/i);
    fireEvent.pointerDown(treemap, { clientY: 30 });
    fireEvent.pointerMove(window, { clientY: 40 });
    fireEvent.pointerMove(window, { clientY: 60 });
    expect(buildAndSolve).not.toHaveBeenCalled();

    fireEvent.pointerUp(window);
    expect(buildAndSolve).not.toHaveBeenCalled();
  });

  it('triggers one solver re-run for one category-share number input edit', async () => {
    IngredientSearch.mockClear();
    buildAndSolve.mockClear();
    localStorage.setItem('diet-optimizer-foods', JSON.stringify([
      { id: 'protein-food', name: 'Protein food', category: 'protein', dataType: 'Manual', unit: 'per 100g', cost: 0, servingBounds: { min: 0, max: 10 }, nutrients: { calories: 100, protein: 20, fat: 1, carbs: 1, fiber: 5, sodium: 1 } },
      { id: 'grain-food', name: 'Grain food', category: 'grain', dataType: 'Manual', unit: 'per 100g', cost: 0, servingBounds: { min: 0, max: 10 }, nutrients: { calories: 120, protein: 3, fat: 1, carbs: 20, fiber: 2, sodium: 1 } },
    ]));

    render(<DietOptimizer />);
    await waitFor(() => expect(buildAndSolve).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByLabelText(/Protein max calorie share/i)).toBeEnabled());
    buildAndSolve.mockClear();

    fireEvent.change(screen.getByLabelText(/Protein max calorie share/i), { target: { value: '60' } });

    await waitFor(() => expect(buildAndSolve).toHaveBeenCalledTimes(1));
  });
});
