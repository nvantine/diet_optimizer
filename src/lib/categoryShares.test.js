import { describe, expect, it } from 'vitest';
import { defaultSharesForCategories, normalizeShares } from './categoryShares';

describe('categoryShares', () => {
  it('redistributes food-pyramid-style defaults only among present categories', () => {
    const shares = defaultSharesForCategories(['protein', 'grain']);
    expect(Math.round(shares.protein)).toBe(33);
    expect(Math.round(shares.grain)).toBe(67);
    expect(Object.keys(shares)).toEqual(['protein', 'grain']);
  });

  it('normalizes typed shares back to 100 percent', () => {
    expect(normalizeShares({ protein: 55, grain: 45 }, ['protein', 'grain'])).toEqual({ protein: 55, grain: 45 });
    expect(normalizeShares({ protein: 0, grain: 0 }, ['protein', 'grain']).grain).toBeGreaterThan(0);
  });
});
