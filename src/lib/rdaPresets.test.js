import { describe, expect, it } from 'vitest';
import { buildRdaPresetConstraints } from './rdaPresets';
import { NUTRIENT_TIERS } from './nutrientMap';

describe('RDA biometric presets', () => {
  it('computes simple-tier male preset constraints from weight and Mifflin-St Jeor calories', () => {
    const preset = buildRdaPresetConstraints({
      sex: 'male',
      weightKg: 70,
      heightCm: 178,
      ageYears: 25,
      tier: NUTRIENT_TIERS.simple,
    });

    expect(preset.protein).toEqual({ min: 56, max: '' });
    expect(preset.calories.min).toBeCloseTo(2370, 0);
    expect(preset.carbs).toEqual({ min: 130, max: '' });
    expect(preset.fiber).toEqual({ min: 38, max: '' });
    expect(preset.sodium).toEqual({ min: '', max: 2300 });
    expect(preset.vitaminC).toBeUndefined();
  });

  it('uses placeholder defaults for blank height and age and female fixed nutrients', () => {
    const preset = buildRdaPresetConstraints({
      sex: 'female',
      weightKg: 57,
      heightCm: '',
      ageYears: '',
      tier: NUTRIENT_TIERS.medium,
    });

    expect(preset.calories.min).toBeCloseTo(1885, 0);
    expect(preset.protein).toEqual({ min: 45.6, max: '' });
    expect(preset.vitaminA).toEqual({ min: 700, max: '' });
    expect(preset.vitaminC).toEqual({ min: 75, max: '' });
    expect(preset.iron).toEqual({ min: 18, max: '' });
    expect(preset.magnesium).toEqual({ min: 310, max: '' });
    expect(preset.leucine).toBeUndefined();
  });

  it('uses plausible Mifflin-St Jeor smoke-test calories for a female example', () => {
    const preset = buildRdaPresetConstraints({
      sex: 'female',
      weightKg: 57,
      heightCm: 165,
      ageYears: 25,
      tier: NUTRIENT_TIERS.simple,
    });

    expect(preset.calories.min).toBeCloseTo(1841, 0);
  });
});
