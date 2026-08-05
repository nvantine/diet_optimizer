export const FOOD_CATEGORIES = [
  'protein',
  'dairy',
  'grain',
  'legume',
  'vegetable',
  'fruit',
  'fat',
  'nuts',
  'supplement',
  'snack',
  'other',
];

export const FOOD_CATEGORY_LABELS = {
  protein: 'Protein',
  dairy: 'Dairy',
  grain: 'Grain',
  legume: 'Legume',
  vegetable: 'Vegetable',
  fruit: 'Fruit',
  fat: 'Fat / oil',
  nuts: 'Nuts / seeds',
  supplement: 'Supplement',
  snack: 'Snack',
  other: 'Other',
};

const CATEGORY_RULES = [
  [/poultry|beef|pork|lamb|veal|game|finfish|shellfish|fish|seafood|sausages?|luncheon|meat/i, 'protein'],
  [/dairy|egg|milk|cheese|yogurt/i, 'dairy'],
  [/cereal|grain|pasta|rice|baked|bread|flour|bakery/i, 'grain'],
  [/legume|bean|lentil|pea\b|soy/i, 'legume'],
  [/vegetable|mushroom|greens?|broccoli|spinach|tomato/i, 'vegetable'],
  [/fruit|juice|berries|banana|apple|citrus/i, 'fruit'],
  [/fats? and oils?|oil|butter|margarine|shortening/i, 'fat'],
  [/nut|seed/i, 'nuts'],
  [/supplement|protein powder|whey/i, 'supplement'],
  [/snack|sweets?|dessert|candy|beverage|restaurant|fast food|meal replacement/i, 'snack'],
];

const NAME_RULES = [
  [/chicken|salmon|tuna|fish|beef|pork|turkey|shrimp/i, 'protein'],
  [/egg|milk|cheese|yogurt|dairy/i, 'dairy'],
  [/oats?|rice|quinoa|bread|flour|pasta|cereal/i, 'grain'],
  [/beans?|lentils?|chickpea|tofu|soy/i, 'legume'],
  [/spinach|broccoli|tomato|carrot|potato|kale|lettuce|pepper/i, 'vegetable'],
  [/banana|apple|blueberr|strawberr|orange|fruit/i, 'fruit'],
  [/olive.*oil|oil|butter|avocado/i, 'fat'],
  [/almonds?|walnuts?|peanuts?|cashews?|seeds?/i, 'nuts'],
  [/whey|protein powder|supplement/i, 'supplement'],
  [/bar|cookie|candy|chips?|snack/i, 'snack'],
];

// USDA detail endpoint probing on 2026-08-05 hit DEMO_KEY rate limiting (429)
// for multiple Foundation IDs. Existing list/search responses in this app expose
// either `foodCategory`, `foodCategoryDescription`, or a nested category object;
// parser accepts all observed/likely shapes rather than assuming one endpoint.
export function normalizeFoodCategory(rawCategory, name = '') {
  if (FOOD_CATEGORIES.includes(rawCategory)) return rawCategory;
  const description = categoryDescription(rawCategory);
  const categoryMatch = CATEGORY_RULES.find(([pattern]) => pattern.test(description));
  if (categoryMatch) return categoryMatch[1];
  const nameMatch = NAME_RULES.find(([pattern]) => pattern.test(name));
  if (nameMatch) return nameMatch[1];
  return 'other';
}

export function categoryDescription(rawCategory) {
  if (!rawCategory) return '';
  if (typeof rawCategory === 'string') return rawCategory;
  if (typeof rawCategory === 'object') return rawCategory.description || rawCategory.name || rawCategory.foodCategoryDescription || '';
  return String(rawCategory);
}
