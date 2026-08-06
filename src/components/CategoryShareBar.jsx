import { useEffect, useMemo, useState } from 'react';
import { ResponsiveContainer, Treemap } from 'recharts';
import { FOOD_CATEGORY_LABELS } from '../lib/foodCategory';
import { normalizeShares } from '../lib/categoryShares';

const CATEGORY_SHARE_COLORS = ['#60a5fa', '#22c55e', '#fb923c', '#14b8a6', '#a855f7', '#f472b6', '#facc15', '#38bdf8', '#818cf8', '#f43f5e', '#94a3b8'];

export default function CategoryShareBar({ foods, shares, onChange, calorieTarget }) {
  const categories = useMemo(() => [...new Set(foods.map(food => food.category || 'other'))], [foods]);
  const normalizedShares = useMemo(() => normalizeShares(shares, categories), [categories, shares]);
  const [visualShares, setVisualShares] = useState(normalizedShares);
  const disabled = !calorieTarget || categories.length === 0;

  useEffect(() => {
    setVisualShares(normalizedShares);
  }, [normalizedShares]);

  function commitShares(nextShares) {
    const normalized = normalizeShares(nextShares, categories);
    setVisualShares(normalized);
    onChange(normalized);
  }

  function setCategoryShare(category, value) {
    const parsed = Math.min(100, Math.max(0, Number(value) || 0));
    const others = categories.filter(item => item !== category);
    const remaining = Math.max(0, 100 - parsed);
    const otherTotal = others.reduce((sum, item) => sum + (visualShares[item] || 0), 0);
    const next = { [category]: parsed };
    for (const item of others) next[item] = otherTotal > 0 ? ((visualShares[item] || 0) / otherTotal) * remaining : remaining / Math.max(others.length, 1);
    commitShares(next);
  }

  const treemapData = useMemo(() => categories.map((category, index) => ({
    name: FOOD_CATEGORY_LABELS[category] || category,
    category,
    value: Math.max(0.01, visualShares[category] || 0),
    share: visualShares[category] || 0,
    fill: categoryShareColor(index),
  })), [categories, visualShares]);

  return (
    <section id="category-shares-section" className={`card category-share-card ${disabled ? 'category-share-disabled' : ''}`}>
      <div className="section-heading"><span>3</span><div><h2>Category calorie shares</h2><p className="muted">Limit each food category to a maximum percentage of daily calories.</p></div></div>
      {disabled && <p className="muted">Set a calorie target in Goals to enable category limits.</p>}
      <div className="category-share-control">
        <div className="category-share-treemap" aria-label="Category calorie share treemap" aria-disabled={disabled ? 'true' : 'false'}>
          {categories.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <Treemap data={treemapData} dataKey="value" nameKey="name" stroke="#0f172a" content={<CategoryTreemapTile />} isAnimationActive={false} />
            </ResponsiveContainer>
          ) : (
            <p className="empty-state">Add foods to see category shares.</p>
          )}
        </div>
        <div className="category-share-input-list" aria-label="Category max calorie share controls">
          {categories.map((category, index) => (
            <label className="category-share-input-row" key={category} style={{ '--category-color': categoryShareColor(index) }}>
              <span>{FOOD_CATEGORY_LABELS[category] || category}</span>
              <input
                aria-label={`${FOOD_CATEGORY_LABELS[category] || category} max calorie share`}
                className="category-share-input"
                type="number"
                min="0"
                max="100"
                step="1"
                disabled={disabled}
                value={Math.round(visualShares[category] || 0)}
                onChange={event => setCategoryShare(category, event.target.value)}
              />
              <span className="category-share-percent" aria-hidden="true">%</span>
            </label>
          ))}
        </div>
      </div>
    </section>
  );
}

function CategoryTreemapTile({ x, y, width, height, name, share, fill }) {
  if (width <= 0 || height <= 0) return null;
  const showLabel = width > 70 && height > 38;
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} rx="12" ry="12" fill={fill} stroke="#111827" strokeWidth="2" />
      {showLabel && (
        <text x={x + 10} y={y + 22} fill="#0f172a" fontSize="13" fontWeight="700">
          <tspan>{name}</tspan>
          <tspan x={x + 10} dy="18">{Math.round(share)}%</tspan>
        </text>
      )}
    </g>
  );
}

function categoryShareColor(index) {
  return CATEGORY_SHARE_COLORS[index % CATEGORY_SHARE_COLORS.length];
}
