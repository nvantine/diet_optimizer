import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import IngredientSearch from './IngredientSearch';
import { searchFoods } from '../lib/foodApi';

vi.mock('../lib/foodApi', () => ({
  USDA_DATA_TYPES: {
    foundationOnly: 'Foundation',
    foundationAndSrLegacy: 'Foundation,SR Legacy',
  },
  searchFoods: vi.fn(),
}));

function food(index, dataType = 'Foundation') {
  return {
    id: String(index),
    name: `Food ${index}`,
    dataType,
    nutrients: { calories: 100 + index, protein: 10, calcium: 20 },
  };
}

describe('IngredientSearch', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('debounces live USDA searches as the user types and defaults to Foundation only', async () => {
    vi.useFakeTimers();
    searchFoods.mockResolvedValue([
      { id: '1', name: 'Eggs', dataType: 'Foundation', nutrients: { calories: 143, protein: 12, calcium: 56 } },
    ]);

    render(<IngredientSearch apiKey="key" onAdd={vi.fn()} />);

    fireEvent.change(screen.getByLabelText(/search ingredients/i), { target: { value: 'eggs' } });
    expect(searchFoods).not.toHaveBeenCalled();

    await act(async () => vi.advanceTimersByTimeAsync(299));
    expect(searchFoods).not.toHaveBeenCalled();

    await act(async () => vi.advanceTimersByTimeAsync(1));
    expect(searchFoods).toHaveBeenCalledWith('eggs', 'key', 'Foundation');
    expect(screen.getByText('Eggs')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Live search|Searching/i })).not.toBeInTheDocument();
  });

  it('lets the user include SR Legacy foods without the old long explanatory phrase', async () => {
    vi.useFakeTimers();
    searchFoods.mockResolvedValue([food(1, 'SR Legacy')]);

    render(<IngredientSearch apiKey="key" onAdd={vi.fn()} />);

    fireEvent.change(screen.getByLabelText(/USDA data type/i), { target: { value: 'Foundation,SR Legacy' } });
    fireEvent.change(screen.getByLabelText(/search ingredients/i), { target: { value: 'oats' } });
    await act(async () => vi.advanceTimersByTimeAsync(300));

    expect(searchFoods).toHaveBeenCalledWith('oats', 'key', 'Foundation,SR Legacy');
    expect(screen.getByLabelText(/USDA data type/i)).toHaveValue('Foundation,SR Legacy');
    expect(screen.queryByText(/expands coverage/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/older or less detailed/i)).not.toBeInTheDocument();
  });

  it('can hide its data type selector so the parent layout can align it with list actions', () => {
    render(<IngredientSearch apiKey="key" onAdd={vi.fn()} showDataTypeFilter={false} />);

    expect(screen.queryByLabelText(/USDA data type/i)).not.toBeInTheDocument();
  });

  it('shows a small visual gap between result food names and their data type pill', async () => {
    vi.useFakeTimers();
    searchFoods.mockResolvedValue([food(1)]);

    render(<IngredientSearch apiKey="key" onAdd={vi.fn()} />);
    fireEvent.change(screen.getByLabelText(/search ingredients/i), { target: { value: 'food' } });
    await act(async () => vi.advanceTimersByTimeAsync(300));

    const heading = screen.getByText('Food 1').closest('.result-heading');
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveClass('result-heading');
  });

  it('shows the first 12 results and reveals the remaining loaded results client-side', async () => {
    vi.useFakeTimers();
    searchFoods.mockResolvedValue(Array.from({ length: 16 }, (_, index) => food(index + 1)));

    render(<IngredientSearch apiKey="key" onAdd={vi.fn()} />);
    fireEvent.change(screen.getByLabelText(/search ingredients/i), { target: { value: 'many foods' } });
    await act(async () => vi.advanceTimersByTimeAsync(300));

    expect(screen.getByText('Food 1')).toBeInTheDocument();
    expect(screen.getByText('Food 12')).toBeInTheDocument();
    expect(screen.queryByText('Food 13')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /show more/i })).toHaveTextContent('Show more results');

    fireEvent.click(screen.getByRole('button', { name: /show more/i }));

    expect(screen.getByText('Food 13')).toBeInTheDocument();
    expect(screen.getByText('Food 16')).toBeInTheDocument();
  });

  it('shows already-added status for search results whose ids are in the food list', async () => {
    vi.useFakeTimers();
    searchFoods.mockResolvedValue([food(1), food(2)]);

    render(<IngredientSearch apiKey="key" existingIds={new Set(['1'])} onAdd={vi.fn()} />);
    fireEvent.change(screen.getByLabelText(/search ingredients/i), { target: { value: 'food' } });
    await act(async () => vi.advanceTimersByTimeAsync(300));

    expect(screen.getByText('Already added')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /^add$/i })).toHaveLength(1);
  });

  it('shows a temporary confirmation toast after adding a search result', async () => {
    vi.useFakeTimers();
    const onAdd = vi.fn();
    searchFoods.mockResolvedValue([food(1)]);

    render(<IngredientSearch apiKey="key" existingIds={new Set()} onAdd={onAdd} />);
    fireEvent.change(screen.getByLabelText(/search ingredients/i), { target: { value: 'food' } });
    await act(async () => vi.advanceTimersByTimeAsync(300));

    fireEvent.click(screen.getByRole('button', { name: /^add$/i }));

    expect(onAdd).toHaveBeenCalledWith(expect.objectContaining({ id: '1', name: 'Food 1' }));
    expect(screen.getByText('Added Food 1 to your list')).toBeInTheDocument();

    await act(async () => vi.advanceTimersByTimeAsync(2000));
    expect(screen.queryByText('Added Food 1 to your list')).not.toBeInTheDocument();
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
