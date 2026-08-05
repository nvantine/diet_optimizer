import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import DietOptimizer from './DietOptimizer';
import IngredientSearch from './IngredientSearch';

vi.mock('./IngredientSearch', () => ({ default: vi.fn(() => null) }));

describe('DietOptimizer', () => {
  beforeEach(() => { IngredientSearch.mockClear(); });

  it('uses USDA search and no longer shows body-weight or body-fat fields', () => {
    render(<DietOptimizer />);
    expect(screen.getByText(/USDA convex nutrition optimizer/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/USDA API key/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/Body weight/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Body fat/i)).not.toBeInTheDocument();
  });

  it('shows nutrient min and max constraint controls without shadow-price UI before a solution exists', () => {
    render(<DietOptimizer />);
    expect(screen.getByText(/Nutrient constraints/i)).toBeInTheDocument();
    expect(screen.getAllByLabelText(/minimum/i).length).toBeGreaterThan(2);
    expect(screen.getAllByLabelText(/maximum/i).length).toBeGreaterThan(2);
    expect(screen.queryByText(/Shadow prices/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/meal share/i)).not.toBeInTheDocument();
  });

  it('lets users choose minimize calories or minimize cost', async () => {
    const user = userEvent.setup();
    render(<DietOptimizer />);
    expect(screen.getByLabelText(/Optimization objective/i)).toHaveValue('calories');
    await user.selectOptions(screen.getByLabelText(/Optimization objective/i), 'cost');
    expect(screen.getByLabelText(/Optimization objective/i)).toHaveValue('cost');
  });

  it('passes selected food ids into IngredientSearch for already-added awareness', () => {
    render(<DietOptimizer />);
    expect(IngredientSearch).toHaveBeenCalledWith(expect.objectContaining({ existingIds: expect.any(Set) }), undefined);
  });

  it('starts empty without saved foods and can reset to the whole-foods preset with costs and caps', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<DietOptimizer />);
    expect(screen.getByText(/No foods yet/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Reset to whole-foods preset/i }));
    expect(screen.getByText(/Chicken breast/i)).toBeInTheDocument();
    const saved = JSON.parse(localStorage.getItem('diet-optimizer-foods'));
    expect(saved).toHaveLength(22);
    expect(saved.find(food => food.name === 'Chicken breast').cost).toBe(0.92);
    expect(saved.find(food => food.name === 'Olive oil').servingBounds.max).toBe(0.6);
  });

  it('loads saved foods from localStorage instead of the preset on page load', () => {
    localStorage.setItem('diet-optimizer-foods', JSON.stringify([{ id: 'saved-food', name: 'Saved lentils', dataType: 'Manual', unit: 'per 100g', cost: 0.25, servingBounds: { min: 0, max: 1 }, nutrients: { calories: 120, protein: 9 } }]));
    render(<DietOptimizer />);
    expect(screen.getByText(/Saved lentils/i)).toBeInTheDocument();
    expect(screen.queryByText(/Chicken breast/i)).not.toBeInTheDocument();
  });

  it('renders chart tabs and shadow-price explanations after solving', async () => {
    localStorage.setItem('diet-optimizer-foods', JSON.stringify([
      { id: 'protein-food', name: 'Protein food', dataType: 'Manual', unit: 'per 100g', cost: 2, servingBounds: { min: 0, max: 10 }, nutrients: { calories: 100, protein: 20, fat: 1, carbs: 1, fiber: 5, sodium: 1 } },
    ]));
    render(<DietOptimizer />);
    await waitFor(() => expect(screen.getByText(/Shadow prices/i)).toBeInTheDocument());
    expect(screen.getByRole('button', { name: /Macro donut/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Constraint radar/i })).toBeInTheDocument();
    expect(screen.getByText(/The shadow price on a constraint tells you/i)).toBeInTheDocument();
    expect(screen.getByText(/Dual check/i)).toBeInTheDocument();
  });
});
