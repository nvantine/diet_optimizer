import { useState } from 'react';
import { searchFoods } from '../lib/foodApi';

export default function IngredientSearch({ onAdd }) {
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
      const foods = await searchFoods(query);
      setResults(foods);
      if (foods.length === 0) {
        setError('No matching products found. Try a broader term or add it manually.');
      }
    } catch (error) {
      setError(`${error.message}. You can still add the food manually below.`);
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
          placeholder="Search OpenFoodFacts: oats, chicken breast, lentils..."
        />
        <button type="submit" disabled={loading || !query.trim()}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {error && <p className="alert">{error}</p>}

      {results.length > 0 && (
        <div className="results-list" aria-label="Search results">
          {results.map(food => (
            <article className="result-card" key={food.id}>
              <div>
                <strong>{food.name}</strong>
                {food.brand && <span className="muted"> · {food.brand}</span>}
                <p className="muted">{food.calories} kcal · {food.protein}g protein · {food.sodium}mg sodium / 100g</p>
              </div>
              <button onClick={() => onAdd(food)}>Add</button>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
