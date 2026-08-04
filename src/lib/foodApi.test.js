import { afterEach, describe, expect, it, vi } from 'vitest';
import { searchFoods, mapUsdaFood } from './foodApi';

describe('USDA FoodData Central API', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('maps USDA Foundation foods into per-100g nutrient vectors and keeps cost unused', () => {
    const food = mapUsdaFood({
      fdcId: 747997,
      description: 'Egg, whole, raw, fresh',
      dataType: 'Foundation',
      foodNutrients: [
        { nutrientId: 1008, nutrientName: 'Energy', unitName: 'KCAL', value: 143 },
        { nutrientId: 1003, nutrientName: 'Protein', unitName: 'G', value: 12.6 },
        { nutrientId: 1004, nutrientName: 'Total lipid (fat)', unitName: 'G', value: 9.5 },
        { nutrientId: 1005, nutrientName: 'Carbohydrate, by difference', unitName: 'G', value: 0.72 },
        { nutrientId: 1079, nutrientName: 'Fiber, total dietary', unitName: 'G', value: 0 },
        { nutrientId: 2000, nutrientName: 'Sugars, Total', unitName: 'G', value: 0.37 },
        { nutrientId: 1093, nutrientName: 'Sodium, Na', unitName: 'MG', value: 142 },
        { nutrientId: 1087, nutrientName: 'Calcium, Ca', unitName: 'MG', value: 56 },
        { nutrientId: 1089, nutrientName: 'Iron, Fe', unitName: 'MG', value: 1.75 },
        { nutrientId: 1092, nutrientName: 'Potassium, K', unitName: 'MG', value: 138 },
        { nutrientId: 1114, nutrientName: 'Vitamin D (D2 + D3)', unitName: 'UG', value: 2 },
        { nutrientId: 1162, nutrientName: 'Vitamin C, total ascorbic acid', unitName: 'MG', value: 0 },
      ],
    });

    expect(food).toEqual(expect.objectContaining({
      id: '747997',
      name: 'Egg, whole, raw, fresh',
      dataType: 'Foundation',
      unit: 'per 100g',
      cost: 0,
      servingBounds: { min: 0, max: 10 },
      nutrients: expect.objectContaining({
        calories: 143,
        protein: 12.6,
        fat: 9.5,
        carbs: 0.72,
        fiber: 0,
        sugars: 0.37,
        sodium: 142,
        calcium: 56,
        iron: 1.75,
        potassium: 138,
        vitaminD: 2,
        vitaminC: 0,
      }),
    }));
  });

  it('uses the required USDA GET search endpoint with Foundation data only', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => ({ foods: [] }),
    })));

    await searchFoods('egg', 'abc123');

    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, options] = fetch.mock.calls[0];
    expect(options).toBeUndefined();
    const parsed = new URL(url);
    expect(`${parsed.origin}${parsed.pathname}`).toBe('https://api.nal.usda.gov/fdc/v1/foods/search');
    expect(parsed.searchParams.get('query')).toBe('egg');
    expect(parsed.searchParams.get('dataType')).toBe('Foundation');
    expect(parsed.searchParams.get('api_key')).toBe('abc123');
  });

  it('requires the USDA API key before searching', async () => {
    await expect(searchFoods('egg', '')).rejects.toThrow('USDA API key is required');
  });
});
