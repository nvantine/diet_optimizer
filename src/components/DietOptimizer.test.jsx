import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import DietOptimizer from './DietOptimizer';

describe('DietOptimizer', () => {
  it('explains that body metrics are suggestions and not hidden constraints', () => {
    render(<DietOptimizer />);

    expect(screen.getByText(/dark-mode linear-programming diet planner/i)).toBeInTheDocument();
    expect(screen.getByText(/body metrics are optional/i)).toBeInTheDocument();
  });
});
