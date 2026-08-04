# Future USDA FoodData Central ideas

Saved for later implementation. These are intentionally not all implemented now because the current learning goal is convex optimization clarity.

## Data quality and search

- Prefer Foundation foods by default, with optional SR Legacy fallback for broader coverage.
- Add source/data-quality labels so users understand Foundation vs SR Legacy vs Branded vs Survey/FNDDS.
- Add food category filters to reduce noisy search results.
- Add missing-data warnings and a data-completeness score for selected foods.
- Fetch full `GET /fdc/v1/food/{fdcId}` details after a user selects a search result, rather than relying only on search-row nutrient snippets.
- Cache selected food details locally to reduce API calls and make revisiting selections faster.

## Nutrient modeling

- Preserve original USDA nutrient metadata alongside normalized fields: USDA id, name, unit, and amount.
- Let users add custom constraints from nutrients discovered in selected foods instead of exposing every mapped nutrient all the time.
- Use DRI-style goal templates later, but avoid profile complexity until the solver and convex-optimization teaching flow are clearer.

## Serving-size ideas deferred

USDA detail responses can include `foodPortions`, such as a medium banana gram weight. Nutrient values for Foundation/SR Legacy remain per 100g, so this should only be a display transform if implemented later.

Deferred possible UI:

- 100g units
- grams
- common household serving, using `foodPortions` if available

Conversion would be display-only:

```text
servings_in_100g_units * 100 / gramWeight = household serving count
```

Do not change solver internals for this unless there is a separate, explicit design pass.

## Discrete-serving limitation

Some foods are naturally discrete, such as eggs. The current continuous 100g-unit solver can recommend awkward amounts like `0.37 eggs`. Revisit later with an optional MILP/integer-serving mode if useful, but do not add it while the app is focused on the convex LP learning path.
