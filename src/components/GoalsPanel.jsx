import { useMemo, useState } from 'react';
import { NUTRIENTS, NUTRIENT_TIERS, nutrientIsVisibleInTier } from '../lib/nutrientMap';
import { buildRdaPresetConstraints } from '../lib/rdaPresets';

const TIER_OPTIONS = [
  { value: NUTRIENT_TIERS.simple, label: 'Simple', description: 'Core macros only' },
  { value: NUTRIENT_TIERS.medium, label: 'Medium', description: 'Macros plus DRI-table vitamins and minerals' },
  { value: NUTRIENT_TIERS.all, label: 'All', description: 'Full mapped nutrient set, including amino and fatty acids' },
];

export default function GoalsPanel({ constraints, selectedTier, setConstraints, setSelectedTier }) {
  const [internalTier, setInternalTier] = useState(NUTRIENT_TIERS.simple);
  const [preset, setPreset] = useState({ sex: 'female', weightKg: '', heightCm: '', ageYears: '' });
  const activeTier = selectedTier ?? internalTier;
  const visibleNutrients = useMemo(() => NUTRIENTS.filter(nutrient => nutrientIsVisibleInTier(nutrient, activeTier)), [activeTier]);

  function update(key, bound) {
    return event => setConstraints(current => ({ ...current, [key]: { ...(current[key] || {}), [bound]: event.target.value === '' ? '' : Number(event.target.value) } }));
  }

  function updatePreset(field) {
    return event => setPreset(current => ({ ...current, [field]: event.target.value }));
  }

  function chooseTier(tier) {
    if (setSelectedTier) setSelectedTier(tier);
    else setInternalTier(tier);
  }

  function applyPreset() {
    const presetConstraints = buildRdaPresetConstraints({ ...preset, tier: activeTier });
    setConstraints(current => ({ ...current, ...presetConstraints }));
  }

  return (
    <fieldset className="goals-card">
      <legend>Nutrient constraints</legend>
      <p className="muted">These optimizer constraints are daily totals across all selected foods. Blank means the bound is inactive.</p>
      <div className="preset-card">
        <h3>Approximate biometric preset</h3>
        <p className="muted">Estimates for exploring the linear program, not medical guidance. Rough estimate for testing the optimizer, not a real dietary calculation. Assumes light activity.</p>
        <div className="grid preset-grid">
          <label htmlFor="preset-sex">Sex<select id="preset-sex" value={preset.sex} onChange={updatePreset('sex')}><option value="female">Female</option><option value="male">Male</option></select></label>
          <label htmlFor="preset-weight">Weight (kg)<input id="preset-weight" type="number" min="0" step="0.1" value={preset.weightKg} onChange={updatePreset('weightKg')} placeholder="70" /></label>
          <label htmlFor="preset-height">Height (cm)<input id="preset-height" type="number" min="0" step="0.1" value={preset.heightCm} onChange={updatePreset('heightCm')} placeholder="170" /></label>
          <label htmlFor="preset-age">Age (years)<input id="preset-age" type="number" min="0" step="1" value={preset.ageYears} onChange={updatePreset('ageYears')} placeholder="25" /></label>
        </div>
        <button className="preset-button" type="button" onClick={applyPreset}>Apply</button>
      </div>
      <div className="tier-selector" role="radiogroup" aria-label="Nutrient constraint tier">
        {TIER_OPTIONS.map(option => (
          <label key={option.value} className="tier-option">
            <input checked={activeTier === option.value} name="nutrient-tier" onChange={() => chooseTier(option.value)} type="radio" value={option.value} />
            <span><strong>{option.label}</strong><small>{option.description}</small></span>
          </label>
        ))}
      </div>
      <div className="constraint-table">
        <div className="constraint-row constraint-head"><span>Nutrient</span><span>Daily minimum</span><span>Daily maximum</span></div>
        {visibleNutrients.map(nutrient => (
          <div className="constraint-row" key={nutrient.key}>
            <div><strong>{nutrient.label}</strong><small>{nutrient.unit}</small></div>
            <label><span className="sr-only">{nutrient.label} minimum</span><input aria-label={`${nutrient.label} minimum`} type="number" min="0" step="0.1" value={constraints[nutrient.key]?.min ?? ''} onChange={update(nutrient.key, 'min')} placeholder={nutrient.defaultMin == null ? 'daily min' : `suggested ${nutrient.defaultMin}`} /></label>
            <label><span className="sr-only">{nutrient.label} maximum</span><input aria-label={`${nutrient.label} maximum`} type="number" min="0" step="0.1" value={constraints[nutrient.key]?.max ?? ''} onChange={update(nutrient.key, 'max')} placeholder={nutrient.defaultMax == null ? 'daily max' : `suggested ${nutrient.defaultMax}`} /></label>
          </div>
        ))}
      </div>
    </fieldset>
  );
}
