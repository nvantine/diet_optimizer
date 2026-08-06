import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import CategoryShareBar from './CategoryShareBar';
import { defaultSharesForCategories } from '../lib/categoryShares';

describe('CategoryShareBar', () => {
  it('redistributes default shares only among categories present in the food list', () => {
    const shares = defaultSharesForCategories(['protein', 'grain']);
    expect(Math.round(shares.protein)).toBe(33);
    expect(Math.round(shares.grain)).toBe(67);
    expect(Object.keys(shares)).toEqual(['protein', 'grain']);
  });

  it('is disabled until a calorie target exists', () => {
    render(<CategoryShareBar foods={[{ id: 'a', category: 'protein' }]} shares={{ protein: 100 }} onChange={vi.fn()} calorieTarget={null} />);
    expect(screen.getByText(/Set a calorie target in Goals to enable category limits/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Category calorie share treemap/i)).toHaveAttribute('aria-disabled', 'true');
  });

  it('renders a read-only treemap and always-visible numeric inputs for present categories', () => {
    render(<CategoryShareBar foods={[{ id: 'a', category: 'protein' }, { id: 'b', category: 'grain' }]} shares={{ protein: 40, grain: 60 }} onChange={vi.fn()} calorieTarget={2000} />);

    expect(screen.getByLabelText(/Category calorie share treemap/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/Category calorie share bar/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Adjust Protein share/i })).not.toBeInTheDocument();
    expect(screen.getByLabelText(/Protein max calorie share/i)).toHaveValue(40);
    expect(screen.getByLabelText(/Grain max calorie share/i)).toHaveValue(60);
  });

  it('commits numeric share edits through the existing normalization callback', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<CategoryShareBar foods={[{ id: 'a', category: 'protein' }, { id: 'b', category: 'grain' }]} shares={{ protein: 40, grain: 60 }} onChange={onChange} calorieTarget={2000} />);

    const input = screen.getByLabelText(/Protein max calorie share/i);
    await user.clear(input);
    await user.type(input, '55');

    expect(onChange).toHaveBeenLastCalledWith({ protein: 55, grain: 45 });
  });

  it('does not commit while a pointer moves over the read-only treemap', () => {
    const onChange = vi.fn();
    render(<CategoryShareBar foods={[{ id: 'a', category: 'protein' }, { id: 'b', category: 'grain' }]} shares={{ protein: 40, grain: 60 }} onChange={onChange} calorieTarget={2000} />);
    const treemap = screen.getByLabelText(/Category calorie share treemap/i);

    fireEvent.pointerDown(treemap, { clientY: 40 });
    fireEvent.pointerMove(window, { clientY: 55 });
    fireEvent.pointerMove(window, { clientY: 65 });
    fireEvent.pointerUp(window);

    expect(onChange).not.toHaveBeenCalled();
  });
});
