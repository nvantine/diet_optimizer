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
  it('does not trigger solver re-runs during category-share pointermove, only after pointerup', async () => {
    IngredientSearch.mockClear();
    buildAndSolve.mockClear();
    localStorage.setItem('diet-optimizer-foods', JSON.stringify([
      { id: 'protein-food', name: 'Protein food', category: 'protein', dataType: 'Manual', unit: 'per 100g', cost: 0, servingBounds: { min: 0, max: 10 }, nutrients: { calories: 100, protein: 20, fat: 1, carbs: 1, fiber: 5, sodium: 1 } },
      { id: 'grain-food', name: 'Grain food', category: 'grain', dataType: 'Manual', unit: 'per 100g', cost: 0, servingBounds: { min: 0, max: 10 }, nutrients: { calories: 120, protein: 3, fat: 1, carbs: 20, fiber: 2, sodium: 1 } },
    ]));

    render(<DietOptimizer />);
    await waitFor(() => expect(buildAndSolve).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByLabelText(/Category calorie share bar/i)).toHaveAttribute('aria-disabled', 'false'));
    buildAndSolve.mockClear();

    const bar = screen.getByLabelText(/Category calorie share bar/i);
    Object.defineProperty(bar, 'getBoundingClientRect', { configurable: true, value: () => ({ top: 0, height: 100, left: 0, width: 20 }) });

    fireEvent.pointerDown(screen.getByRole('button', { name: /Adjust Protein share/i }), { clientY: 30 });
    fireEvent.pointerMove(window, { clientY: 40 });
    fireEvent.pointerMove(window, { clientY: 60 });
    expect(buildAndSolve).not.toHaveBeenCalled();

    fireEvent.pointerUp(window);
    await waitFor(() => expect(buildAndSolve).toHaveBeenCalledTimes(1));
  });
});
