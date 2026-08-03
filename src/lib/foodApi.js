// foodApi.js
const OFF_SEARCH = 'https://world.openfoodfacts.org/cgi/search.pl';

export async function searchFoods(query) {
  if (!query.trim()) return [];

  const url = `${OFF_SEARCH}?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=15`;
  const res = await fetch(url);
  const data = await res.json();

  return (data.products || [])
    .filter(p => p.nutriments && p.product_name)
    .map(p => ({
      // stable-ish id: OFF barcode, fallback to name+random
      id: p.code || `${p.product_name}-${Math.random().toString(36).slice(2, 8)}`,
      name: p.product_name,
      brand: p.brands ?? '',
      calories: round(p.nutriments['energy-kcal_100g']),
      protein: round(p.nutriments['proteins_100g']),
      carbs: round(p.nutriments['carbohydrates_100g']),
      fat: round(p.nutriments['fat_100g']),
      sodium: round((p.nutriments['sodium_100g'] ?? 0) * 1000), // g -> mg
      unit: 'per 100g',
      cost: 0,          // OFF has no price data — user fills this in
      maxServing: 10,   // default cap, user-editable, not a "preset diet" value
    }));
}

function round(n) {
  return n == null ? 0 : Math.round(n * 100) / 100;
}