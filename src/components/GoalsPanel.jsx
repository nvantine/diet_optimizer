export default function GoalsPanel({ goals, setGoals }) {
  const update = key => event => setGoals({ ...goals, [key]: event.target.value === '' ? '' : Number(event.target.value) });

  return (
    <fieldset className="goals-card">
      <legend>Nutrition goals</legend>
      <div className="grid form-grid">
        <label>
          Min calories
          <input type="number" min="0" value={goals.minCalories} onChange={update('minCalories')} />
        </label>

        <label>
          Min protein (g)
          <input type="number" min="0" value={goals.minProtein} onChange={update('minProtein')} />
        </label>

        <label>
          Max sodium (mg)
          <input type="number" min="0" value={goals.maxSodium} onChange={update('maxSodium')} placeholder="No cap" />
        </label>

        <label>
          Body weight (kg)
          <input type="number" min="0" value={goals.weight} onChange={update('weight')} />
        </label>

        <label>
          Body fat %
          <input type="number" min="0" max="100" value={goals.bodyFat} onChange={update('bodyFat')} />
        </label>
      </div>
      <p className="muted">Body metrics are optional and currently used as planning context only, not hidden solver constraints.</p>
    </fieldset>
  );
}
