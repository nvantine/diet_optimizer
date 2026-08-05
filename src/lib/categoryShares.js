const DEFAULT_CATEGORY_SHARES = {
  grain: 30,
  vegetable: 20,
  fruit: 15,
  dairy: 15,
  protein: 15,
  fat: 5,
  legume: 0,
  nuts: 0,
  supplement: 0,
  snack: 0,
  other: 0,
};

export function defaultSharesForCategories(categories) {
  const present = [...new Set(categories)].filter(Boolean);
  if (present.length === 0) return {};
  const defaultTotal = present.reduce((sum, category) => sum + (DEFAULT_CATEGORY_SHARES[category] || 0), 0);
  if (defaultTotal <= 0) {
    const equal = 100 / present.length;
    return Object.fromEntries(present.map(category => [category, roundShare(equal)]));
  }
  return normalizeShares(Object.fromEntries(present.map(category => [category, ((DEFAULT_CATEGORY_SHARES[category] || 0) / defaultTotal) * 100])), present);
}

export function normalizeShares(nextShares, categories) {
  const present = [...new Set(categories)].filter(Boolean);
  if (present.length === 0) return {};
  const positive = Object.fromEntries(present.map(category => [category, Math.max(0, Number(nextShares[category] || 0))]));
  const total = Object.values(positive).reduce((sum, value) => sum + value, 0);
  if (total <= 0) return defaultSharesForCategories(present);
  let remaining = 100;
  return Object.fromEntries(present.map((category, index) => {
    const value = index === present.length - 1 ? remaining : roundShare((positive[category] / total) * 100);
    remaining = roundShare(remaining - value);
    return [category, value];
  }));
}

function roundShare(value) {
  return Math.round(value * 100) / 100;
}
