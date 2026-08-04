import { formatNutrientValue } from '../lib/nutrientMap';

const SUMMARY_KEYS = ['calories', 'protein', 'fat', 'carbs', 'fiber', 'sugars', 'calcium', 'iron', 'sodium'];

export default function IngredientList({ foods, setFoods }) {
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
    <div className="food-grid">
      {foods.map(food => (
        <article className="food-card" key={food.id}>
          <div>
            <h3>{food.name}</h3>
            <p className="muted">{food.dataType} · {food.unit}. Nutrient values shown are per 100g of this food, not per serving or daily totals.</p>
          </div>
          <div className="nutrient-chips">
            {SUMMARY_KEYS.map(key => (
              <span key={key}>{formatNutrientValue(key, food.nutrients?.[key])}</span>
            ))}
          </div>
          <div className="grid form-grid">
            <label>
              Cost ($ per 100g, unused)
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
          <button type="button" className="ghost" onClick={() => remove(food.id)}>Remove</button>
        </article>
      ))}
    </div>
  );
}
