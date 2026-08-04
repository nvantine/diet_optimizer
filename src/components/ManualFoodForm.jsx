import { useState } from 'react';
import { NUTRIENTS } from '../lib/nutrientMap';

function emptyFood() {
  return {
    name: '',
    cost: 0,
    servingBounds: { min: 0, max: 10 },
    nutrients: Object.fromEntries(NUTRIENTS.map(nutrient => [nutrient.key, 0])),
  };
}

const MANUAL_NUTRIENTS = ['calories', 'protein', 'fat', 'carbs', 'fiber', 'sugars', 'sodium', 'calcium', 'iron', 'potassium', 'vitaminD', 'vitaminC'];

export default function ManualFoodForm({ onAdd }) {
  const [food, setFood] = useState(emptyFood);

  function updateName(event) {
    setFood(current => ({ ...current, name: event.target.value }));
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
      <p className="muted">Use this when USDA search is unavailable or you have a label you trust.</p>
      <div className="grid form-grid">
        <label>
          Food name
          <input value={food.name} onChange={updateName} placeholder="Egg, spinach, lentils..." required />
        </label>
        {MANUAL_NUTRIENTS.map(key => {
          const nutrient = NUTRIENTS.find(item => item.key === key);
          return (
            <label key={key}>
              {nutrient.label} ({nutrient.unit})
              <input type="number" min="0" step="0.1" value={food.nutrients[key]} onChange={updateNutrient(key)} />
            </label>
          );
        })}
        <label>
          Cost ($ per 100g, unused)
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
      <button type="submit">Add manual food</button>
    </form>
  );
}

function toNumber(value, fallback) {
  if (value === '' || value == null) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}
