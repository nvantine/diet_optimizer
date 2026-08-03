export default function IngredientList({ foods, setFoods }) {
  function updateField(id, key, value) {
    setFoods(foods.map(food => (food.id === id ? { ...food, [key]: value } : food)));
  }

  function remove(id) {
    setFoods(foods.filter(food => food.id !== id));
  }

  if (foods.length === 0) {
    return <p className="empty-state">No ingredients yet — search above or add a manual food.</p>;
  }

  const hasFreeFoods = foods.some(food => Number(food.cost) === 0 || food.cost === '');

  return (
    <div>
      {hasFreeFoods && <p className="alert">Set realistic costs before trusting the optimizer. Free foods can dominate the solution.</p>}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Cost ($ / 100g)</th>
              <th>Max 100g units</th>
              <th>Cal</th>
              <th>Protein</th>
              <th>Carbs</th>
              <th>Fat</th>
              <th>Sodium</th>
              <th><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {foods.map(food => (
              <tr key={food.id}>
                <td><strong>{food.name}</strong>{food.brand && <small> · {food.brand}</small>}<br /><small>{food.unit}</small></td>
                <td>
                  <input
                    aria-label={`Cost for ${food.name}`}
                    type="number"
                    step="0.01"
                    min="0"
                    value={food.cost}
                    onChange={event => updateField(food.id, 'cost', event.target.value === '' ? '' : Number(event.target.value))}
                  />
                </td>
                <td>
                  <input
                    aria-label={`Max servings for ${food.name}`}
                    type="number"
                    min="0"
                    step="0.25"
                    value={food.maxServing}
                    onChange={event => updateField(food.id, 'maxServing', Number(event.target.value))}
                  />
                </td>
                <td>{food.calories}</td>
                <td>{food.protein}g</td>
                <td>{food.carbs}g</td>
                <td>{food.fat}g</td>
                <td>{food.sodium}mg</td>
                <td><button className="ghost" onClick={() => remove(food.id)}>Remove</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
