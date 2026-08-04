export const NUTRIENTS = [
  { key: 'calories', label: 'Calories', unit: 'kcal', usdaNutrientNumbers: [1008], defaultMax: 2200 },
  { key: 'protein', label: 'Protein', unit: 'g', usdaNutrientNumbers: [1003], defaultMin: 120 },
  { key: 'fat', label: 'Fat', unit: 'g', usdaNutrientNumbers: [1004] },
  { key: 'carbs', label: 'Carbohydrate', unit: 'g', usdaNutrientNumbers: [1005] },
  { key: 'fiber', label: 'Fiber', unit: 'g', usdaNutrientNumbers: [1079], defaultMin: 30 },
  { key: 'sugars', label: 'Total sugars', unit: 'g', usdaNutrientNumbers: [2000] },
  { key: 'sodium', label: 'Sodium', unit: 'mg', usdaNutrientNumbers: [1093], defaultMax: 2300 },
  { key: 'calcium', label: 'Calcium', unit: 'mg', usdaNutrientNumbers: [1087], defaultMin: 1000 },
  { key: 'iron', label: 'Iron', unit: 'mg', usdaNutrientNumbers: [1089], defaultMin: 8 },
  { key: 'potassium', label: 'Potassium', unit: 'mg', usdaNutrientNumbers: [1092], defaultMin: 3400 },
  { key: 'vitaminD', label: 'Vitamin D', unit: 'µg', usdaNutrientNumbers: [1114], defaultMin: 15 },
  { key: 'vitaminC', label: 'Vitamin C', unit: 'mg', usdaNutrientNumbers: [1162], defaultMin: 90 },
];

export const NUTRIENT_BY_KEY = Object.fromEntries(NUTRIENTS.map(nutrient => [nutrient.key, nutrient]));

export const USDA_NUTRIENT_NUMBER_TO_KEY = Object.fromEntries(
  NUTRIENTS.flatMap(nutrient => nutrient.usdaNutrientNumbers.map(number => [String(number), nutrient.key])),
);

export function mapUsdaNutrients(foodNutrients = []) {
  const nutrients = Object.fromEntries(NUTRIENTS.map(nutrient => [nutrient.key, 0]));

  for (const item of foodNutrients) {
    const nutrientNumber = item.nutrientNumber ?? item.nutrientId ?? item.number;
    const key = USDA_NUTRIENT_NUMBER_TO_KEY[String(nutrientNumber)];
    if (!key) continue;

    const value = Number(item.value ?? item.amount ?? 0);
    if (Number.isFinite(value)) nutrients[key] = value;
  }

  return nutrients;
}

export function defaultConstraints() {
  return Object.fromEntries(
    NUTRIENTS
      .filter(nutrient => nutrient.defaultMin != null || nutrient.defaultMax != null)
      .map(nutrient => [nutrient.key, {
        min: nutrient.defaultMin ?? '',
        max: nutrient.defaultMax ?? '',
      }]),
  );
}

export function formatNutrientValue(key, value) {
  const nutrient = NUTRIENT_BY_KEY[key];
  if (!nutrient || value == null || !Number.isFinite(Number(value))) return '—';
  const parsed = Number(value);
  const rounded = Math.abs(parsed) >= 100 ? Math.round(parsed) : Math.round(parsed * 10) / 10;
  return `${rounded} ${nutrient.unit}`;
}
