import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import DietOptimizer from './DietOptimizer';

describe('DietOptimizer', () => {
  it('uses USDA search and no longer shows body-weight or body-fat fields', () => {
    render(<DietOptimizer />);

    expect(screen.getByText(/USDA convex nutrition optimizer/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/USDA API key/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/Body weight/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Body fat/i)).not.toBeInTheDocument();
  });

  it('shows nutrient min and max constraint controls without shadow-price UI', () => {
    render(<DietOptimizer />);

    expect(screen.getByText(/Nutrient constraints/i)).toBeInTheDocument();
    expect(screen.getAllByLabelText(/minimum/i).length).toBeGreaterThan(2);
    expect(screen.getAllByLabelText(/maximum/i).length).toBeGreaterThan(2);
    expect(screen.queryByText(/shadow prices/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Pareto/i)).not.toBeInTheDocument();
  });
});
