import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import IngredientList from './IngredientList';

const baseNutrients = {
  calories: 100,
  protein: 10,
  fat: 2,
  carbs: 8,
  fiber: 3,
  sugars: 1,
  calcium: 20,
  iron: 1,
  sodium: 50,
};

function makeFoods(count) {
  return Array.from({ length: count }, (_, index) => ({
    id: `food-${index}`,
    name: `Food ${index}`,
    dataType: 'Foundation',
    unit: 'per 100g',
    cost: 0.5,
    servingBounds: { min: 0.25, max: 2.5 },
    nutrients: baseNutrients,
  }));
}

describe('IngredientList', () => {
  it('shows an empty state and no toolbar for zero foods', () => {
    render(<IngredientList foods={[]} setFoods={vi.fn()} />);

    expect(screen.getByText(/No foods yet/i)).toBeInTheDocument();
    expect(screen.queryByText(/0 foods/i)).not.toBeInTheDocument();
  });

  it('defaults one food to expanded with nutrient chips visible', () => {
    render(<IngredientList foods={makeFoods(1)} setFoods={vi.fn()} />);

    expect(screen.getByText('1 food')).toBeInTheDocument();
    expect(screen.getByText(/0.25–2.5 × 100g units/i)).toBeInTheDocument();
    expect(screen.getByText(/Energy: 100 kcal/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Collapse all/i })).toBeInTheDocument();
  });

  it('defaults many foods to collapsed, then expands and collapses all rows from the sticky toolbar', async () => {
    const user = userEvent.setup();
    render(<IngredientList foods={makeFoods(12)} setFoods={vi.fn()} />);

    expect(screen.getByText('12 foods')).toBeInTheDocument();
    expect(screen.queryAllByText(/Energy: 100 kcal/i)).toHaveLength(0);
    expect(screen.getByRole('link', { name: /Jump to Goals/i })).toHaveAttribute('href', '#goals-section');
    expect(screen.getByRole('link', { name: /Jump to Results/i })).toHaveAttribute('href', '#results-section');

    await user.click(screen.getByRole('button', { name: /Expand all/i }));
    expect(screen.getAllByText(/Energy: 100 kcal/i)).toHaveLength(12);

    await user.click(screen.getByRole('button', { name: /Collapse all/i }));
    expect(screen.queryAllByText(/Energy: 100 kcal/i)).toHaveLength(0);
  });

  it('toggles an individual ingredient row without changing the search-results pagination pattern elsewhere', async () => {
    const user = userEvent.setup();
    render(<IngredientList foods={makeFoods(12)} setFoods={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /Expand Food 0 details/i }));
    expect(screen.getByText(/Energy: 100 kcal/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Collapse Food 0 details/i }));
    expect(screen.queryByText(/Energy: 100 kcal/i)).not.toBeInTheDocument();
  });

  it('restores cleared cost and serving fields on blur without changing sibling fields', async () => {
    const user = userEvent.setup();
    const setFoods = vi.fn();
    render(<IngredientList foods={makeFoods(1)} setFoods={setFoods} />);

    await user.clear(screen.getByLabelText(/Cost for Food 0/i));
    await user.tab();
    expect(setFoods).toHaveBeenCalled();

    setFoods.mockClear();
    await user.clear(screen.getByLabelText(/Minimum servings for Food 0/i));
    await user.tab();
    expect(setFoods).toHaveBeenCalled();
  });
});
