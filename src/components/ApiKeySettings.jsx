import { useEffect, useState } from 'react';

const STORAGE_KEY = 'dietOptimizer.usdaApiKey';

export default function ApiKeySettings({ apiKey, setApiKey }) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setApiKey(localStorage.getItem(STORAGE_KEY) || '');
    setLoaded(true);
  }, [setApiKey]);

  function updateApiKey(event) {
    const nextKey = event.target.value;
    setApiKey(nextKey);
    localStorage.setItem(STORAGE_KEY, nextKey);
  }

  return (
    <div className="api-key-card">
      <label>
        USDA API key
        <input
          type="password"
          value={apiKey}
          onChange={updateApiKey}
          placeholder="Paste your FoodData Central API key"
          autoComplete="off"
          disabled={!loaded}
        />
      </label>
      <p className="muted">Stored only in this browser's localStorage. Do not commit API keys.</p>
    </div>
  );
}

export { STORAGE_KEY as USDA_API_KEY_STORAGE_KEY };
