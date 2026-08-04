import { useEffect, useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { defaultConstraints, formatNutrientValue, NUTRIENTS, NUTRIENT_BY_KEY, NUTRIENT_TIERS, nutrientIsVisibleInTier } from '../lib/nutrientMap';
import { buildAndSolve } from '../lib/solver';
import ApiKeySettings from './ApiKeySettings';
import GoalsPanel from './GoalsPanel';
import IngredientList from './IngredientList';
import IngredientSearch from './IngredientSearch';
import ManualFoodForm from './ManualFoodForm';

const DEFAULT_OBJECTIVE = { nutrientKey: 'calories', direction: 'min' };
const EMPTY_SOLUTION = {
  feasible: false,
  solver: 'highs.js',
  objective: DEFAULT_OBJECTIVE,
  objectiveValue: Number.POSITIVE_INFINITY,
  nutrientTotals: {},
  servingsByFoodId: {},
  selectedFoods: [],
  dualValues: {},
  rawStatus: 'Not solved',
};

export default function DietOptimizer() {
  const [apiKey, setApiKey] = useState('');
  const [foods, setFoods] = useState([]);
  const [constraintTier, setConstraintTier] = useState(NUTRIENT_TIERS.simple);
  const [constraints, setConstraints] = useState(defaultConstraints(NUTRIENT_TIERS.simple));
  const [objective, setObjective] = useState(DEFAULT_OBJECTIVE);
  const [solution, setSolution] = useState(EMPTY_SOLUTION);
  const [solving, setSolving] = useState(false);

  function addFood(food) {
    setFoods(current => (current.some(existing => existing.id === food.id) ? current : [...current, food]));
  }

  const visibleNutrients = useMemo(
    () => NUTRIENTS.filter(nutrient => nutrientIsVisibleInTier(nutrient, constraintTier)),
    [constraintTier],
  );

  const activeConstraints = useMemo(() => Object.fromEntries(
    Object.entries(constraints).filter(([key]) => {
      const nutrient = NUTRIENT_BY_KEY[key];
      return nutrient && nutrientIsVisibleInTier(nutrient, constraintTier);
    }),
  ), [constraintTier, constraints]);

  useEffect(() => {
    let cancelled = false;
    if (foods.length === 0) {
      setSolution({ ...EMPTY_SOLUTION, objective });
      setSolving(false);
      return () => { cancelled = true; };
    }

    setSolving(true);
    buildAndSolve(foods, activeConstraints, objective)
      .then(nextSolution => {
        if (!cancelled) setSolution(nextSolution);
      })
      .catch(error => {
        if (!cancelled) {
          setSolution({ ...EMPTY_SOLUTION, objective, rawStatus: error.message });
        }
      })
      .finally(() => {
        if (!cancelled) setSolving(false);
      });

    return () => { cancelled = true; };
  }, [foods, activeConstraints, objective]);

  const selectedData = useMemo(() => solution.selectedFoods.map(food => ({
    name: food.name,
    servings: food.servings,
    calories: food.servings * (food.nutrients.calories || 0),
  })), [solution]);

  return (
    <main className="app-shell">
      <section className="hero-panel">
        <p className="section-kicker">USDA convex nutrition optimizer</p>
        <h1>Food Optimizer</h1>
        <p>
          Build a clear nutrition linear program from USDA foods. Set min/max bounds,
          choose an objective nutrient and direction, then solve with HiGHS. Cost stays
          in the food data model for later, but it is not used by the Phase 2 objective.
        </p>
      </section>

      <section className="card">
        <div className="section-heading">
          <span>1</span>
          <div>
            <h2>Build your food list</h2>
            <p className="muted">Search FoodData Central with a local browser key, or add per-100g nutrient data manually.</p>
          </div>
        </div>
        <ApiKeySettings apiKey={apiKey} setApiKey={setApiKey} />
        <IngredientSearch apiKey={apiKey} existingIds={new Set(foods.map(food => food.id))} onAdd={addFood} />
        <ManualFoodForm onAdd={addFood} />
        <IngredientList foods={foods} setFoods={setFoods} />
      </section>

      <section className="card">
        <div className="section-heading">
          <span>2</span>
          <div>
            <h2>Set min/max constraints</h2>
            <p className="muted">Every visible tracked nutrient can have a lower bound, an upper bound, or both. Blank means inactive.</p>
          </div>
        </div>
        <GoalsPanel
          constraints={constraints}
          selectedTier={constraintTier}
          setConstraints={setConstraints}
          setSelectedTier={setConstraintTier}
        />
      </section>

      <section className="card">
        <div className="section-heading">
          <span>3</span>
          <div>
            <h2>Choose objective</h2>
            <p className="muted">Default is Boyd-style linear objective: minimize total calories over the feasible set.</p>
          </div>
        </div>
        <div className="objective-grid">
          <label htmlFor="objective-direction">
            Objective direction
            <select
              id="objective-direction"
              value={objective.direction}
              onChange={event => setObjective(current => ({ ...current, direction: event.target.value }))}
            >
              <option value="min">Minimize</option>
              <option value="max">Maximize</option>
            </select>
          </label>
          <label htmlFor="objective-nutrient">
            Objective nutrient
            <select
              id="objective-nutrient"
              value={objective.nutrientKey}
              onChange={event => setObjective(current => ({ ...current, nutrientKey: event.target.value }))}
            >
              {visibleNutrients.map(nutrient => (
                <option key={nutrient.key} value={nutrient.key}>{nutrient.label}</option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="card">
        <div className="section-heading">
          <span>4</span>
          <div>
            <h2>Optimization result</h2>
            <p className="muted">Solved asynchronously with highs.js/WebAssembly. Decision variables are 100g units of each food.</p>
          </div>
        </div>

        {foods.length === 0 && <p className="empty-state">Add foods to build a feasible nutrition LP.</p>}
        {solving && <p className="muted">Solving with highs.js...</p>}
        {foods.length > 0 && !solving && !solution.feasible && (
          <p className="alert">No feasible combination satisfies these nutrient bounds. Relax constraints or add more foods. Solver status: {solution.rawStatus}</p>
        )}
        {solution.feasible && (
          <div className="result-grid">
            <div className="stat-card">
              <span>{objective.direction === 'max' ? 'Maximum' : 'Minimum'} {NUTRIENT_BY_KEY[objective.nutrientKey]?.label}</span>
              <strong>{formatNutrientValue(objective.nutrientKey, solution.objectiveValue)}</strong>
            </div>
            <div className="chart-card">
              <h3>Selected 100g units</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={selectedData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="servings" fill="#a855f7" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </section>

      {solution.feasible && (
        <section className="card">
          <div className="section-heading">
            <span>5</span>
            <div>
              <h2>Shadow prices</h2>
              <p className="muted">Dual values from HiGHS for active nutrient constraints. Binding rows estimate marginal objective tradeoffs.</p>
            </div>
          </div>
          <div className="shadow-grid">
            {Object.entries(solution.dualValues).map(([key, values]) => (
              <article className="mini-card" key={key}>
                <strong>{NUTRIENT_BY_KEY[key]?.label || key}</strong>
                {values.min && <p>min λ ≈ {values.min.dual} {values.min.binding ? '(binding)' : '(slack)'}</p>}
                {values.max && <p>max λ ≈ {values.max.dual} {values.max.binding ? '(binding)' : '(slack)'}</p>}
              </article>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
