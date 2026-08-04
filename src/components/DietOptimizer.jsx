import { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { defaultConstraints, formatNutrientValue } from '../lib/nutrientMap';
import { buildAndSolve } from '../lib/solver';
import ApiKeySettings from './ApiKeySettings';
import GoalsPanel from './GoalsPanel';
import IngredientList from './IngredientList';
import IngredientSearch from './IngredientSearch';
import ManualFoodForm from './ManualFoodForm';

export default function DietOptimizer() {
  const [apiKey, setApiKey] = useState('');
  const [foods, setFoods] = useState([]);
  const [constraints, setConstraints] = useState(defaultConstraints());

  function addFood(food) {
    setFoods(current => (current.some(existing => existing.id === food.id) ? current : [...current, food]));
  }

  const solution = useMemo(() => buildAndSolve(foods, constraints), [foods, constraints]);

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
          Build a clear nutrition linear program from USDA Foundation foods. Set min/max bounds,
          then solve for the lowest-calorie feasible combination. Cost stays in the food data model
          for later, but it is not used by the Phase 1 objective.
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
        <IngredientSearch apiKey={apiKey} onAdd={addFood} />
        <ManualFoodForm onAdd={addFood} />
        <IngredientList foods={foods} setFoods={setFoods} />
      </section>

      <section className="card">
        <div className="section-heading">
          <span>2</span>
          <div>
            <h2>Set min/max constraints</h2>
            <p className="muted">Each tracked nutrient can have a lower bound, an upper bound, or both. Blank means inactive.</p>
          </div>
        </div>
        <GoalsPanel constraints={constraints} setConstraints={setConstraints} />
      </section>

      <section className="card">
        <div className="section-heading">
          <span>3</span>
          <div>
            <h2>Optimization result</h2>
            <p className="muted">Phase 1 keeps javascript-lp-solver for now. highs.js and true dual values come in Phase 2.</p>
          </div>
        </div>

        {foods.length === 0 && <p className="empty-state">Add foods to build a feasible nutrition LP.</p>}
        {foods.length > 0 && !solution.feasible && (
          <p className="alert">No feasible combination satisfies these nutrient bounds. Relax constraints or add more foods.</p>
        )}
        {solution.feasible && (
          <div className="result-grid">
            <div className="stat-card">
              <span>Minimum calories</span>
              <strong>{formatNutrientValue('calories', solution.objectiveValue)}</strong>
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
    </main>
  );
}
