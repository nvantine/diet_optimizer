export const NUTRIENT_GROUPS = {
  macros: 'Macronutrients',
  vitamins: 'Vitamins',
  minerals: 'Minerals',
  aminoAcids: 'Amino acid profile',
  fattyAcids: 'Fatty acid profile',
  other: 'Other',
};

// USDA ids below were taken from live FoodData Central detail responses for
// SR Legacy/Foundation sample foods during implementation. Search result rows
// expose these as nutrientId; detail rows expose them as nutrient.id.
export const NUTRIENTS = [
  { key: 'calories', label: 'Energy', unit: 'kcal', group: 'macros', usdaNutrientIds: [1008], defaultMax: 2200 },
  { key: 'protein', label: 'Protein', unit: 'g', group: 'macros', usdaNutrientIds: [1003], defaultMin: 120 },
  { key: 'fat', label: 'Total fat', unit: 'g', group: 'macros', usdaNutrientIds: [1004] },
  { key: 'saturatedFat', label: 'Saturated fat', unit: 'g', group: 'macros', usdaNutrientIds: [1258] },
  { key: 'monounsaturatedFat', label: 'Monounsaturated fat', unit: 'g', group: 'macros', usdaNutrientIds: [1292] },
  { key: 'polyunsaturatedFat', label: 'Polyunsaturated fat', unit: 'g', group: 'macros', usdaNutrientIds: [1293] },
  { key: 'transFat', label: 'Trans fat', unit: 'g', group: 'macros', usdaNutrientIds: [1257] },
  { key: 'cholesterol', label: 'Cholesterol', unit: 'mg', group: 'macros', usdaNutrientIds: [1253] },
  { key: 'carbs', label: 'Carbohydrates', unit: 'g', group: 'macros', usdaNutrientIds: [1005] },
  { key: 'fiber', label: 'Dietary fiber', unit: 'g', group: 'macros', usdaNutrientIds: [1079], defaultMin: 30 },
  { key: 'sugars', label: 'Total sugars', unit: 'g', group: 'macros', usdaNutrientIds: [2000] },
  { key: 'addedSugars', label: 'Added sugars', unit: 'g', group: 'macros', usdaNutrientIds: [] },
  { key: 'sodium', label: 'Sodium', unit: 'mg', group: 'macros', usdaNutrientIds: [1093], defaultMax: 2300 },

  { key: 'vitaminA', label: 'Vitamin A', unit: 'µg RAE', group: 'vitamins', usdaNutrientIds: [1106] },
  { key: 'vitaminC', label: 'Vitamin C', unit: 'mg', group: 'vitamins', usdaNutrientIds: [1162], defaultMin: 90 },
  { key: 'vitaminD', label: 'Vitamin D', unit: 'µg', group: 'vitamins', usdaNutrientIds: [1114], defaultMin: 15 },
  { key: 'vitaminE', label: 'Vitamin E', unit: 'mg', group: 'vitamins', usdaNutrientIds: [1109] },
  { key: 'vitaminK', label: 'Vitamin K', unit: 'µg', group: 'vitamins', usdaNutrientIds: [1185] },
  { key: 'vitaminB1', label: 'Vitamin B1 (thiamin)', unit: 'mg', group: 'vitamins', usdaNutrientIds: [1165] },
  { key: 'vitaminB2', label: 'Vitamin B2 (riboflavin)', unit: 'mg', group: 'vitamins', usdaNutrientIds: [1166] },
  { key: 'vitaminB3', label: 'Vitamin B3 (niacin)', unit: 'mg', group: 'vitamins', usdaNutrientIds: [1167] },
  { key: 'vitaminB6', label: 'Vitamin B6', unit: 'mg', group: 'vitamins', usdaNutrientIds: [1175] },
  { key: 'vitaminB12', label: 'Vitamin B12', unit: 'µg', group: 'vitamins', usdaNutrientIds: [1178] },
  { key: 'folate', label: 'Folate', unit: 'µg DFE', group: 'vitamins', usdaNutrientIds: [1190, 1177] },

  { key: 'calcium', label: 'Calcium', unit: 'mg', group: 'minerals', usdaNutrientIds: [1087], defaultMin: 1000 },
  { key: 'iron', label: 'Iron', unit: 'mg', group: 'minerals', usdaNutrientIds: [1089], defaultMin: 8 },
  { key: 'magnesium', label: 'Magnesium', unit: 'mg', group: 'minerals', usdaNutrientIds: [1090] },
  { key: 'phosphorus', label: 'Phosphorus', unit: 'mg', group: 'minerals', usdaNutrientIds: [1091] },
  { key: 'potassium', label: 'Potassium', unit: 'mg', group: 'minerals', usdaNutrientIds: [1092], defaultMin: 3400 },
  { key: 'zinc', label: 'Zinc', unit: 'mg', group: 'minerals', usdaNutrientIds: [1095] },
  { key: 'copper', label: 'Copper', unit: 'mg', group: 'minerals', usdaNutrientIds: [1098] },
  { key: 'manganese', label: 'Manganese', unit: 'mg', group: 'minerals', usdaNutrientIds: [1101] },
  { key: 'selenium', label: 'Selenium', unit: 'µg', group: 'minerals', usdaNutrientIds: [1103] },

  { key: 'tryptophan', label: 'Tryptophan', unit: 'g', group: 'aminoAcids', usdaNutrientIds: [1210] },
  { key: 'threonine', label: 'Threonine', unit: 'g', group: 'aminoAcids', usdaNutrientIds: [1211] },
  { key: 'isoleucine', label: 'Isoleucine', unit: 'g', group: 'aminoAcids', usdaNutrientIds: [1212] },
  { key: 'leucine', label: 'Leucine', unit: 'g', group: 'aminoAcids', usdaNutrientIds: [1213] },
  { key: 'lysine', label: 'Lysine', unit: 'g', group: 'aminoAcids', usdaNutrientIds: [1214] },
  { key: 'methionine', label: 'Methionine', unit: 'g', group: 'aminoAcids', usdaNutrientIds: [1215] },
  { key: 'cystine', label: 'Cystine', unit: 'g', group: 'aminoAcids', usdaNutrientIds: [1216] },
  { key: 'phenylalanine', label: 'Phenylalanine', unit: 'g', group: 'aminoAcids', usdaNutrientIds: [1217] },
  { key: 'tyrosine', label: 'Tyrosine', unit: 'g', group: 'aminoAcids', usdaNutrientIds: [1218] },
  { key: 'valine', label: 'Valine', unit: 'g', group: 'aminoAcids', usdaNutrientIds: [1219] },
  { key: 'arginine', label: 'Arginine', unit: 'g', group: 'aminoAcids', usdaNutrientIds: [1220] },
  { key: 'histidine', label: 'Histidine', unit: 'g', group: 'aminoAcids', usdaNutrientIds: [1221] },
  { key: 'alanine', label: 'Alanine', unit: 'g', group: 'aminoAcids', usdaNutrientIds: [1222] },
  { key: 'asparticAcid', label: 'Aspartic acid', unit: 'g', group: 'aminoAcids', usdaNutrientIds: [1223] },
  { key: 'glutamicAcid', label: 'Glutamic acid', unit: 'g', group: 'aminoAcids', usdaNutrientIds: [1224] },
  { key: 'glycine', label: 'Glycine', unit: 'g', group: 'aminoAcids', usdaNutrientIds: [1225] },
  { key: 'proline', label: 'Proline', unit: 'g', group: 'aminoAcids', usdaNutrientIds: [1226] },
  { key: 'serine', label: 'Serine', unit: 'g', group: 'aminoAcids', usdaNutrientIds: [1227] },
  { key: 'hydroxyproline', label: 'Hydroxyproline', unit: 'g', group: 'aminoAcids', usdaNutrientIds: [1228] },

  { key: 'sfa4_0', label: 'SFA 4:0', unit: 'g', group: 'fattyAcids', usdaNutrientIds: [1259] },
  { key: 'sfa6_0', label: 'SFA 6:0', unit: 'g', group: 'fattyAcids', usdaNutrientIds: [1260] },
  { key: 'sfa8_0', label: 'SFA 8:0', unit: 'g', group: 'fattyAcids', usdaNutrientIds: [1261] },
  { key: 'sfa10_0', label: 'SFA 10:0', unit: 'g', group: 'fattyAcids', usdaNutrientIds: [1262] },
  { key: 'sfa12_0', label: 'SFA 12:0', unit: 'g', group: 'fattyAcids', usdaNutrientIds: [1263] },
  { key: 'sfa14_0', label: 'SFA 14:0', unit: 'g', group: 'fattyAcids', usdaNutrientIds: [1264] },
  { key: 'sfa15_0', label: 'SFA 15:0', unit: 'g', group: 'fattyAcids', usdaNutrientIds: [1299] },
  { key: 'sfa16_0', label: 'SFA 16:0', unit: 'g', group: 'fattyAcids', usdaNutrientIds: [1265] },
  { key: 'sfa17_0', label: 'SFA 17:0', unit: 'g', group: 'fattyAcids', usdaNutrientIds: [1300] },
  { key: 'sfa18_0', label: 'SFA 18:0', unit: 'g', group: 'fattyAcids', usdaNutrientIds: [1266] },
  { key: 'sfa20_0', label: 'SFA 20:0', unit: 'g', group: 'fattyAcids', usdaNutrientIds: [1267] },
  { key: 'sfa22_0', label: 'SFA 22:0', unit: 'g', group: 'fattyAcids', usdaNutrientIds: [1273] },
  { key: 'sfa24_0', label: 'SFA 24:0', unit: 'g', group: 'fattyAcids', usdaNutrientIds: [1301] },
  { key: 'mufa14_1', label: 'MUFA 14:1', unit: 'g', group: 'fattyAcids', usdaNutrientIds: [1274] },
  { key: 'mufa16_1', label: 'MUFA 16:1', unit: 'g', group: 'fattyAcids', usdaNutrientIds: [1275] },
  { key: 'mufa18_1', label: 'MUFA 18:1', unit: 'g', group: 'fattyAcids', usdaNutrientIds: [1268] },
  { key: 'mufa20_1', label: 'MUFA 20:1', unit: 'g', group: 'fattyAcids', usdaNutrientIds: [1277] },
  { key: 'mufa22_1', label: 'MUFA 22:1', unit: 'g', group: 'fattyAcids', usdaNutrientIds: [1279] },
  { key: 'pufa18_2', label: 'PUFA 18:2', unit: 'g', group: 'fattyAcids', usdaNutrientIds: [1269] },
  { key: 'pufa18_3', label: 'PUFA 18:3', unit: 'g', group: 'fattyAcids', usdaNutrientIds: [1270] },
  { key: 'pufa18_4', label: 'PUFA 18:4', unit: 'g', group: 'fattyAcids', usdaNutrientIds: [1276] },
  { key: 'pufa20_4', label: 'PUFA 20:4', unit: 'g', group: 'fattyAcids', usdaNutrientIds: [1271] },
  { key: 'epa', label: 'EPA 20:5 n-3', unit: 'g', group: 'fattyAcids', usdaNutrientIds: [1278] },
  { key: 'dpa', label: 'DPA 22:5 n-3', unit: 'g', group: 'fattyAcids', usdaNutrientIds: [1280] },
  { key: 'dha', label: 'DHA 22:6 n-3', unit: 'g', group: 'fattyAcids', usdaNutrientIds: [1272] },

  { key: 'water', label: 'Water', unit: 'g', group: 'other', usdaNutrientIds: [1051] },
  { key: 'ash', label: 'Ash', unit: 'g', group: 'other', usdaNutrientIds: [1007] },
];

