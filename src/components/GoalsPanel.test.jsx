import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import GoalsPanel from './GoalsPanel';

describe('GoalsPanel nutrient tiers', () => {
  it('shows only simple macro constraints by default', () => {
    render(<GoalsPanel constraints={{}} setConstraints={vi.fn()} />);

    expect(screen.getByRole('radio', { name: /simple/i })).toBeChecked();
    expect(screen.getByLabelText(/Protein minimum/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Sodium maximum/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/Vitamin C minimum/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Leucine minimum/i)).not.toBeInTheDocument();
  });

  it('shows the DRI-style medium set without amino acid and fatty acid detail', () => {
    render(<GoalsPanel constraints={{}} setConstraints={vi.fn()} />);

    fireEvent.click(screen.getByRole('radio', { name: /medium/i }));

    expect(screen.getByLabelText(/Vitamin C minimum/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Pantothenic acid minimum/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Biotin minimum/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Chromium minimum/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Molybdenum minimum/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/Leucine minimum/i)).not.toBeInTheDocument();
  });

  it('shows every mapped nutrient in the all tier', () => {
    render(<GoalsPanel constraints={{}} setConstraints={vi.fn()} />);

    fireEvent.click(screen.getByRole('radio', { name: /^all/i }));

    expect(screen.getByLabelText('Leucine minimum')).toBeInTheDocument();
    expect(screen.getByLabelText('EPA 20:5 n-3 minimum')).toBeInTheDocument();
    expect(screen.getByLabelText('Water minimum')).toBeInTheDocument();
  });
});
