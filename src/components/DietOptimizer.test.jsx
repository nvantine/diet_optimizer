import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import DietOptimizer from './DietOptimizer';
import IngredientSearch from './IngredientSearch';
import { listRandomFoundationFoods } from '../lib/foodApi';

vi.mock('../lib/foodApi', async importOriginal => {
  const actual = await importOriginal();
  return { ...actual, listRandomFoundationFoods: vi.fn() };
});

vi.mock('./IngredientSearch', () => ({
  default: vi.fn(() => null),
  DataTypeFilter: vi.fn(({ dataType, onChange }) => (
    <label className="data-type-filter" htmlFor="usda-data-type">
      <span>USDA data type</span>
      <select id="usda-data-type" value={dataType} onChange={event => onChange(event.target.value)}>
        <option value="Foundation">Foundation only</option>
        <option value="Foundation,SR Legacy">Foundation + SR Legacy</option>
      </select>
    </label>
  )),
}));

describe('DietOptimizer', () => {
  beforeEach(() => {
    IngredientSearch.mockReset();
    IngredientSearch.mockImplementation(() => null);
    listRandomFoundationFoods.mockReset();
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
    expect(screen.queryByText(/meal share/i)).not.toBeInTheDocument();
  });

  it('lets users choose an objective nutrient and whether to minimize or maximize it', async () => {
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
    expect(IngredientSearch).toHaveBeenCalledWith(expect.objectContaining({ existingIds: expect.any(Set) }), undefined);
  });

  it('places live search in the right ingredient-list column above the food list and shows an ingredient count', () => {
    localStorage.setItem('diet-optimizer-foods', JSON.stringify([{ id: 'saved-food', name: 'Saved lentils', dataType: 'Manual', unit: 'per 100g', cost: 0.25, servingBounds: { min: 0, max: 1 }, nutrients: { calories: 120, protein: 9 } }]));
    IngredientSearch.mockImplementation(() => <div data-testid="mock-search">Mock search</div>);

    render(<DietOptimizer />);

    const controls = document.querySelector('.ingredient-controls');
    const panel = document.querySelector('.ingredient-list-panel');
    expect(controls.querySelector('[data-testid="mock-search"]')).toBeNull();
    expect(panel.querySelector('[data-testid="mock-search"]')).toBeTruthy();
    expect(panel.querySelector('[data-testid="mock-search"]').compareDocumentPosition(panel.querySelector('.food-grid')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByText('1 ingredient')).toBeInTheDocument();
  });

  it('aligns the USDA data type selector with the ingredient count and Expand all action', () => {
    localStorage.setItem('diet-optimizer-foods', JSON.stringify([{ id: 'saved-food', name: 'Saved lentils', dataType: 'Manual', unit: 'per 100g', cost: 0.25, servingBounds: { min: 0, max: 1 }, nutrients: { calories: 120, protein: 9 } }]));
    IngredientSearch.mockImplementation(() => <div data-testid="mock-search">Mock search</div>);

    render(<DietOptimizer />);

    const actions = document.querySelector('.ingredient-list-actions');
    expect(actions).toBeTruthy();
    expect(actions.querySelector('.data-type-filter')).toBeTruthy();
    expect(actions).toHaveTextContent(/1 ingredient/i);
    expect(actions).toHaveTextContent(/Expand all|Collapse all/i);
  });

  it('keeps the nested ingredient scroller from overflowing the rounded ingredients card', () => {
    const css = readFileSync('src/index.css', 'utf8');
    for (const selector of ['.ingredients-split', '.ingredient-controls', '.ingredient-list-panel']) {
      expect(css).toMatch(new RegExp(`${selector.replace('.', '\\.')}` + String.raw`\s*\{[^}]*min-height:\s*0`, 's'));
    }
  });

  it('starts empty without saved foods and no longer offers a whole-foods preset reset', () => {
    render(<DietOptimizer />);
    expect(screen.getByText(/No foods yet/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Reset to whole-foods preset/i })).not.toBeInTheDocument();
  });

  it('generates random Foundation foods with requested count and serving bounds after destructive confirmation', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    listRandomFoundationFoods.mockResolvedValue([
      { id: 'random-1', name: 'Random lentils', category: 'legume', dataType: 'Foundation', unit: 'per 100g', cost: 0, servingBounds: { min: 0.5, max: 4 }, nutrients: { calories: 120, protein: 9, fat: 1, carbs: 20, fiber: 8, sodium: 3 } },
      { id: 'random-2', name: 'Random oats', category: 'grain', dataType: 'Foundation', unit: 'per 100g', cost: 0, servingBounds: { min: 0.5, max: 4 }, nutrients: { calories: 380, protein: 13, fat: 7, carbs: 67, fiber: 10, sodium: 2 } },
    ]);

    render(<DietOptimizer />);
    await user.type(screen.getByLabelText(/USDA API key/i), 'abc123');
    await user.clear(screen.getByLabelText(/How many foods/i));
    await user.type(screen.getByLabelText(/How many foods/i), '2');
    await user.clear(screen.getByLabelText(/Default min serving/i));
    await user.type(screen.getByLabelText(/Default min serving/i), '0.5');
    await user.clear(screen.getByLabelText(/Default max serving/i));
    await user.type(screen.getByLabelText(/Default max serving/i), '4');
    await user.click(screen.getByRole('button', { name: /Generate random foods/i }));

    await waitFor(() => expect(screen.getByText(/Random lentils/i)).toBeInTheDocument());
    expect(window.confirm).toHaveBeenCalledWith(expect.stringMatching(/Replace your current food list/i));
    expect(listRandomFoundationFoods).toHaveBeenCalledWith(2, 'abc123', { min: 0.5, max: 4 });
    expect(JSON.parse(localStorage.getItem('diet-optimizer-foods'))).toHaveLength(2);
  });

  it('does not replace existing foods when random Foundation generation is cancelled', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    localStorage.setItem('diet-optimizer-foods', JSON.stringify([{ id: 'saved-food', name: 'Saved lentils', dataType: 'Manual', unit: 'per 100g', cost: 0.25, servingBounds: { min: 0, max: 1 }, nutrients: { calories: 120, protein: 9 } }]));

    render(<DietOptimizer />);
    await user.click(screen.getByRole('button', { name: /Generate random foods/i }));

    expect(listRandomFoundationFoods).not.toHaveBeenCalled();
    expect(screen.getByText(/Saved lentils/i)).toBeInTheDocument();
  });

  it('loads saved foods into the right side of the split ingredients section', () => {
    localStorage.setItem('diet-optimizer-foods', JSON.stringify([{ id: 'saved-food', name: 'Saved lentils', dataType: 'Manual', unit: 'per 100g', cost: 0.25, servingBounds: { min: 0, max: 1 }, nutrients: { calories: 120, protein: 9 } }]));
    render(<DietOptimizer />);
    expect(screen.getByText(/Saved lentils/i)).toBeInTheDocument();
    expect(screen.queryByText(/Chicken breast/i)).not.toBeInTheDocument();
    expect(document.querySelector('.ingredients-split .ingredient-controls')).toBeTruthy();
    expect(document.querySelector('.ingredients-split .ingredient-list-panel')).toBeTruthy();
  });

  it('renders result table, category chart tab, and removes the shadow-price display after solving', async () => {
    localStorage.setItem('diet-optimizer-foods', JSON.stringify([
      { id: 'protein-food', name: 'Protein food, very long name', category: 'protein', dataType: 'Manual', unit: 'per 100g', cost: 0, servingBounds: { min: 0, max: 10 }, nutrients: { calories: 100, protein: 20, fat: 1, carbs: 1, fiber: 5, sodium: 1 } },
    ]));
    render(<DietOptimizer />);
    await waitFor(() => expect(screen.getByText(/Calories contributed/i)).toBeInTheDocument());
    expect(screen.queryByText(/Cost is currently a placeholder/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Category calories/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Macro donut/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Constraint radar/i })).toBeInTheDocument();
    expect(screen.queryByText(/Shadow prices/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/The shadow price on a constraint tells you/i)).not.toBeInTheDocument();
  });

  it('hides manual food form and shows a temporary cost warning only after switching to cost objective', async () => {
    const user = userEvent.setup();
    render(<DietOptimizer />);
    expect(screen.queryByRole('heading', { name: /Add food manually/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/Cost is currently a placeholder/i)).not.toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText(/Objective nutrient/i), 'cost');
    expect(screen.getByText(/Cost is currently a placeholder/i)).toBeInTheDocument();
  });
});
