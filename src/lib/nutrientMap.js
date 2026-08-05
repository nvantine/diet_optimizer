export const NUTRIENT_GROUPS = {
  macros: 'Macronutrients',
  vitamins: 'Vitamins',
  minerals: 'Minerals',
  aminoAcids: 'Amino acid profile',
  fattyAcids: 'Fatty acid profile',
  other: 'Other',
};

export const NUTRIENT_TIERS = {
  simple: 'simple',
  medium: 'medium',
  all: 'all',
};

export const NUTRIENT_TIER_ORDER = [NUTRIENT_TIERS.simple, NUTRIENT_TIERS.medium, NUTRIENT_TIERS.all];

export function nutrientIsVisibleInTier(nutrient, selectedTier) {
  return NUTRIENT_TIER_ORDER.indexOf(nutrient.tier) <= NUTRIENT_TIER_ORDER.indexOf(selectedTier);
}

// USDA ids below were taken from live FoodData Central detail responses for
// SR Legacy/Foundation sample foods during implementation. Search result rows
// expose these as nutrientId; detail rows expose them as nutrient.id.
// Additional DRI-table nutrients added later were confirmed from live detail
// responses before mapping: pantothenic acid 1170, biotin 1176, chromium 1096,
// fluoride 1099, iodine 1100, and molybdenum 1102.
export const NUTRIENTS = [
  { key: 'calories', label: 'Energy', unit: 'kcal', group: 'macros', tier: 'simple', usdaNutrientIds: [1008, 2047, 2048], defaultMax: 2200 },
  { key: 'protein', label: 'Protein', unit: 'g', group: 'macros', tier: 'simple', usdaNutrientIds: [1003], defaultMin: 120 },
  { key: 'fat', label: 'Total fat', unit: 'g', group: 'macros', tier: 'simple', usdaNutrientIds: [1004] },
  { key: 'saturatedFat', label: 'Saturated fat', unit: 'g', group: 'macros', tier: 'medium', usdaNutrientIds: [1258], defaultMax: 20 },
  { key: 'monounsaturatedFat', label: 'Monounsaturated fat', unit: 'g', group: 'macros', tier: 'all', usdaNutrientIds: [1292] },
  { key: 'polyunsaturatedFat', label: 'Polyunsaturated fat', unit: 'g', group: 'macros', tier: 'all', usdaNutrientIds: [1293] },
  { key: 'transFat', label: 'Trans fat', unit: 'g', group: 'macros', tier: 'all', usdaNutrientIds: [1257] },
  { key: 'cholesterol', label: 'Cholesterol', unit: 'mg', group: 'macros', tier: 'medium', usdaNutrientIds: [1253] },
  { key: 'carbs', label: 'Carbohydrates', unit: 'g', group: 'macros', tier: 'simple', usdaNutrientIds: [1005] },
  { key: 'fiber', label: 'Dietary fiber', unit: 'g', group: 'macros', tier: 'simple', usdaNutrientIds: [1079], defaultMin: 30 },
  { key: 'sugars', label: 'Total sugars', unit: 'g', group: 'macros', tier: 'medium', usdaNutrientIds: [2000] },
  { key: 'addedSugars', label: 'Added sugars', unit: 'g', group: 'macros', tier: 'all', usdaNutrientIds: [] },
  { key: 'sodium', label: 'Sodium', unit: 'mg', group: 'macros', tier: 'simple', usdaNutrientIds: [1093], defaultMax: 2300 },

  { key: 'vitaminA', label: 'Vitamin A', unit: 'µg RAE', group: 'vitamins', tier: 'medium', usdaNutrientIds: [1106], defaultMin: 900 },
  { key: 'vitaminC', label: 'Vitamin C', unit: 'mg', group: 'vitamins', tier: 'medium', usdaNutrientIds: [1162], defaultMin: 90 },
  { key: 'vitaminD', label: 'Vitamin D', unit: 'µg', group: 'vitamins', tier: 'medium', usdaNutrientIds: [1114], defaultMin: 15 },
  { key: 'vitaminE', label: 'Vitamin E', unit: 'mg', group: 'vitamins', tier: 'medium', usdaNutrientIds: [1109], defaultMin: 15 },
  { key: 'vitaminK', label: 'Vitamin K', unit: 'µg', group: 'vitamins', tier: 'medium', usdaNutrientIds: [1185], defaultMin: 120 },
  { key: 'vitaminB1', label: 'Vitamin B1 (thiamin)', unit: 'mg', group: 'vitamins', tier: 'medium', usdaNutrientIds: [1165], defaultMin: 1.2 },
  { key: 'vitaminB2', label: 'Vitamin B2 (riboflavin)', unit: 'mg', group: 'vitamins', tier: 'medium', usdaNutrientIds: [1166], defaultMin: 1.3 },
  { key: 'vitaminB3', label: 'Vitamin B3 (niacin)', unit: 'mg', group: 'vitamins', tier: 'medium', usdaNutrientIds: [1167], defaultMin: 16 },
  { key: 'vitaminB6', label: 'Vitamin B6', unit: 'mg', group: 'vitamins', tier: 'medium', usdaNutrientIds: [1175], defaultMin: 1.7 },
  { key: 'vitaminB12', label: 'Vitamin B12', unit: 'µg', group: 'vitamins', tier: 'medium', usdaNutrientIds: [1178], defaultMin: 2.4 },
  { key: 'folate', label: 'Folate', unit: 'µg DFE', group: 'vitamins', tier: 'medium', usdaNutrientIds: [1190, 1177], defaultMin: 400 },
  { key: 'pantothenicAcid', label: 'Pantothenic acid', unit: 'mg', group: 'vitamins', tier: 'medium', usdaNutrientIds: [1170], defaultMin: 5 },
  { key: 'biotin', label: 'Biotin', unit: 'µg', group: 'vitamins', tier: 'medium', usdaNutrientIds: [1176], defaultMin: 30 },

  { key: 'calcium', label: 'Calcium', unit: 'mg', group: 'minerals', tier: 'medium', usdaNutrientIds: [1087], defaultMin: 1000 },
  { key: 'iron', label: 'Iron', unit: 'mg', group: 'minerals', tier: 'medium', usdaNutrientIds: [1089], defaultMin: 18 },
  { key: 'magnesium', label: 'Magnesium', unit: 'mg', group: 'minerals', tier: 'medium', usdaNutrientIds: [1090], defaultMin: 420 },
  { key: 'phosphorus', label: 'Phosphorus', unit: 'mg', group: 'minerals', tier: 'medium', usdaNutrientIds: [1091], defaultMin: 700 },
  { key: 'potassium', label: 'Potassium', unit: 'mg', group: 'minerals', tier: 'medium', usdaNutrientIds: [1092], defaultMin: 3400 },
  { key: 'zinc', label: 'Zinc', unit: 'mg', group: 'minerals', tier: 'medium', usdaNutrientIds: [1095], defaultMin: 11 },
  { key: 'copper', label: 'Copper', unit: 'mg', group: 'minerals', tier: 'medium', usdaNutrientIds: [1098], defaultMin: 0.9 },
  { key: 'manganese', label: 'Manganese', unit: 'mg', group: 'minerals', tier: 'medium', usdaNutrientIds: [1101], defaultMin: 2.3 },
  { key: 'selenium', label: 'Selenium', unit: 'µg', group: 'minerals', tier: 'medium', usdaNutrientIds: [1103], defaultMin: 55 },
  { key: 'chromium', label: 'Chromium', unit: 'µg', group: 'minerals', tier: 'medium', usdaNutrientIds: [1096], defaultMin: 35 },
  { key: 'fluoride', label: 'Fluoride', unit: 'µg', group: 'minerals', tier: 'medium', usdaNutrientIds: [1099], defaultMin: 4000, defaultMax: 10000 },
  { key: 'iodine', label: 'Iodine', unit: 'µg', group: 'minerals', tier: 'medium', usdaNutrientIds: [1100], defaultMin: 150 },
  { key: 'molybdenum', label: 'Molybdenum', unit: 'µg', group: 'minerals', tier: 'medium', usdaNutrientIds: [1102], defaultMin: 45 },

  { key: 'tryptophan', label: 'Tryptophan', unit: 'g', group: 'aminoAcids', tier: 'all', usdaNutrientIds: [1210] },
  { key: 'threonine', label: 'Threonine', unit: 'g', group: 'aminoAcids', tier: 'all', usdaNutrientIds: [1211] },
  { key: 'isoleucine', label: 'Isoleucine', unit: 'g', group: 'aminoAcids', tier: 'all', usdaNutrientIds: [1212] },
  { key: 'leucine', label: 'Leucine', unit: 'g', group: 'aminoAcids', tier: 'all', usdaNutrientIds: [1213] },
  { key: 'lysine', label: 'Lysine', unit: 'g', group: 'aminoAcids', tier: 'all', usdaNutrientIds: [1214] },
  { key: 'methionine', label: 'Methionine', unit: 'g', group: 'aminoAcids', tier: 'all', usdaNutrientIds: [1215] },
  { key: 'cystine', label: 'Cystine', unit: 'g', group: 'aminoAcids', tier: 'all', usdaNutrientIds: [1216] },
  { key: 'phenylalanine', label: 'Phenylalanine', unit: 'g', group: 'aminoAcids', tier: 'all', usdaNutrientIds: [1217] },
  { key: 'tyrosine', label: 'Tyrosine', unit: 'g', group: 'aminoAcids', tier: 'all', usdaNutrientIds: [1218] },
  { key: 'valine', label: 'Valine', unit: 'g', group: 'aminoAcids', tier: 'all', usdaNutrientIds: [1219] },
  { key: 'arginine', label: 'Arginine', unit: 'g', group: 'aminoAcids', tier: 'all', usdaNutrientIds: [1220] },
  { key: 'histidine', label: 'Histidine', unit: 'g', group: 'aminoAcids', tier: 'all', usdaNutrientIds: [1221] },
  { key: 'alanine', label: 'Alanine', unit: 'g', group: 'aminoAcids', tier: 'all', usdaNutrientIds: [1222] },
  { key: 'asparticAcid', label: 'Aspartic acid', unit: 'g', group: 'aminoAcids', tier: 'all', usdaNutrientIds: [1223] },
  { key: 'glutamicAcid', label: 'Glutamic acid', unit: 'g', group: 'aminoAcids', tier: 'all', usdaNutrientIds: [1224] },
  { key: 'glycine', label: 'Glycine', unit: 'g', group: 'aminoAcids', tier: 'all', usdaNutrientIds: [1225] },
  { key: 'proline', label: 'Proline', unit: 'g', group: 'aminoAcids', tier: 'all', usdaNutrientIds: [1226] },
  { key: 'serine', label: 'Serine', unit: 'g', group: 'aminoAcids', tier: 'all', usdaNutrientIds: [1227] },
  { key: 'hydroxyproline', label: 'Hydroxyproline', unit: 'g', group: 'aminoAcids', tier: 'all', usdaNutrientIds: [1228] },

  { key: 'sfa4_0', label: 'SFA 4:0', unit: 'g', group: 'fattyAcids', tier: 'all', usdaNutrientIds: [1259] },
  { key: 'sfa6_0', label: 'SFA 6:0', unit: 'g', group: 'fattyAcids', tier: 'all', usdaNutrientIds: [1260] },
  { key: 'sfa8_0', label: 'SFA 8:0', unit: 'g', group: 'fattyAcids', tier: 'all', usdaNutrientIds: [1261] },
  { key: 'sfa10_0', label: 'SFA 10:0', unit: 'g', group: 'fattyAcids', tier: 'all', usdaNutrientIds: [1262] },
  { key: 'sfa12_0', label: 'SFA 12:0', unit: 'g', group: 'fattyAcids', tier: 'all', usdaNutrientIds: [1263] },
  { key: 'sfa14_0', label: 'SFA 14:0', unit: 'g', group: 'fattyAcids', tier: 'all', usdaNutrientIds: [1264] },
  { key: 'sfa15_0', label: 'SFA 15:0', unit: 'g', group: 'fattyAcids', tier: 'all', usdaNutrientIds: [1299] },
  { key: 'sfa16_0', label: 'SFA 16:0', unit: 'g', group: 'fattyAcids', tier: 'all', usdaNutrientIds: [1265] },
  { key: 'sfa17_0', label: 'SFA 17:0', unit: 'g', group: 'fattyAcids', tier: 'all', usdaNutrientIds: [1300] },
  { key: 'sfa18_0', label: 'SFA 18:0', unit: 'g', group: 'fattyAcids', tier: 'all', usdaNutrientIds: [1266] },
  { key: 'sfa20_0', label: 'SFA 20:0', unit: 'g', group: 'fattyAcids', tier: 'all', usdaNutrientIds: [1267] },
  { key: 'sfa22_0', label: 'SFA 22:0', unit: 'g', group: 'fattyAcids', tier: 'all', usdaNutrientIds: [1273] },
  { key: 'sfa24_0', label: 'SFA 24:0', unit: 'g', group: 'fattyAcids', tier: 'all', usdaNutrientIds: [1301] },
  { key: 'mufa14_1', label: 'MUFA 14:1', unit: 'g', group: 'fattyAcids', tier: 'all', usdaNutrientIds: [1274] },
  { key: 'mufa16_1', label: 'MUFA 16:1', unit: 'g', group: 'fattyAcids', tier: 'all', usdaNutrientIds: [1275] },
  { key: 'mufa18_1', label: 'MUFA 18:1', unit: 'g', group: 'fattyAcids', tier: 'all', usdaNutrientIds: [1268] },
  { key: 'mufa20_1', label: 'MUFA 20:1', unit: 'g', group: 'fattyAcids', tier: 'all', usdaNutrientIds: [1277] },
  { key: 'mufa22_1', label: 'MUFA 22:1', unit: 'g', group: 'fattyAcids', tier: 'all', usdaNutrientIds: [1279] },
  { key: 'pufa18_2', label: 'PUFA 18:2', unit: 'g', group: 'fattyAcids', tier: 'all', usdaNutrientIds: [1269] },
  { key: 'pufa18_3', label: 'PUFA 18:3', unit: 'g', group: 'fattyAcids', tier: 'all', usdaNutrientIds: [1270] },
  { key: 'pufa18_4', label: 'PUFA 18:4', unit: 'g', group: 'fattyAcids', tier: 'all', usdaNutrientIds: [1276] },
  { key: 'pufa20_4', label: 'PUFA 20:4', unit: 'g', group: 'fattyAcids', tier: 'all', usdaNutrientIds: [1271] },
  { key: 'epa', label: 'EPA 20:5 n-3', unit: 'g', group: 'fattyAcids', tier: 'all', usdaNutrientIds: [1278] },
  { key: 'dpa', label: 'DPA 22:5 n-3', unit: 'g', group: 'fattyAcids', tier: 'all', usdaNutrientIds: [1280] },
  { key: 'dha', label: 'DHA 22:6 n-3', unit: 'g', group: 'fattyAcids', tier: 'all', usdaNutrientIds: [1272] },

  { key: 'water', label: 'Water', unit: 'g', group: 'other', tier: 'all', usdaNutrientIds: [1051] },
  { key: 'ash', label: 'Ash', unit: 'g', group: 'other', tier: 'all', usdaNutrientIds: [1007] },
];

