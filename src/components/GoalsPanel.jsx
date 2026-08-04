import { NUTRIENTS } from '../lib/nutrientMap';

export default function GoalsPanel({ constraints, setConstraints }) {
  function update(key, bound) {
    return event => {
      setConstraints(current => ({
        ...current,
        [key]: {
          ...(current[key] || {}),
          [bound]: event.target.value === '' ? '' : Number(event.target.value),
        },
      }));
    };
  }

  return (
    <fieldset className="goals-card">
      <legend>Nutrient constraints</legend>
      <p className="muted">Set a minimum, maximum, or both. Blank means the bound is inactive.</p>
      <div className="constraint-table">
        <div className="constraint-row constraint-head">
          <span>Nutrient</span>
          <span>Minimum</span>
          <span>Maximum</span>
        </div>
        {NUTRIENTS.map(nutrient => (
          <div className="constraint-row" key={nutrient.key}>
            <div>
              <strong>{nutrient.label}</strong>
              <small>{nutrient.unit}</small>
            </div>
            <label>
              <span className="sr-only">{nutrient.label} minimum</span>
              <input
                aria-label={`${nutrient.label} minimum`}
                type="number"
                min="0"
                step="0.1"
                value={constraints[nutrient.key]?.min ?? ''}
                onChange={update(nutrient.key, 'min')}
                placeholder="min"
              />
            </label>
            <label>
              <span className="sr-only">{nutrient.label} maximum</span>
              <input
                aria-label={`${nutrient.label} maximum`}
                type="number"
                min="0"
                step="0.1"
                value={constraints[nutrient.key]?.max ?? ''}
                onChange={update(nutrient.key, 'max')}
                placeholder="max"
              />
            </label>
          </div>
        ))}
      </div>
    </fieldset>
  );
}
