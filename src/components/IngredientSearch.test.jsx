import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import IngredientSearch from './IngredientSearch';
import { searchFoods } from '../lib/foodApi';

vi.mock('../lib/foodApi', () => ({
  searchFoods: vi.fn(),
}));

describe('IngredientSearch', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('debounces live USDA searches as the user types', async () => {
    vi.useFakeTimers();
    searchFoods.mockResolvedValue([
      { id: '1', name: 'Eggs', dataType: 'SR Legacy', nutrients: { calories: 143, protein: 12, calcium: 56 } },
    ]);

    render(<IngredientSearch apiKey="key" onAdd={vi.fn()} />);

    fireEvent.change(screen.getByLabelText(/search ingredients/i), { target: { value: 'eggs' } });
    expect(searchFoods).not.toHaveBeenCalled();

    await act(async () => vi.advanceTimersByTimeAsync(299));
    expect(searchFoods).not.toHaveBeenCalled();

    await act(async () => vi.advanceTimersByTimeAsync(1));
    expect(searchFoods).toHaveBeenCalledWith('eggs', 'key');
    expect(screen.getByText('Eggs')).toBeInTheDocument();
  });

  it('shows a clear broader-term message for empty search results', async () => {
    vi.useFakeTimers();
    searchFoods.mockResolvedValue([]);

    render(<IngredientSearch apiKey="key" onAdd={vi.fn()} />);

    fireEvent.change(screen.getByLabelText(/search ingredients/i), { target: { value: 'very exact food' } });
    await act(async () => vi.advanceTimersByTimeAsync(300));

    expect(screen.getByText(/No USDA foods found/i)).toBeInTheDocument();
    expect(screen.getByText(/try a broader term/i)).toBeInTheDocument();
  });
});
