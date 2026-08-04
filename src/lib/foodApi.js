import { mapUsdaNutrients } from './nutrientMap';

const USDA_SEARCH_URL = 'https://api.nal.usda.gov/fdc/v1/foods/search';

export async function searchFoods(query, apiKey) {
  const trimmedQuery = query.trim();
  const trimmedKey = apiKey?.trim();

  if (!trimmedQuery) return [];
  if (!trimmedKey) {
    throw new Error('USDA API key is required to search FoodData Central');
  }

  const url = new URL(USDA_SEARCH_URL);
  url.searchParams.set('query', trimmedQuery);
  url.searchParams.set('dataType', 'Foundation,SR Legacy');
  url.searchParams.set('api_key', trimmedKey);

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`USDA FoodData Central search failed with status ${response.status}`);
  }

  const data = await response.json();
  return (data.foods || [])
    .map(mapUsdaFood)
    .filter(food => food.nutrients.calories > 0);
}

export function mapUsdaFood(food) {
  return {
    id: String(food.fdcId),
    name: food.description || food.lowercaseDescription || 'Unnamed food',
    brand: food.brandOwner || food.brandName || '',
    dataType: food.dataType || 'USDA',
    unit: 'per 100g',
    cost: 0,
    servingBounds: { min: 0, max: 10 },
    nutrients: mapUsdaNutrients(food.foodNutrients || []),
  };
}
