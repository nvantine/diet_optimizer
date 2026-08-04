import { afterEach, describe, expect, it, vi } from 'vitest';
import { searchFoods, mapUsdaFood } from './foodApi';

describe('USDA FoodData Central API', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('maps broad observed USDA nutrient ids into per-100g nutrient vectors and keeps missing data distinct from zero', () => {
    const food = mapUsdaFood({
      fdcId: 171515,
      description: 'Chicken breast tenders, breaded, uncooked',
      dataType: 'SR Legacy',
      foodNutrients: [
        { nutrient: { id: 1008, number: '208', name: 'Energy', unitName: 'kcal' }, amount: 263 },
        { nutrient: { id: 1003, number: '203', name: 'Protein', unitName: 'g' }, amount: 14.73 },
        { nutrient: { id: 1258, number: '606', name: 'Fatty acids, total saturated', unitName: 'g' }, amount: 3.26 },
        { nutrient: { id: 1257, number: '605', name: 'Fatty acids, total trans', unitName: 'g' }, amount: 0 },
        { nutrient: { id: 1253, number: '601', name: 'Cholesterol', unitName: 'mg' }, amount: 41 },
        { nutrient: { id: 1165, number: '404', name: 'Thiamin', unitName: 'mg' }, amount: 0.211 },
        { nutrient: { id: 1109, number: '323', name: 'Vitamin E (alpha-tocopherol)', unitName: 'mg' }, amount: 0.08 },
        { nutrient: { id: 1091, number: '305', name: 'Phosphorus, P', unitName: 'mg' }, amount: 211 },
        { nutrient: { id: 1213, number: '504', name: 'Leucine', unitName: 'g' }, amount: 1.019 },
        { nutrient: { id: 1268, number: '617', name: 'MUFA 18:1', unitName: 'g' }, amount: 5.933 },
        { nutrient: { id: 1051, number: '255', name: 'Water', unitName: 'g' }, amount: 52.74 },
        { nutrient: { id: 1007, number: '207', name: 'Ash', unitName: 'g' }, amount: 1.77 },
      ],
    });

    expect(food).toEqual(expect.objectContaining({
      id: '171515',
      name: 'Chicken breast tenders, breaded, uncooked',
      dataType: 'SR Legacy',
      unit: 'per 100g',
      cost: 0,
      servingBounds: { min: 0, max: 10 },
      nutrients: expect.objectContaining({
        calories: 263,
        protein: 14.73,
        saturatedFat: 3.26,
        transFat: 0,
        cholesterol: 41,
        vitaminB1: 0.211,
        vitaminE: 0.08,
        phosphorus: 211,
        leucine: 1.019,
        mufa18_1: 5.933,
        water: 52.74,
        ash: 1.77,
        addedSugars: null,
      }),
    }));
  });

  it('uses the required USDA GET search endpoint with Foundation data by default', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => ({ foods: [] }),
    })));

    await searchFoods('eggs', 'abc123');

    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, options] = fetch.mock.calls[0];
    expect(options).toBeUndefined();
    const parsed = new URL(url);
    expect(`${parsed.origin}${parsed.pathname}`).toBe('https://api.nal.usda.gov/fdc/v1/foods/search');
    expect(parsed.searchParams.get('query')).toBe('eggs');
    expect(parsed.searchParams.get('dataType')).toBe('Foundation');
    expect(parsed.searchParams.get('api_key')).toBe('abc123');
  });

  it('can opt into Foundation plus SR Legacy for broader coverage', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => ({ foods: [] }),
    })));

    await searchFoods('oats', 'abc123', 'Foundation,SR Legacy');

    const [url] = fetch.mock.calls[0];
    const parsed = new URL(url);
    expect(parsed.searchParams.get('dataType')).toBe('Foundation,SR Legacy');
  });

  it('requires the USDA API key before searching', async () => {
    await expect(searchFoods('egg', '')).rejects.toThrow('USDA API key is required');
  });
});
