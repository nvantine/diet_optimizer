const CATEGORY_COSTS = {
  protein: 0.75,
  dairy: 0.55,
  grain: 0.35,
  legume: 0.25,
  vegetable: 0.45,
  fruit: 0.35,
  fat: 1.1,
  supplement: 3.8,
  snack: 2.2,
};

const NAME_COST_RULES = [
  [/chicken.*breast/i, 0.92],
  [/salmon/i, 1.75],
  [/egg/i, 0.37],
  [/greek.*yogurt|yogurt.*greek/i, 0.40],
  [/cottage.*cheese/i, 0.75],
  [/oats?|rolled oats/i, 0.30],
  [/brown.*rice|rice.*brown/i, 0.30],
  [/quinoa/i, 1.00],
  [/sweet.*potato/i, 0.22],
  [/whole.?wheat.*bread|bread.*whole.?wheat/i, 0.45],
  [/black.*beans?/i, 0.25],
  [/lentils?/i, 0.25],
  [/spinach/i, 0.90],
  [/broccoli/i, 0.33],
  [/banana/i, 0.13],
  [/apple/i, 0.33],
  [/blueberr/i, 1.50],
  [/avocado/i, 0.60],
  [/almonds?/i, 1.10],
  [/olive.*oil|oil.*olive/i, 1.50],
  [/whey.*protein|protein.*whey/i, 3.80],
  [/granola.*bar|high.?fiber.*bar/i, 2.20],
];

export function estimateCostPer100g(name = '', category = '') {
  const matched = NAME_COST_RULES.find(([pattern]) => pattern.test(name));
  if (matched) return matched[1];
  return CATEGORY_COSTS[category] ?? CATEGORY_COSTS.vegetable;
}
