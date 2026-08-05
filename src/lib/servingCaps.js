import { normalizeFoodCategory } from './foodCategory';

export const CATEGORY_MAX_SERVINGS = {
  protein: 2.5,
  dairy: 3.0,
  grain: 2.0,
  legume: 2.5,
  vegetable: 4.0,
  fruit: 3.0,
  fat: 0.6,
  nuts: 0.75,
  supplement: 0.75,
  snack: 1.5,
  other: 3.0,
};

export const NAME_SERVING_RULES = [
  [/chicken.*breast/i, 2.5],
  [/salmon|tuna|fish/i, 2.0],
  [/egg/i, 3.0],
  [/greek.*yogurt|yogurt.*greek|cottage.*cheese/i, 3.0],
  [/oats?|rolled oats/i, 2.0],
  [/brown.*rice|rice.*brown|quinoa|pasta|bread|flour/i, 2.0],
  [/sweet.*potato|potato/i, 3.0],
  [/black.*beans?|lentils?|chickpea/i, 2.5],
  [/spinach|broccoli|tomato|lettuce|greens?|vegetable/i, 4.0],
  [/banana|apple|blueberr|strawberr|fruit/i, 3.0],
  [/avocado/i, 1.5],
  [/almonds?|walnuts?|peanuts?|cashews?|seeds?/i, 0.75],
  [/olive.*oil|oil.*olive|oil|butter/i, 0.6],
  [/whey.*protein|protein.*whey|protein powder|supplement/i, 0.75],
  [/granola.*bar|high.?fiber.*bar|snack|chips?|cookie/i, 1.5],
];

export function estimateMaxServing(name = '', category = '') {
  const matched = NAME_SERVING_RULES.find(([pattern]) => pattern.test(name));
  if (matched) return matched[1];
  const bucket = normalizeFoodCategory(category, name);
  return CATEGORY_MAX_SERVINGS[bucket] ?? CATEGORY_MAX_SERVINGS.other;
}
