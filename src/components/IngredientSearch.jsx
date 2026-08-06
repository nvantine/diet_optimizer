import { searchFoods, USDA_DATA_TYPES } from '../lib/foodApi';
import { formatNutrientValue } from '../lib/nutrientMap';
import { useEffect, useMemo, useRef, useState } from 'react';

const DEBOUNCE_MS = 300;
const INITIAL_RESULT_COUNT = 12;
const TOAST_MS = 2000;

export default function IngredientSearch({ apiKey, existingIds = new Set(), onAdd }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [visibleCount, setVisibleCount] = useState(INITIAL_RESULT_COUNT);
  const [dataType, setDataType] = useState(USDA_DATA_TYPES.foundationOnly);
  const [, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [toast, setToast] = useState(null);
  const searchCounter = useRef(0);
  const toastTimer = useRef(null);

  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    setVisibleCount(INITIAL_RESULT_COUNT);
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

      searchFoods(trimmed, apiKey, dataType)
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
  }, [apiKey, dataType, query]);

  const visibleResults = useMemo(() => results.slice(0, visibleCount), [results, visibleCount]);
  const hiddenResultCount = Math.max(results.length - visibleResults.length, 0);

  function handleSubmit(event) {
    event.preventDefault();
  }

  function addFood(food) {
    onAdd(food);
    setToast(`Added ${food.name} to your list`);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), TOAST_MS);
  }

  return (
    <div className="search-card">
      {toast && <div className="toast" role="status">{toast}</div>}
      <form className="search-row" onSubmit={handleSubmit}>
        <label className="sr-only" htmlFor="ingredient-search">Search ingredients</label>
        <input
          id="ingredient-search"
          value={query}
          onChange={event => setQuery(event.target.value)}
          placeholder="Search USDA Foundation foods: eggs, oats, spinach..."
        />
      </form>
      <label className="data-type-filter" htmlFor="usda-data-type">
        <span>USDA data type</span>
        <select
          id="usda-data-type"
          value={dataType}
          onChange={event => setDataType(event.target.value)}
        >
          <option value={USDA_DATA_TYPES.foundationOnly}>Foundation only</option>
          <option value={USDA_DATA_TYPES.foundationAndSrLegacy}>Foundation + SR Legacy</option>
        </select>
      </label>
      <p className="muted">
        Search runs about 300ms after you stop typing to avoid hammering USDA's API.
        Foundation only is the default. Switching to SR Legacy expands coverage, but data may be older or less detailed on some micronutrients.
      </p>

      {message && <p className="alert">{message}</p>}

      {results.length > 0 && (
        <div className="results-list" aria-label="Search results">
          {visibleResults.map(food => {
            const alreadyAdded = existingIds.has(food.id);
            return (
              <article className="result-card" key={food.id}>
                <div>
                  <div className="result-heading">
                    <strong>{food.name}</strong>
                    <span className="pill">{food.dataType}</span>
                  </div>
                  <p className="muted">
                    {formatNutrientValue('calories', food.nutrients.calories)} · {formatNutrientValue('protein', food.nutrients.protein)} protein · {formatNutrientValue('calcium', food.nutrients.calcium)} calcium / 100g
                  </p>
                </div>
                {alreadyAdded
                  ? <span className="pill already-added">Already added</span>
                  : <button type="button" onClick={() => addFood(food)}>Add</button>}
              </article>
            );
          })}
          {hiddenResultCount > 0 && (
            <button
              className="ghost show-more-results"
              type="button"
              onClick={() => setVisibleCount(results.length)}
            >
              Show more results ({hiddenResultCount} more)
            </button>
          )}
        </div>
      )}
    </div>
  );
}
