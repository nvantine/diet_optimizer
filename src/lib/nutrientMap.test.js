import { describe, expect, it } from 'vitest';
import { NUTRIENTS, defaultConstraints, formatNutrientValue, mapUsdaNutrients, NUTRIENT_TIERS } from './nutrientMap';

describe('nutrient map tiers', () => {
  it('assigns every nutrient to simple, medium, or all', () => {
    expect(NUTRIENTS.every(nutrient => ['simple', 'medium', 'all'].includes(nutrient.tier))).toBe(true);
  });

  it('maps live-confirmed DRI micronutrient ids added for the medium tier', () => {
    const nutrients = mapUsdaNutrients([
      { nutrient: { id: 1170, name: 'Pantothenic acid', unitName: 'mg' }, amount: 1.4 },
      { nutrient: { id: 1176, name: 'Biotin', unitName: 'µg' }, amount: 11 },
      { nutrient: { id: 1096, name: 'Chromium, Cr', unitName: 'µg' }, amount: 8 },
      { nutrient: { id: 1099, name: 'Fluoride, F', unitName: 'µg' }, amount: 4 },
      { nutrient: { id: 1100, name: 'Iodine, I', unitName: 'µg' }, amount: 150 },
      { nutrient: { id: 1102, name: 'Molybdenum, Mo', unitName: 'µg' }, amount: 45 },
    ]);

    expect(nutrients).toEqual(expect.objectContaining({
      pantothenicAcid: 1.4,
      biotin: 11,
      chromium: 8,
      fluoride: 4,
      iodine: 150,
      molybdenum: 45,
    }));
  });

  it('includes nutrient labels in formatted values so same-unit pills are distinguishable', () => {
    expect(formatNutrientValue('protein', 12)).toBe('Protein: 12 g');
    expect(formatNutrientValue('fat', 12)).toBe('Total fat: 12 g');
  });

  it('uses DRI-inspired defaults for newly tracked medium-tier nutrients when medium constraints are active', () => {
    const defaults = defaultConstraints(NUTRIENT_TIERS.medium);

    expect(defaults).toEqual(expect.objectContaining({
      pantothenicAcid: { min: 5, max: '' },
      biotin: { min: 30, max: '' },
      chromium: { min: 35, max: '' },
      fluoride: { min: 4000, max: 10000 },
      iodine: { min: 150, max: '' },
      molybdenum: { min: 45, max: '' },
    }));
  });
});