export const NUTRIENT_BY_KEY = Object.fromEntries(NUTRIENTS.map(nutrient => [nutrient.key, nutrient]));

export const USDA_NUTRIENT_ID_TO_KEY = Object.fromEntries(
  NUTRIENTS.flatMap(nutrient => nutrient.usdaNutrientIds.map(id => [String(id), nutrient.key])),
);

export const USDA_NUTRIENT_NUMBER_TO_KEY = {
  203: 'protein',
  204: 'fat',
  205: 'carbs',
  207: 'ash',
  208: 'calories',
  255: 'water',
  269: 'sugars',
  291: 'fiber',
  301: 'calcium',
  303: 'iron',
  304: 'magnesium',
  305: 'phosphorus',
  306: 'potassium',
  307: 'sodium',
  309: 'zinc',
  312: 'copper',
  315: 'manganese',
  317: 'selenium',
  318: 'vitaminA',
  323: 'vitaminE',
  328: 'vitaminD',
  401: 'vitaminC',
  404: 'vitaminB1',
  405: 'vitaminB2',
  406: 'vitaminB3',
  415: 'vitaminB6',
  417: 'folate',
  418: 'vitaminB12',
  430: 'vitaminK',
  601: 'cholesterol',
  605: 'transFat',
  606: 'saturatedFat',
  618: 'pufa18_2',
  619: 'pufa18_3',
  621: 'dha',
  629: 'epa',
  631: 'dpa',
  645: 'monounsaturatedFat',
  646: 'polyunsaturatedFat',
};

export function mapUsdaNutrients(foodNutrients = []) {
  const nutrients = Object.fromEntries(NUTRIENTS.map(nutrient => [nutrient.key, null]));

  for (const item of foodNutrients) {
    const nutrient = item.nutrient || {};
    const nutrientId = item.nutrientId ?? item.nutrient?.id ?? item.id;
    const nutrientNumber = item.number ?? nutrient.number;
    const key = USDA_NUTRIENT_ID_TO_KEY[String(nutrientId)] || USDA_NUTRIENT_NUMBER_TO_KEY[String(nutrientNumber)];
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

export function defaultConstraints(selectedTier = NUTRIENT_TIERS.simple) {
  return Object.fromEntries(
    NUTRIENTS
      .filter(nutrient => nutrientIsVisibleInTier(nutrient, selectedTier))
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
  return `${nutrient.label}: ${rounded} ${nutrient.unit}`;
}
