const OFF_SEARCH = 'https://world.openfoodfacts.org/cgi/search.pl';

export async function searchFoods(query) {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const url = `${OFF_SEARCH}?search_terms=${encodeURIComponent(trimmed)}&search_simple=1&action=process&json=1&page_size=15`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`OpenFoodFacts search failed with status ${res.status}`);
  }

  const data = await res.json();
  return (data.products || [])
    .filter(product => product.nutriments && product.product_name)
    .map(mapProduct);
}

function mapProduct(product) {
  return {
    id: product.code || stableFallbackId(product),
    name: product.product_name,
    brand: product.brands ?? '',
    calories: round(product.nutriments['energy-kcal_100g']),
    protein: round(product.nutriments.proteins_100g),
    carbs: round(product.nutriments.carbohydrates_100g),
    fat: round(product.nutriments.fat_100g),
    sodium: round((product.nutriments.sodium_100g ?? 0) * 1000),
    unit: 'per 100g',
    cost: '',
    maxServing: 10,
  };
}

function stableFallbackId(product) {
  return `${product.product_name}-${product.brands ?? ''}`.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

function round(n) {
  return n == null ? 0 : Math.round(n * 100) / 100;
}