export const NUTRIENT_BY_KEY = Object.fromEntries(NUTRIENTS.map(nutrient => [nutrient.key, nutrient]));

export const USDA_NUTRIENT_ID_TO_KEY = Object.fromEntries(
  NUTRIENTS.flatMap(nutrient => nutrient.usdaNutrientIds.map(id => [String(id), nutrient.key])),
);

export function mapUsdaNutrients(foodNutrients = []) {
  const nutrients = Object.fromEntries(NUTRIENTS.map(nutrient => [nutrient.key, null]));

  for (const item of foodNutrients) {
    const nutrient = item.nutrient || {};
    const nutrientId = item.nutrientId ?? item.nutrient?.id ?? item.id;
    const key = USDA_NUTRIENT_ID_TO_KEY[String(nutrientId)];
    if (!key) continue;

    const rawValue = item.value ?? item.amount;
    if (rawValue == null) continue;

    const value = Number(rawValue);
    if (Number.isFinite(value)) nutrients[key] = value;
    if (nutrient.unitName && NUTRIENT_BY_KEY[key]) {
      NUTRIENT_BY_KEY[key].observedUsdaUnit = nutrient.unitName;
    }
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
  if (!nutrient || value == null || !Number.isFinite(Number(value))) return 'No data';
  const parsed = Number(value);
  const rounded = Math.abs(parsed) >= 100 ? Math.round(parsed) : Math.round(parsed * 1000) / 1000;
  return `${rounded} ${nutrient.unit}`;
}
