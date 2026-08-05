import { useEffect, useMemo, useRef, useState } from 'react';
import { FOOD_CATEGORY_LABELS } from '../lib/foodCategory';
import { normalizeShares } from '../lib/categoryShares';

const CATEGORY_SHARE_COLORS = ['#60a5fa', '#22c55e', '#fb923c', '#14b8a6', '#a855f7', '#f472b6', '#facc15', '#38bdf8', '#818cf8', '#f43f5e', '#94a3b8'];

export default function CategoryShareBar({ foods, shares, onChange, calorieTarget }) {
  const categories = useMemo(() => [...new Set(foods.map(food => food.category || 'other'))], [foods]);
  const normalizedShares = useMemo(() => normalizeShares(shares, categories), [categories, shares]);
  const [visualShares, setVisualShares] = useState(normalizedShares);
  const visualSharesRef = useRef(normalizedShares);
  const [editingCategory, setEditingCategory] = useState(null);
  const disabled = !calorieTarget || categories.length === 0;

  useEffect(() => {
    setVisualShares(normalizedShares);
    visualSharesRef.current = normalizedShares;
  }, [normalizedShares]);

  function commitShares(nextShares) {
    const normalized = normalizeShares(nextShares, categories);
    setVisualShares(normalized);
    visualSharesRef.current = normalized;
    onChange(normalized);
  }

  function setCategoryShare(category, value) {
    const parsed = Math.min(100, Math.max(0, Number(value) || 0));
    const others = categories.filter(item => item !== category);
    const remaining = Math.max(0, 100 - parsed);
    const otherTotal = others.reduce((sum, item) => sum + (visualSharesRef.current[item] || 0), 0);
    const next = { [category]: parsed };
    for (const item of others) next[item] = otherTotal > 0 ? ((visualSharesRef.current[item] || 0) / otherTotal) * remaining : remaining / Math.max(others.length, 1);
    commitShares(next);
  }

  function previewDivider(leftIndex, clientY, rect) {
    const leftCategory = categories[leftIndex];
    const rightCategory = categories[leftIndex + 1];
    const pct = ((clientY - rect.top) / rect.height) * 100;
    const current = visualSharesRef.current;
    const prior = categories.slice(0, leftIndex).reduce((sum, category) => sum + current[category], 0);
    const pairTotal = current[leftCategory] + current[rightCategory];
    const leftShare = Math.min(pairTotal, Math.max(0, pct - prior));
    const next = normalizeShares({ ...current, [leftCategory]: leftShare, [rightCategory]: pairTotal - leftShare }, categories);
    visualSharesRef.current = next;
    setVisualShares(next);
  }

  function startDrag(index, event) {
    if (disabled) return;
    event.preventDefault();
    const rect = event.currentTarget.closest('.category-share-bar').getBoundingClientRect();
    const move = moveEvent => previewDivider(index, moveEvent.clientY, rect);
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      onChange(visualSharesRef.current);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  }

  return (
    <section id="category-shares-section" className={`card category-share-card ${disabled ? 'category-share-disabled' : ''}`}>
      <div className="section-heading"><span>3</span><div><h2>Category calorie shares</h2><p className="muted">Limit each food category to a maximum percentage of daily calories.</p></div></div>
      {disabled && <p className="muted">Set a calorie target in Goals to enable category limits.</p>}
      <div className="category-share-control">
        <div className="category-share-bar" aria-label="Category calorie share bar" aria-disabled={disabled ? 'true' : 'false'}>
          {categories.map((category, index) => (
            <div className="category-share-segment" key={category} style={{ height: `${visualShares[category] || 0}%`, background: categoryShareColor(index) }}>
              {index < categories.length - 1 && <button type="button" className="category-share-handle" disabled={disabled} aria-label={`Adjust ${FOOD_CATEGORY_LABELS[category] || category} share`} onPointerDown={event => startDrag(index, event)} />}
            </div>
          ))}
        </div>
        <div className="category-share-chips" aria-label="Category share exact controls">
          {categories.map((category, index) => (
            <div className="category-share-chip" key={category} style={{ '--category-color': categoryShareColor(index) }}>
              {editingCategory === category ? (
                <input
                  aria-label={`${FOOD_CATEGORY_LABELS[category] || category} exact share`}
                  autoFocus
                  className="category-share-input"
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  defaultValue={Math.round(visualShares[category] || 0)}
                  onBlur={event => { setCategoryShare(category, event.target.value); setEditingCategory(null); }}
                  onKeyDown={event => { if (event.key === 'Enter') event.currentTarget.blur(); }}
                />
              ) : (
                <button type="button" className="category-share-label" disabled={disabled} onClick={() => setEditingCategory(category)} aria-label={`Edit ${FOOD_CATEGORY_LABELS[category] || category} share`}>
                  <span>{FOOD_CATEGORY_LABELS[category] || category}</span><strong>{Math.round(visualShares[category] || 0)}%</strong>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function categoryShareColor(index) {
  return CATEGORY_SHARE_COLORS[index % CATEGORY_SHARE_COLORS.length];
}
