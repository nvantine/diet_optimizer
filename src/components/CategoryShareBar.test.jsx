import { render, screen } from '@testing-library/react';
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
    expect(screen.getByLabelText(/Category calorie share bar/i)).toHaveAttribute('aria-disabled', 'true');
  });

  it('lets a segment label switch to exact percentage editing', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<CategoryShareBar foods={[{ id: 'a', category: 'protein' }, { id: 'b', category: 'grain' }]} shares={{ protein: 40, grain: 60 }} onChange={onChange} calorieTarget={2000} />);

    await user.click(screen.getByRole('button', { name: /Edit Protein share/i }));
    const input = screen.getByLabelText(/Protein exact share/i);
    await user.clear(input);
    await user.type(input, '55');
    await user.tab();

    expect(onChange).toHaveBeenLastCalledWith({ protein: 55, grain: 45 });
  });
});
