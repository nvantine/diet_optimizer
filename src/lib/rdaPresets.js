import { NUTRIENT_BY_KEY, NUTRIENT_TIERS, nutrientIsVisibleInTier } from './nutrientMap';

const DEFAULT_AGE_YEARS = 25;
const DEFAULT_HEIGHT_CM = 170;
const DEFAULT_WEIGHT_KG = 70;

// Fixed, simplified per-sex DRI/RDA-style constants sourced from Britannica's
// Dietary Reference Intakes table. Units match the app's nutrientMap units.
// Copper is listed as 900 µg in the table and stored here as 0.9 mg because
// USDA nutrient 1098 is reported in mg.
const FIXED_PRESETS = {
  female: {
    carbs: { min: 130 },
    fiber: { min: 25 },
    sodium: { max: 2300 },
    vitaminA: { min: 700 },
    vitaminC: { min: 75 },
    vitaminD: { min: 10 },
    vitaminE: { min: 15 },
    vitaminK: { min: 90 },
    vitaminB1: { min: 1.1 },
    vitaminB2: { min: 1.1 },
    vitaminB3: { min: 14 },
    vitaminB6: { min: 1.3 },
    folate: { min: 400 },
    vitaminB12: { min: 2.4 },
    calcium: { min: 1000 },
    // Approximation: use 18mg for women to cover menstruating women.
    iron: { min: 18 },
    magnesium: { min: 310 },
    phosphorus: { min: 700 },
    zinc: { min: 8 },
    copper: { min: 0.9 },
    manganese: { min: 1.8 },
    selenium: { min: 55 },
  },
  male: {
    carbs: { min: 130 },
    fiber: { min: 38 },
    sodium: { max: 2300 },
    vitaminA: { min: 900 },
    vitaminC: { min: 90 },
    vitaminD: { min: 10 },
    vitaminE: { min: 15 },
    vitaminK: { min: 120 },
    vitaminB1: { min: 1.2 },
    vitaminB2: { min: 1.3 },
    vitaminB3: { min: 16 },
    vitaminB6: { min: 1.3 },
    folate: { min: 400 },
    vitaminB12: { min: 2.4 },
    calcium: { min: 1000 },
    iron: { min: 8 },
    magnesium: { min: 400 },
    phosphorus: { min: 700 },
    zinc: { min: 11 },
    copper: { min: 0.9 },
    manganese: { min: 2.3 },
    selenium: { min: 55 },
  },
};

function toPositiveNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function roundCalories(value) {
  return Math.round(value);
}

function roundToTenth(value) {
  return Math.round(value * 10) / 10;
}

export function estimateCalories({ sex, weightKg, heightCm, ageYears }) {
  const normalizedSex = sex === 'female' ? 'female' : 'male';
  const weight = toPositiveNumber(weightKg, DEFAULT_WEIGHT_KG);
  const height = toPositiveNumber(heightCm, DEFAULT_HEIGHT_CM);
  const age = toPositiveNumber(ageYears, DEFAULT_AGE_YEARS);
  const sexOffset = normalizedSex === 'male' ? 5 : -161;
  const bmr = (10 * weight) + (6.25 * height) - (5 * age) + sexOffset;
  // Fixed "lightly active" multiplier because the app does not collect
  // activity level yet. This is an approximation for optimizer exploration.
  return roundCalories(bmr * 1.4);
}

export function buildRdaPresetConstraints({ sex = 'female', weightKg, heightCm, ageYears, tier = NUTRIENT_TIERS.simple } = {}) {
  const normalizedSex = sex === 'male' ? 'male' : 'female';
  const weight = toPositiveNumber(weightKg, DEFAULT_WEIGHT_KG);
  const rawPreset = {
    ...FIXED_PRESETS[normalizedSex],
    protein: { min: roundToTenth(0.8 * weight) },
    calories: { min: estimateCalories({ sex: normalizedSex, weightKg: weight, heightCm, ageYears }) },
  };

  return Object.fromEntries(
    Object.entries(rawPreset)
      .filter(([key]) => {
        const nutrient = NUTRIENT_BY_KEY[key];
        if (!nutrient) return false;
        if (nutrient.tier === NUTRIENT_TIERS.all) return false;
        return nutrientIsVisibleInTier(nutrient, tier);
      })
      .map(([key, bounds]) => [key, {
        min: bounds.min ?? '',
        max: bounds.max ?? '',
      }]),
  );
}
