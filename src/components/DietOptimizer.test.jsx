import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import DietOptimizer from './DietOptimizer';
import IngredientSearch from './IngredientSearch';

vi.mock('./IngredientSearch', () => ({
  default: vi.fn(() => null),
}));

describe('DietOptimizer', () => {
  beforeEach(() => {
    IngredientSearch.mockClear();
  });

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
    expect(screen.queryByText(/Pareto/i)).not.toBeInTheDocument();
  });

  it('lets users choose which nutrient to minimize or maximize', async () => {
    const user = userEvent.setup();
    render(<DietOptimizer />);

    expect(screen.getByLabelText(/Objective direction/i)).toHaveValue('min');
    expect(screen.getByLabelText(/Objective nutrient/i)).toHaveValue('calories');

    await user.selectOptions(screen.getByLabelText(/Objective direction/i), 'max');
    await user.selectOptions(screen.getByLabelText(/Objective nutrient/i), 'protein');

    expect(screen.getByLabelText(/Objective direction/i)).toHaveValue('max');
    expect(screen.getByLabelText(/Objective nutrient/i)).toHaveValue('protein');
  });

  it('passes selected food ids into IngredientSearch for already-added awareness', () => {
    render(<DietOptimizer />);

    expect(IngredientSearch).toHaveBeenCalledWith(
      expect.objectContaining({ existingIds: expect.any(Set) }),
      undefined,
    );
  });
});
