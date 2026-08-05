import { useMemo, useState } from 'react';
import { FOOD_CATEGORY_LABELS } from '../lib/foodCategory';
import { normalizeShares } from '../lib/categoryShares';

export default function CategoryShareBar({ foods, shares, onChange, calorieTarget }) {
  const categories = useMemo(() => [...new Set(foods.map(food => food.category || 'other'))], [foods]);
  const normalizedShares = useMemo(() => normalizeShares(shares, categories), [categories, shares]);
  const [editingCategory, setEditingCategory] = useState(null);
  const disabled = !calorieTarget || categories.length === 0;

  function setCategoryShare(category, value) {
    const parsed = Math.min(100, Math.max(0, Number(value) || 0));
    const others = categories.filter(item => item !== category);
    const remaining = Math.max(0, 100 - parsed);
    const otherTotal = others.reduce((sum, item) => sum + (normalizedShares[item] || 0), 0);
    const next = { [category]: parsed };
    for (const item of others) next[item] = otherTotal > 0 ? ((normalizedShares[item] || 0) / otherTotal) * remaining : remaining / Math.max(others.length, 1);
    onChange(normalizeShares(next, categories));
  }

  function adjustDivider(leftIndex, clientX, rect) {
    const leftCategory = categories[leftIndex];
    const rightCategory = categories[leftIndex + 1];
    const pct = ((clientX - rect.left) / rect.width) * 100;
    const prior = categories.slice(0, leftIndex).reduce((sum, category) => sum + normalizedShares[category], 0);
    const pairTotal = normalizedShares[leftCategory] + normalizedShares[rightCategory];
    const leftShare = Math.min(pairTotal, Math.max(0, pct - prior));
    onChange(normalizeShares({ ...normalizedShares, [leftCategory]: leftShare, [rightCategory]: pairTotal - leftShare }, categories));
  }

  function startDrag(index, event) {
    if (disabled) return;
    const rect = event.currentTarget.parentElement.getBoundingClientRect();
    const move = moveEvent => adjustDivider(index, moveEvent.clientX, rect);
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  }

  return (
    <section id="category-shares-section" className={`card category-share-card ${disabled ? 'category-share-disabled' : ''}`}>
      <div className="section-heading"><span>3</span><div><h2>Category calorie shares</h2><p className="muted">Limit each food category to a maximum percentage of daily calories.</p></div></div>
      {disabled && <p className="muted">Set a calorie target in Goals to enable category limits.</p>}
      <div className="category-share-bar" aria-label="Category calorie share bar" aria-disabled={disabled ? 'true' : 'false'}>
        {categories.map((category, index) => (
          <div className="category-share-segment" key={category} style={{ width: `${normalizedShares[category] || 0}%` }}>
            {editingCategory === category ? (
              <input
                aria-label={`${FOOD_CATEGORY_LABELS[category] || category} exact share`}
                autoFocus
                className="category-share-input"
                type="number"
                min="0"
                max="100"
                step="1"
                defaultValue={Math.round(normalizedShares[category] || 0)}
                onBlur={event => { setCategoryShare(category, event.target.value); setEditingCategory(null); }}
                onKeyDown={event => { if (event.key === 'Enter') event.currentTarget.blur(); }}
              />
            ) : (
              <button type="button" className="category-share-label" disabled={disabled} onClick={() => setEditingCategory(category)} aria-label={`Edit ${FOOD_CATEGORY_LABELS[category] || category} share`}>
                <span>{FOOD_CATEGORY_LABELS[category] || category}</span><strong>{Math.round(normalizedShares[category] || 0)}%</strong>
              </button>
            )}
            {index < categories.length - 1 && <button type="button" className="category-share-handle" disabled={disabled} aria-label={`Adjust ${FOOD_CATEGORY_LABELS[category] || category} share`} onPointerDown={event => startDrag(index, event)} />}
          </div>
        ))}
      </div>
    </section>
  );
}
