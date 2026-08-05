import { useState } from 'react';
import { FOOD_CATEGORIES, FOOD_CATEGORY_LABELS } from '../lib/foodCategory';
import { NUTRIENTS } from '../lib/nutrientMap';
import { estimateMaxServing } from '../lib/servingCaps';

function emptyFood() {
  return {
    name: '',
    category: 'other',
    cost: 0,
    servingBounds: { min: 0, max: estimateMaxServing('', 'other') },
    nutrients: Object.fromEntries(NUTRIENTS.map(nutrient => [nutrient.key, 0])),
  };
}

const MANUAL_NUTRIENTS = ['calories', 'protein', 'fat', 'carbs', 'fiber', 'sugars', 'sodium', 'calcium', 'iron', 'potassium', 'vitaminD', 'vitaminC'];

export default function ManualFoodForm({ onAdd }) {
  const [food, setFood] = useState(emptyFood);

  function updateName(event) {
    const name = event.target.value;
    setFood(current => ({
      ...current,
      name,
      servingBounds: { ...current.servingBounds, max: estimateMaxServing(name, current.category) },
    }));
  }

  function updateCategory(event) {
    const category = event.target.value;
    setFood(current => ({
      ...current,
      category,
      servingBounds: { ...current.servingBounds, max: estimateMaxServing(current.name, category) },
    }));
  }

  function updateCost(event) {
    setFood(current => ({ ...current, cost: event.target.value === '' ? '' : toNumber(event.target.value, 0) }));
  }

  function updateServingBound(bound) {
    return event => {
      setFood(current => ({
        ...current,
        servingBounds: {
          ...current.servingBounds,
          [bound]: event.target.value === '' ? '' : toNumber(event.target.value, bound === 'min' ? 0 : 10),
        },
      }));
    };
  }

  function updateNutrient(key) {
    return event => {
      setFood(current => ({
        ...current,
        nutrients: { ...current.nutrients, [key]: toNumber(event.target.value, 0) },
      }));
    };
  }

  function submit(event) {
    event.preventDefault();
    if (!food.name.trim()) return;
    onAdd({
      ...food,
      id: `manual-${food.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`,
      name: food.name.trim(),
      brand: 'Manual',
      dataType: 'Manual',
      unit: 'per 100g',
    });
    setFood(emptyFood());
  }

  return (
    <form className="manual-food-card" onSubmit={submit}>
      <div className="section-kicker">Manual fallback</div>
      <h3>Add food manually</h3>
      <p className="muted">Use this when USDA search is unavailable or you have a label you trust. Nutrient values below are per 100g of this specific food, matching USDA's basis — not per serving and not daily totals.</p>
      <div className="grid form-grid">
        <label>
          Food name
          <input value={food.name} onChange={updateName} placeholder="Egg, spinach, lentils..." required />
        </label>
        <label>
          Category
          <select value={food.category} onChange={updateCategory} required>
            {FOOD_CATEGORIES.map(category => <option key={category} value={category}>{FOOD_CATEGORY_LABELS[category]}</option>)}
          </select>
        </label>
        {MANUAL_NUTRIENTS.map(key => {
          const nutrient = NUTRIENTS.find(item => item.key === key);
          return (
            <label key={key}>
              {nutrient.label} per 100g ({nutrient.unit})
              <input type="number" min="0" step="0.1" value={food.nutrients[key]} onChange={updateNutrient(key)} />
            </label>
          );
        })}
        <label>
          Cost ($ per 100g, placeholder — edit manually)
          <input type="number" min="0" step="0.01" value={food.cost} onChange={updateCost} />
        </label>
        <label>
          Minimum 100g units
          <input type="number" min="0" step="0.25" value={food.servingBounds.min} onChange={updateServingBound('min')} />
        </label>
        <label>
          Maximum 100g units
          <input type="number" min="0" step="0.25" value={food.servingBounds.max} onChange={updateServingBound('max')} />
        </label>
      </div>
      <button className="manual-submit-button" type="submit">Add manual food</button>
    </form>
  );
}

function toNumber(value, fallback) {
  if (value === '' || value == null) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}
