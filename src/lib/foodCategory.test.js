import { describe, expect, it } from 'vitest';
import { normalizeFoodCategory, FOOD_CATEGORIES } from './foodCategory';

describe('foodCategory', () => {
  it('maps observed USDA category strings into optimizer buckets', () => {
    expect(normalizeFoodCategory('Poultry Products')).toBe('protein');
    expect(normalizeFoodCategory('Vegetables and Vegetable Products')).toBe('vegetable');
    expect(normalizeFoodCategory('Cereal Grains and Pasta')).toBe('grain');
    expect(normalizeFoodCategory('Dairy and Egg Products')).toBe('dairy');
    expect(normalizeFoodCategory('Legumes and Legume Products')).toBe('legume');
    expect(normalizeFoodCategory('Fats and Oils')).toBe('fat');
    expect(normalizeFoodCategory('Nut and Seed Products')).toBe('nuts');
  });

  it('accepts nested USDA category objects and falls back to food names', () => {
    expect(normalizeFoodCategory({ description: 'Fruits and Fruit Juices' })).toBe('fruit');
    expect(normalizeFoodCategory(null, 'Greek yogurt')).toBe('dairy');
    expect(normalizeFoodCategory('unknown thing', 'mystery')).toBe('other');
    expect(FOOD_CATEGORIES).toContain('other');
  });
});
