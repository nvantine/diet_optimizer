// IngredientList.jsx
export default function IngredientList({ foods, setFoods }) {
  function updateField(id, key, value) {
    setFoods(foods.map(f => (f.id === id ? { ...f, [key]: value } : f)));
  }

  function remove(id) {
    setFoods(foods.filter(f => f.id !== id));
  }

  if (foods.length === 0) {
    return <p style={{ opacity: 0.6 }}>No ingredients yet — search above and add some.</p>;
  }

  return (
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Cost ($ / unit)</th>
          <th>Max servings</th>
          <th>Cal</th>
          <th>Protein (g)</th>
          <th>Carbs (g)</th>
          <th>Fat (g)</th>
          <th>Sodium (mg)</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {foods.map(f => (
          <tr key={f.id}>
            <td>{f.name} {f.brand && <small>({f.brand})</small>}<br /><small>{f.unit}</small></td>
            <td>
              <input
                type="number"
                step="0.01"
                min="0"
                value={f.cost}
                onChange={e => updateField(f.id, 'cost', +e.target.value)}
              />
            </td>
            <td>
              <input
                type="number"
                min="0"
                value={f.maxServing}
                onChange={e => updateField(f.id, 'maxServing', +e.target.value)}
              />
            </td>
            <td>{f.calories}</td>
            <td>{f.protein}</td>
            <td>{f.carbs}</td>
            <td>{f.fat}</td>
            <td>{f.sodium}</td>
            <td><button onClick={() => remove(f.id)}>✕</button></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}