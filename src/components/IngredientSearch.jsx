import { searchFoods } from '../lib/foodApi';
import { formatNutrientValue } from '../lib/nutrientMap';
import { useEffect, useRef, useState } from 'react';

const DEBOUNCE_MS = 300;

export default function IngredientSearch({ apiKey, onAdd }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const searchCounter = useRef(0);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setMessage(null);
      setLoading(false);
      return undefined;
    }

    const timer = setTimeout(() => {
      const searchId = searchCounter.current + 1;
      searchCounter.current = searchId;
      setLoading(true);
      setMessage(null);

      searchFoods(trimmed, apiKey)
        .then(foods => {
          if (searchCounter.current !== searchId) return;
          setResults(foods);
          setMessage(foods.length === 0
            ? 'No USDA foods found. Try a broader term like "egg" instead of a brand or very specific preparation.'
            : null);
        })
        .catch(searchError => {
          if (searchCounter.current !== searchId) return;
          setResults([]);
          setMessage(`${searchError.message}. Paste your USDA key or add the food manually.`);
        })
        .finally(() => {
          if (searchCounter.current === searchId) setLoading(false);
        });
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [apiKey, query]);

  function handleSubmit(event) {
    event.preventDefault();
  }

  return (
    <div className="search-card">
      <form className="search-row" onSubmit={handleSubmit}>
        <label className="sr-only" htmlFor="ingredient-search">Search ingredients</label>
        <input
          id="ingredient-search"
          value={query}
          onChange={event => setQuery(event.target.value)}
          placeholder="Search USDA Foundation + SR Legacy foods: eggs, oats, spinach..."
        />
        <button type="submit" disabled>
          {loading ? 'Searching...' : 'Live search'}
        </button>
      </form>
      <p className="muted">Search runs about 300ms after you stop typing to avoid hammering USDA's API.</p>

      {message && <p className="alert">{message}</p>}

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
