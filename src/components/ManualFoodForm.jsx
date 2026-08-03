import { useState } from 'react';

const EMPTY_FOOD = {
  name: '',
  brand: 'Manual',
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
  sodium: 0,
  cost: 0,
  maxServing: 10,
};

export default function ManualFoodForm({ onAdd }) {
  const [food, setFood] = useState(EMPTY_FOOD);

  function update(key) {
    return event => {
      const value = key === 'name' ? event.target.value : Number(event.target.value);
      setFood(current => ({ ...current, [key]: value }));
    };
  }

  function submit(event) {
    event.preventDefault();
    if (!food.name.trim()) return;
    onAdd({
      ...food,
      id: `manual-${food.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`,
      name: food.name.trim(),
      unit: 'per 100g',
    });
    setFood(EMPTY_FOOD);
  }

  return (
    <form className="manual-food-card" onSubmit={submit}>
      <div className="section-kicker">Manual fallback</div>
      <h3>Add food manually</h3>
      <p className="muted">Use this when OpenFoodFacts is down or when you know the exact food label and price.</p>
      <div className="grid form-grid">
        <label>
          Food name
          <input value={food.name} onChange={update('name')} placeholder="Greek yogurt" required />
        </label>
        <label>
          Calories
          <input type="number" min="0" value={food.calories} onChange={update('calories')} />
        </label>
        <label>
          Protein (g)
          <input type="number" min="0" step="0.1" value={food.protein} onChange={update('protein')} />
        </label>
        <label>
          Carbs (g)
          <input type="number" min="0" step="0.1" value={food.carbs} onChange={update('carbs')} />
        </label>
        <label>
          Fat (g)
          <input type="number" min="0" step="0.1" value={food.fat} onChange={update('fat')} />
        </label>
        <label>
          Sodium (mg)
          <input type="number" min="0" step="1" value={food.sodium} onChange={update('sodium')} />
        </label>
        <label>
          Cost ($ per 100g)
          <input type="number" min="0" step="0.01" value={food.cost} onChange={update('cost')} />
        </label>
        <label>
          Max 100g units
          <input type="number" min="0" step="0.25" value={food.maxServing} onChange={update('maxServing')} />
        </label>
      </div>
      <button type="submit">Add manual food</button>
    </form>
  );
}
