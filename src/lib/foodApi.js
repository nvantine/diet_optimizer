import { normalizeFoodCategory } from './foodCategory';
import { estimateMaxServing } from './servingCaps';
import { mapUsdaNutrients } from './nutrientMap';

const USDA_SEARCH_URL = 'https://api.nal.usda.gov/fdc/v1/foods/search';
const USDA_LIST_URL = 'https://api.nal.usda.gov/fdc/v1/foods/list';
const USDA_LIST_PAGE_SIZE = 200;
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

export async function listRandomFoundationFoods(count, apiKey, { min, max } = { min: 0, max: 10 }) {
  const trimmedKey = apiKey?.trim();
  const requestedCount = clampCount(count);
  const servingBounds = { min: toNumber(min, 0), max: toNumber(max, 10) };

  if (!trimmedKey) {
    throw new Error('USDA API key is required to list random Foundation foods');
  }

  const pool = [];
  const seen = new Set();
  const maxPages = Math.min(5, Math.max(2, Math.ceil((requestedCount * 3) / USDA_LIST_PAGE_SIZE), Math.ceil(requestedCount / USDA_LIST_PAGE_SIZE) + 2));

  for (let pageNumber = 1; pageNumber <= maxPages; pageNumber += 1) {
    const pageFoods = await fetchFoundationListPage(pageNumber, trimmedKey);
    if (pageFoods.length === 0) break;

    for (const rawFood of pageFoods) {
      if (seen.has(rawFood.fdcId)) continue;
      seen.add(rawFood.fdcId);
      const mappedFood = mapUsdaFood(rawFood, { servingBounds });
      if (mappedFood.nutrients.calories > 0) pool.push(mappedFood);
    }

    if (pool.length >= requestedCount * 2 || (pool.length >= requestedCount && pageFoods.length < USDA_LIST_PAGE_SIZE && pageNumber >= 2)) break;
  }

  if (pool.length < requestedCount) {
    throw new Error(`Only found ${pool.length} Foundation foods with calories above zero; requested ${requestedCount}`);
  }

  return shuffle(pool).slice(0, requestedCount);
}

async function fetchFoundationListPage(pageNumber, apiKey) {
  const url = new URL(USDA_LIST_URL);
  url.searchParams.set('dataType', 'Foundation');
  url.searchParams.set('pageSize', String(USDA_LIST_PAGE_SIZE));
  url.searchParams.set('pageNumber', String(pageNumber));
  url.searchParams.set('api_key', apiKey);

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`USDA FoodData Central list failed with status ${response.status}`);
  }

  const data = await response.json();
  return Array.isArray(data) ? data : data.foods || [];
}

function shuffle(items) {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

function clampCount(count) {
  const parsed = Number(count);
  if (!Number.isFinite(parsed)) return 1;
  return Math.min(100, Math.max(1, Math.trunc(parsed)));
}

function toNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function mapUsdaFood(food, overrides = {}) {
  const name = food.description || food.lowercaseDescription || 'Unnamed food';
  const category = normalizeFoodCategory(food.foodCategory || food.foodCategoryDescription, name);
  return {
    id: String(food.fdcId),
    name,
    brand: food.brandOwner || food.brandName || '',
    dataType: food.dataType || 'USDA',
    unit: 'per 100g',
    category,
    // Cost estimates remain in costEstimates.js, but new foods default to $0
    // until real price data is wired in. Users can edit per-food costs manually.
    cost: 0,
    servingBounds: overrides.servingBounds || { min: 0, max: estimateMaxServing(name, category) },
    // TODO: Some foods are naturally discrete (for example, one egg), but the
    // optimizer currently treats all foods as continuous 100g units. Revisit
    // later with an optional MILP/integer-serving mode if discrete serving
    // recommendations become important.
    nutrients: mapUsdaNutrients(food.foodNutrients || []),
  };
}
