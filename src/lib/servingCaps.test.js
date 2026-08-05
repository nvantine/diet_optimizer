import { describe, expect, it } from 'vitest';
import { estimateMaxServing } from './servingCaps';

describe('servingCaps', () => {
  it('uses realistic category caps and specific name overrides', () => {
    expect(estimateMaxServing('Olive oil')).toBe(0.6);
    expect(estimateMaxServing('Almonds')).toBe(0.75);
    expect(estimateMaxServing('Chicken breast')).toBe(2.5);
    expect(estimateMaxServing('Any vegetable', 'Vegetables and Vegetable Products')).toBe(4);
    expect(estimateMaxServing('Mystery food', 'unknown')).toBe(3);
  });
});
