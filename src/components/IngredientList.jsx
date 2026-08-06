import { useEffect, useRef, useState } from 'react';
import { formatNutrientValue } from '../lib/nutrientMap';

const SUMMARY_KEYS = ['calories', 'protein', 'fat', 'carbs', 'fiber', 'sugars', 'calcium', 'iron', 'sodium'];

export default function IngredientList({ foods, setFoods, toolbarStart = null }) {
  const lastValidValues = useRef(new Map());
  const [expandedIds, setExpandedIds] = useState(() => new Set(foods.length <= 10 ? foods.map(food => food.id) : []));

  useEffect(() => {
    setExpandedIds(current => {
      const currentIds = new Set(foods.map(food => food.id));
      if (foods.length <= 10) return currentIds;
      return new Set([...current].filter(id => currentIds.has(id)));
    });
  }, [foods]);

  useEffect(() => {
    for (const food of foods) {
      rememberValidValue(lastValidValues.current, food.id, 'cost', food.cost);
      rememberValidValue(lastValidValues.current, food.id, 'min', food.servingBounds?.min);
      rememberValidValue(lastValidValues.current, food.id, 'max', food.servingBounds?.max ?? food.maxServing);
    }
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

  function restoreCostOnBlur(id) {
    setFoods(foods.map(food => (food.id === id && !isValidNumber(food.cost) ? { ...food, cost: getLastValidValue(lastValidValues.current, id, 'cost', 0) } : food)));
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

  function restoreServingBoundOnBlur(id, bound) {
    setFoods(foods.map(food => {
      if (food.id !== id || isValidNumber(food.servingBounds?.[bound])) return food;
      const fallback = getLastValidValue(lastValidValues.current, id, bound, bound === 'min' ? 0 : food.maxServing ?? 10);
      return { ...food, servingBounds: { min: 0, max: fallback, ...(food.servingBounds || {}), [bound]: fallback } };
    }));
  }

  function remove(id) {
    setFoods(foods.filter(food => food.id !== id));
  }

  if (foods.length === 0) {
    return <p className="empty-state">No foods yet — search USDA or add a manual food.</p>;
  }

  return (
    <>
      <div className="ingredient-list-actions">
        {toolbarStart}
        <div className="ingredient-list-heading">
              <span className="ingredient-count">{foods.length} {foods.length === 1 ? 'ingredient' : 'ingredients'}</span>
              <button type="button" className="toolbar-link" onClick={toggleAll} aria-label={`${allExpanded ? 'Collapse' : 'Expand'} all ingredients`}>{allExpanded ? 'Collapse all' : 'Expand all'}</button>
        </div>
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
                      <span className={simpleMacroChipClass(key)} key={key}>{formatNutrientValue(key, food.nutrients?.[key])}</span>
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
                        onBlur={() => restoreCostOnBlur(food.id)}
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
                        onBlur={() => restoreServingBoundOnBlur(food.id, 'min')}
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
                        onBlur={() => restoreServingBoundOnBlur(food.id, 'max')}
                      />
                    </label>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </>
  );
}

function formatBound(value) {
  return Number.isFinite(Number(value)) ? Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 }) : value;
}

function isValidNumber(value) {
  return value !== '' && value != null && Number.isFinite(Number(value));
}

function rememberValidValue(store, id, field, value) {
  if (isValidNumber(value)) store.set(`${id}:${field}`, Number(value));
}

function getLastValidValue(store, id, field, fallback) {
  return store.get(`${id}:${field}`) ?? fallback;
}

function simpleMacroChipClass(key) {
  return ['calories', 'protein', 'fat', 'carbs', 'fiber', 'sodium'].includes(key) ? `nutrient-chip-${key}` : '';
}
