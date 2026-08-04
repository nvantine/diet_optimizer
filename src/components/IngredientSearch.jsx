import { searchFoods } from '../lib/foodApi';
import { formatNutrientValue } from '../lib/nutrientMap';
import { useState } from 'react';

export default function IngredientSearch({ apiKey, onAdd }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSearch(event) {
    event.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const foods = await searchFoods(query, apiKey);
      setResults(foods);
      if (foods.length === 0) setError('No USDA Foundation foods found. Try a simpler query.');
    } catch (searchError) {
      setError(`${searchError.message}. Paste your USDA key or add the food manually.`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="search-card">
      <form className="search-row" onSubmit={handleSearch}>
        <label className="sr-only" htmlFor="ingredient-search">Search ingredients</label>
        <input
          id="ingredient-search"
          value={query}
          onChange={event => setQuery(event.target.value)}
          placeholder="Search USDA Foundation foods: egg, oats, spinach..."
        />
        <button type="submit" disabled={loading || !query.trim()}>
          {loading ? 'Searching...' : 'Search USDA'}
        </button>
      </form>

      {error && <p className="alert">{error}</p>}

      {results.length > 0 && (
        <div className="results-list" aria-label="Search results">
          {results.map(food => (
            <article className="result-card" key={food.id}>
              <div>
                <strong>{food.name}</strong>
                <span className="pill">{food.dataType}</span>
                <p className="muted">
                  {formatNutrientValue('calories', food.nutrients.calories)} · {formatNutrientValue('protein', food.nutrients.protein)} protein · {formatNutrientValue('calcium', food.nutrients.calcium)} calcium / 100g
                </p>
              </div>
              <button type="button" onClick={() => onAdd(food)}>Add</button>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
