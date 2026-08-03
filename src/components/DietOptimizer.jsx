// DietOptimizer.jsx
import { useState, useMemo } from 'react';
import { buildAndSolve } from './../lib/solver';
// import foods from './foods.json';
import { BarChart, Bar, XAxis, YAxis, LineChart, Line } from 'recharts';

export default function DietOptimizer() {
  const [minCalories, setMinCalories] = useState(2000);
  const [minProtein, setMinProtein] = useState(100);
  const [maxSodium, setMaxSodium] = useState(2300);
  const [maxServing, setMaxServing] = useState(5);

  const solution = useMemo(
    () => buildAndSolve(foods, { minCalories, minProtein, maxSodium, maxServing }),
    [minCalories, minProtein, maxSodium, maxServing]
  );

  const servingsData = foods
    .map(f => ({ name: f.name, servings: solution[f.name] || 0 }))
    .filter(d => d.servings > 0.01);

  // Pareto sweep: fix calories/sodium, vary protein floor, track cost
  const paretoData = useMemo(() => {
    const points = [];
    for (let p = 50; p <= 250; p += 10) {
      const s = buildAndSolve(foods, { minCalories, minProtein: p, maxSodium, maxServing });
      if (s.feasible) points.push({ protein: p, cost: s.result });
    }
    return points;
  }, [minCalories, maxSodium, maxServing]);

  return (
    <div>
      <label>Min Calories: {minCalories}
        <input type="range" min="1200" max="4000" value={minCalories}
          onChange={e => setMinCalories(+e.target.value)} />
      </label>
      <label>Min Protein (g): {minProtein}
        <input type="range" min="0" max="250" value={minProtein}
          onChange={e => setMinProtein(+e.target.value)} />
      </label>
      <label>Max Sodium (mg): {maxSodium}
        <input type="range" min="500" max="4000" value={maxSodium}
          onChange={e => setMaxSodium(+e.target.value)} />
      </label>

      {!solution.feasible && <p>⚠️ Infeasible — constraints conflict. Try relaxing one.</p>}

      <h3>Total cost: ${solution.result?.toFixed(2)}</h3>
      <BarChart width={500} height={300} data={servingsData}>
        <XAxis dataKey="name" /><YAxis />
        <Bar dataKey="servings" fill="#4f46e5" />
      </BarChart>

      <h3>Cost vs. Protein Floor (Pareto)</h3>
      <LineChart width={500} height={300} data={paretoData}>
        <XAxis dataKey="protein" /><YAxis dataKey="cost" />
        <Line type="monotone" dataKey="cost" stroke="#16a34a" />
      </LineChart>
    </div>
  );
}