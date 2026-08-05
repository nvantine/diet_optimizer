import { useEffect, useState } from 'react';
import { formatNutrientValue } from '../lib/nutrientMap';

const SUMMARY_KEYS = ['calories', 'protein', 'fat', 'carbs', 'fiber', 'sugars', 'calcium', 'iron', 'sodium'];

export default function IngredientList({ foods, setFoods }) {
  const [expandedIds, setExpandedIds] = useState(() => new Set(foods.length <= 10 ? foods.map(food => food.id) : []));

  useEffect(() => {
    setExpandedIds(current => {
      const currentIds = new Set(foods.map(food => food.id));
      if (foods.length <= 10) return currentIds;
      return new Set([...current].filter(id => currentIds.has(id)));
    });
  }, [foods]);

  const allExpanded = foods.length > 0 && expandedIds.size === foods.length;

  function toggleAll() {
    setExpandedIds(allExpanded ? new Set() : new Set(foods.map(food => food.id)));
  }

  function toggleFood(id) {
    setExpandedIds(current => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function updateCost(id, value) {
    setFoods(foods.map(food => (food.id === id ? { ...food, cost: value === '' ? '' : Number(value) } : food)));
  }

  function updateServingBound(id, bound, value) {
    setFoods(foods.map(food => {
      if (food.id !== id) return food;
      return {
        ...food,
        servingBounds: {
          min: 0,
          max: 10,
          ...(food.servingBounds || {}),
          [bound]: value === '' ? '' : Number(value),
        },
      };
    }));
  }

  function remove(id) {
    setFoods(foods.filter(food => food.id !== id));
  }

  if (foods.length === 0) {
    return <p className="empty-state">No foods yet — search USDA or add a manual food.</p>;
  }

  return (
    <div className="ingredient-list-panel">
      <div className="ingredient-toolbar" aria-label="Ingredient list toolbar">
        <strong>{foods.length} {foods.length === 1 ? 'food' : 'foods'}</strong>
        <button type="button" className="ghost" onClick={toggleAll}>{allExpanded ? 'Collapse all' : 'Expand all'}</button>
        <a className="toolbar-link" href="#goals-section">Jump to Goals</a>
        <a className="toolbar-link" href="#results-section">Jump to Results</a>
      </div>
      <div className="food-grid">
        {foods.map(food => {
          const expanded = expandedIds.has(food.id);
          return (
            <article className={`food-card ${expanded ? 'food-card-expanded' : 'food-card-collapsed'}`} key={food.id}>
              <div className="food-card-summary">
                <button
                  type="button"
                  className="ghost row-toggle"
                  aria-expanded={expanded}
                  aria-label={`${expanded ? 'Collapse' : 'Expand'} ${food.name} details`}
                  onClick={() => toggleFood(food.id)}
                >
                  {expanded ? '⌄' : '›'}
                </button>
                <div>
                  <h3>{food.name}</h3>
                  <p className="muted">{food.dataType} · {food.unit}</p>
                </div>
                <span className="pill serving-pill">{formatBound(food.servingBounds?.min ?? 0)}–{formatBound(food.servingBounds?.max ?? food.maxServing ?? 10)} × 100g units</span>
                <button type="button" className="ghost remove-button" onClick={() => remove(food.id)}>Remove</button>
              </div>
              {expanded && (
                <div className="food-card-details">
                  <p className="muted">Nutrient values shown are per 100g of this food, not per serving or daily totals.</p>
                  <div className="nutrient-chips">
                    {SUMMARY_KEYS.map(key => (
                      <span key={key}>{formatNutrientValue(key, food.nutrients?.[key])}</span>
                    ))}
                  </div>
                  <div className="grid form-grid">
                    <label>
                      Cost ($ per 100g)
                      <input
                        aria-label={`Cost for ${food.name}`}
                        type="number"
                        min="0"
                        step="0.01"
                        value={food.cost ?? 0}
                        onChange={event => updateCost(food.id, event.target.value)}
                      />
                    </label>
                    <label>
                      Minimum 100g units
                      <input
                        aria-label={`Minimum servings for ${food.name}`}
                        type="number"
                        min="0"
                        step="0.25"
                        value={food.servingBounds?.min ?? 0}
                        onChange={event => updateServingBound(food.id, 'min', event.target.value)}
                      />
                    </label>
                    <label>
                      Maximum 100g units
                      <input
                        aria-label={`Maximum servings for ${food.name}`}
                        type="number"
                        min="0"
                        step="0.25"
                        value={food.servingBounds?.max ?? food.maxServing ?? 10}
                        onChange={event => updateServingBound(food.id, 'max', event.target.value)}
                      />
                    </label>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}

function formatBound(value) {
  return Number.isFinite(Number(value)) ? Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 }) : value;
}
