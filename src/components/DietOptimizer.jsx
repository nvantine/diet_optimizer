// DietOptimizer.jsx
import { useState, useMemo } from 'react';
import { buildAndSolve } from '../lib/solver';
import { BarChart, Bar, XAxis, YAxis, LineChart, Line, CartesianGrid, Tooltip } from 'recharts';
import IngredientSearch from './IngredientSearch';
import IngredientList from './IngredientList';
import GoalsPanel from './GoalsPanel';

const DEFAULT_GOALS = {
  minCalories: 0,
  minProtein: 0,
  maxSodium: 100000, // effectively "off" until the user sets a real cap
  weight: 0,
  bodyFat: 0,
};

export default function DietOptimizer() {
  const [foods, setFoods] = useState([]);      // starts empty — no presets
  const [goals, setGoals] = useState(DEFAULT_GOALS);

  function addFood(food) {
    setFoods(prev => (prev.some(f => f.id === food.id) ? prev : [...prev, food]));
  }

  const solution = useMemo(() => {
    if (foods.length === 0) return { feasible: false, result: 0 };
    return buildAndSolve(foods, goals);
  }, [foods, goals]);

  const servingsData = foods
    .map(f => ({ name: f.name, servings: solution[f.name] || 0 }))
    .filter(d => d.servings > 0.01);

  // Pareto sweep: fix calories/sodium, vary protein floor, track cost
  const paretoData = useMemo(() => {
    if (foods.length === 0) return [];
    const points = [];
    const top = Math.max(goals.minProtein * 1.5, 50);
    for (let p = 0; p <= top; p += Math.max(top / 20, 1)) {
      const s = buildAndSolve(foods, { ...goals, minProtein: p });
      if (s.feasible) points.push({ protein: Math.round(p), cost: s.result });
    }
    return points;
  }, [foods, goals]);

  return (
    <div>
      <h2>1. Build your ingredient list</h2>
      <IngredientSearch onAdd={addFood} />
      <IngredientList foods={foods} setFoods={setFoods} />

      <h2>2. Set your goals</h2>
      <GoalsPanel goals={goals} setGoals={setGoals} />

      <h2>3. Result</h2>
      {foods.length === 0 && <p>Add some ingredients above to see a solution.</p>}
      {foods.length > 0 && !solution.feasible && (
        <p>⚠️ Infeasible — no combination of your current ingredients satisfies these goals. Relax a constraint or add more ingredients.</p>
      )}
      {solution.feasible && (
        <>
          <h3>Total cost: ${solution.result?.toFixed(2)}</h3>
          <BarChart width={500} height={300} data={servingsData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="servings" fill="#4f46e5" />
          </BarChart>
        </>
      )}

      {paretoData.length > 1 && (
        <>
          <h3>Cost vs. Protein Floor (Pareto)</h3>
          <LineChart width={500} height={300} data={paretoData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="protein" label={{ value: 'Min protein (g)', position: 'insideBottom', offset: -5 }} />
            <YAxis dataKey="cost" label={{ value: 'Cost ($)', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Line type="monotone" dataKey="cost" stroke="#16a34a" dot={false} />
          </LineChart>
        </>
      )}
    </div>
  );
}