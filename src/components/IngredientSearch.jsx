// IngredientSearch.jsx
import { useState } from 'react';
import { searchFoods } from '../lib/foodApi';

export default function IngredientSearch({ onAdd }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSearch(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      setResults(await searchFoods(query));
    } catch (err) {
      setError('Search failed — try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <form onSubmit={handleSearch}>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search ingredients (e.g. chicken breast, oats, lentils)..."
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {error && <p style={{ color: 'crimson' }}>{error}</p>}

      {results.length > 0 && (
        <ul>
          {results.map(f => (
            <li key={f.id}>
              {f.name} {f.brand && <small>({f.brand})</small>} — {f.calories} kcal, {f.protein}g protein
              /100g
              <button onClick={() => onAdd(f)}>Add</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}