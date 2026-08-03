// GoalsPanel.jsx
export default function GoalsPanel({ goals, setGoals }) {
  const update = key => e => setGoals({ ...goals, [key]: +e.target.value });

  return (
    <fieldset>
      <legend>Goals</legend>

      <label>
        Min calories
        <input type="number" value={goals.minCalories} onChange={update('minCalories')} />
      </label>

      <label>
        Min protein (g)
        <input type="number" value={goals.minProtein} onChange={update('minProtein')} />
      </label>

      <label>
        Max sodium (mg)
        <input type="number" value={goals.maxSodium} onChange={update('maxSodium')} />
      </label>

      <hr />

      {/* Captured now, not used by the solver yet — for a later
          BMR/TDEE-driven calorie & protein suggestion feature */}
      <label>
        Body weight (kg)
        <input type="number" value={goals.weight} onChange={update('weight')} />
      </label>

      <label>
        Body fat %
        <input type="number" value={goals.bodyFat} onChange={update('bodyFat')} />
      </label>
    </fieldset>
  );
}