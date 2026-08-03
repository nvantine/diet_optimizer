import { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { buildAndSolve } from '../lib/solver';
import GoalsPanel from './GoalsPanel';
import IngredientList from './IngredientList';
import IngredientSearch from './IngredientSearch';
import ManualFoodForm from './ManualFoodForm';

const DEFAULT_GOALS = {
  minCalories: 1800,
  minProtein: 120,
  maxSodium: 2300,
  weight: 0,
  bodyFat: 0,
};

export default function DietOptimizer() {
  const [foods, setFoods] = useState([]);
  const [goals, setGoals] = useState(DEFAULT_GOALS);

  function addFood(food) {
    setFoods(current => (current.some(existing => existing.id === food.id) ? current : [...current, food]));
  }

  const solution = useMemo(() => buildAndSolve(foods, goals), [foods, goals]);

  const servingsData = useMemo(() => foods
    .map(food => ({ name: food.name, servings: solution.servingsByFoodId?.[food.id] || 0 }))
    .filter(item => item.servings > 0.01), [foods, solution]);

  const paretoData = useMemo(() => {
    if (foods.length === 0) return [];
    const points = [];
    const top = Math.max(Number(goals.minProtein || 0) * 1.5, 50);
    const step = Math.max(top / 16, 1);
    for (let protein = 0; protein <= top; protein += step) {
      const candidate = buildAndSolve(foods, { ...goals, minProtein: protein });
      if (candidate.feasible) {
        points.push({ protein: Math.round(protein), cost: candidate.totalCost });
      }
    }
    return points;
  }, [foods, goals]);

  return (
    <main className="app-shell">
      <section className="hero-panel">
        <p className="section-kicker">Dark-mode linear-programming diet planner</p>
        <h1>Food Optimizer</h1>
        <p>
          Build a food list, set nutrition constraints, and solve for the lowest-cost combination.
          One optimizer serving equals <strong>100g</strong> unless you enter a custom item that represents your preferred unit.
        </p>
      </section>

      <section className="card">
        <div className="section-heading">
          <span>1</span>
          <div>
            <h2>Build your ingredient list</h2>
            <p className="muted">Search OpenFoodFacts or add nutrition labels manually. Prices are entered by you.</p>
          </div>
        </div>
        <IngredientSearch onAdd={addFood} />
        <ManualFoodForm onAdd={addFood} />
        <IngredientList foods={foods} setFoods={setFoods} />
      </section>

      <section className="card">
        <div className="section-heading">
          <span>2</span>
          <div>
            <h2>Set your goals</h2>
            <p className="muted">The solver minimizes cost while meeting calorie, protein, and sodium constraints.</p>
          </div>
        </div>
        <GoalsPanel goals={goals} setGoals={setGoals} />
      </section>

      <section className="card">
        <div className="section-heading">
          <span>3</span>
          <div>
            <h2>Result</h2>
            <p className="muted">Review suggested 100g units and the protein/cost tradeoff curve.</p>
          </div>
        </div>

        {foods.length === 0 && <p className="empty-state">Add ingredients to see a solution.</p>}
        {foods.length > 0 && !solution.feasible && (
          <p className="alert">No feasible combination satisfies these goals. Relax a constraint, raise max servings, or add more foods.</p>
        )}
        {solution.feasible && (
          <div className="result-grid">
            <div className="stat-card">
              <span>Total cost</span>
              <strong>${solution.totalCost.toFixed(2)}</strong>
            </div>
            <div className="chart-card">
              <h3>Servings selected</h3>
              {servingsData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={servingsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="servings" fill="#a855f7" />
                  </BarChart>
                </ResponsiveContainer>
              ) : <p className="muted">All selected servings are effectively zero.</p>}
            </div>
          </div>
        )}

        {paretoData.length > 1 && (
          <div className="chart-card">
            <h3>Cost vs. protein floor</h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={paretoData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="protein" />
                <YAxis dataKey="cost" />
                <Tooltip />
                <Line type="monotone" dataKey="cost" stroke="#22c55e" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>
    </main>
  );
}
