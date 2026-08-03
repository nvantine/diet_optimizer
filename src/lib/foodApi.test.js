import { afterEach, describe, expect, it, vi } from 'vitest';
import { searchFoods } from './foodApi';

describe('searchFoods', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('maps OpenFoodFacts products into optimizer foods', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => ({
        products: [
          {
            code: '123',
            product_name: 'Rolled Oats',
            brands: 'Example Brand',
            nutriments: {
              'energy-kcal_100g': 389.123,
              proteins_100g: 16.9,
              carbohydrates_100g: 66.3,
              fat_100g: 6.9,
              sodium_100g: 0.002,
            },
          },
        ],
      }),
    })));

    await expect(searchFoods('oats')).resolves.toEqual([
      expect.objectContaining({
        id: '123',
        name: 'Rolled Oats',
        brand: 'Example Brand',
        calories: 389.12,
        protein: 16.9,
        sodium: 2,
        cost: '',
        maxServing: 10,
      }),
    ]);
  });

  it('throws a helpful error on upstream failures', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 503 })));

    await expect(searchFoods('oats')).rejects.toThrow('OpenFoodFacts search failed with status 503');
  });
});
