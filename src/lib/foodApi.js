import { mapUsdaNutrients } from './nutrientMap';

const USDA_SEARCH_URL = 'https://api.nal.usda.gov/fdc/v1/foods/search';
export const USDA_DATA_TYPES = {
  foundationOnly: 'Foundation',
  foundationAndSrLegacy: 'Foundation,SR Legacy',
};

export async function searchFoods(query, apiKey, dataType = USDA_DATA_TYPES.foundationOnly) {
  const trimmedQuery = query.trim();
  const trimmedKey = apiKey?.trim();
  const selectedDataType = dataType || USDA_DATA_TYPES.foundationOnly;

  if (!trimmedQuery) return [];
  if (!trimmedKey) {
    throw new Error('USDA API key is required to search FoodData Central');
  }

  const url = new URL(USDA_SEARCH_URL);
  url.searchParams.set('query', trimmedQuery);
  url.searchParams.set('dataType', selectedDataType);
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
    // TODO: Some foods are naturally discrete (for example, one egg), but the
    // optimizer currently treats all foods as continuous 100g units. Revisit
    // later with an optional MILP/integer-serving mode if discrete serving
    // recommendations become important.
    nutrients: mapUsdaNutrients(food.foodNutrients || []),
  };
}
