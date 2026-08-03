# Food Optimizer

A dark-mode frontend diet optimizer built with React, Vite, Recharts, and `javascript-lp-solver`.

The app lets you:

- search OpenFoodFacts for foods,
- add foods manually when the external API is down,
- enter your own prices,
- set calorie/protein/sodium constraints,
- solve for the lowest-cost food combination,
- view selected servings and a protein/cost tradeoff curve.

## Model

The optimizer uses linear programming. Each selected food gets a non-negative decision variable representing 100g units. The objective minimizes total cost while satisfying nutrition constraints.

OpenFoodFacts nutrition values are normalized as `per 100g`. Because OpenFoodFacts does not include price data, costs are user-entered as dollars per 100g.

## Development

```bash
npm install
npm run dev
```

## Tests and checks

```bash
npm test
npm run lint
npm run build
```

## GitHub Pages

The Vite `base` is set to `/diet_optimizer/`. The included GitHub Actions workflow builds and deploys `dist/` to GitHub Pages when changes land on `main`.

In GitHub, enable Pages with **Settings → Pages → Source: GitHub Actions** if it is not already enabled.
