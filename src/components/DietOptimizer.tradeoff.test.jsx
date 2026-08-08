import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import DietOptimizer from './DietOptimizer';
import { buildAndSolve, generateTradeoffCurve } from '../lib/solver';

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

vi.mock('../lib/solver', () => ({
  TRADEOFF_SWEEP_STEP_DEGREES: 10,
  buildAndSolve: vi.fn(async () => ({
    feasible: true,
    solver: 'highs.js',
    objective: { nutrientKey: 'calories', direction: 'min' },
    objectiveValue: 420,
    totalCost: 4.2,
    nutrientTotals: { calories: 420, protein: 80 },
    servingsByFoodId: { main: 1 },
    selectedFoods: [{ id: 'main', name: 'Main solution food', category: 'protein', cost: 4.2, nutrients: { calories: 420, protein: 80 }, servings: 1 }],
    dualValues: {},
    rawStatus: 'Optimal',
  })),
  generateTradeoffCurve: vi.fn(async () => ({
    objectives: ['cost', 'calories'],
    stepDegrees: 10,
    points: [
      { thetaDegrees: 0, feasible: true, paretoOptimal: false, objectiveValues: { cost: 2, calories: 700 }, solution: { selectedFoods: [] } },
      { thetaDegrees: 10, feasible: true, paretoOptimal: true, objectiveValues: { cost: 2.5, calories: 650 }, solution: { selectedFoods: [{ id: 'trade-a', name: 'Tradeoff oats', servings: 1.25, cost: 0.8, nutrients: { calories: 380 } }] } },
      { thetaDegrees: 20, feasible: true, paretoOptimal: true, objectiveValues: { cost: 3, calories: 600 }, solution: { selectedFoods: [{ id: 'trade-b', name: 'Tradeoff lentils', servings: 2, cost: 1, nutrients: { calories: 120 } }] } },
      { thetaDegrees: 90, feasible: true, paretoOptimal: false, objectiveValues: { cost: 5, calories: 500 }, solution: { selectedFoods: [] } },
    ],
    paretoPoints: [
      { thetaDegrees: 10, paretoOptimal: true, objectiveValues: { cost: 2.5, calories: 650 }, solution: { selectedFoods: [{ id: 'trade-a', name: 'Tradeoff oats', servings: 1.25, cost: 0.8, nutrients: { calories: 380 } }] } },
      { thetaDegrees: 20, paretoOptimal: true, objectiveValues: { cost: 3, calories: 600 }, solution: { selectedFoods: [{ id: 'trade-b', name: 'Tradeoff lentils', servings: 2, cost: 1, nutrients: { calories: 120 } }] } },
    ],
    ranges: { cost: { min: 2.5, max: 3 }, calories: { min: 600, max: 650 } },
    sanity: { closed: true, convex: true },
  })),
}));

describe('DietOptimizer trade-off explorer', () => {
  beforeEach(() => {
    buildAndSolve.mockClear();
    generateTradeoffCurve.mockClear();
    localStorage.setItem('diet-optimizer-foods', JSON.stringify([
      { id: 'main', name: 'Main ingredient', category: 'protein', dataType: 'Manual', unit: 'per 100g', cost: 4.2, servingBounds: { min: 0, max: 3 }, nutrients: { calories: 420, protein: 80 } },
    ]));
  });

  it('offers one or two objectives while showing disabled three-objective scope', () => {
    render(<DietOptimizer />);

    const countSelect = screen.getByLabelText(/Number of objectives/i);
    expect(countSelect).toHaveValue('2');
    expect(screen.getByRole('option', { name: /3 \(coming soon\)/i })).toBeDisabled();
    expect(screen.getByLabelText(/Trade-off objective 1/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Trade-off objective 2/i)).toBeInTheDocument();
  });

  it('shows one-objective mode as a pointer back to section 4 instead of duplicating that UI', async () => {
    const user = userEvent.setup();
    render(<DietOptimizer />);

    await user.selectOptions(screen.getByLabelText(/Number of objectives/i), '1');

    expect(screen.getByText(/Use section 4/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Generate trade-off curve/i })).not.toBeInTheDocument();
  });

  it('runs the two-objective sweep on demand, displays the local Pareto details, and does not re-solve or overwrite the main result state', async () => {
    const user = userEvent.setup();
    render(<DietOptimizer />);

    await waitFor(() => expect(buildAndSolve).toHaveBeenCalled());
    const mainSolveCount = buildAndSolve.mock.calls.length;
    await user.selectOptions(screen.getByLabelText(/Trade-off objective 1/i), 'cost');
    await user.selectOptions(screen.getByLabelText(/Trade-off objective 2/i), 'calories');
    expect(generateTradeoffCurve).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: /Generate trade-off curve/i }));

    await waitFor(() => expect(generateTradeoffCurve).toHaveBeenCalledTimes(1));
    expect(generateTradeoffCurve).toHaveBeenCalledWith(expect.any(Array), expect.any(Object), ['cost', 'calories'], expect.any(Object), expect.objectContaining({ stepDegrees: 10 }));
    expect(await screen.findAllByText(/Pareto-optimal arc/i)).toHaveLength(2);
    expect(screen.getByText(/Boundary sanity: closed convex curve/i)).toBeInTheDocument();
    expect(screen.getByTestId('tradeoff-boundary-path')).toHaveAttribute('d', expect.stringMatching(/Z$/));
    expect(screen.getByText(/Tradeoff oats/i)).toBeInTheDocument();
    expect(screen.getByText(/Main solution food/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Pareto point/i), { target: { value: '1' } });
    expect(screen.getByText(/Tradeoff lentils/i)).toBeInTheDocument();
    expect(buildAndSolve).toHaveBeenCalledTimes(mainSolveCount);
  });
});
