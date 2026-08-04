import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import ManualFoodForm from './ManualFoodForm';

describe('ManualFoodForm', () => {
  it('adds spacing above the manual submit button', () => {
    render(<ManualFoodForm onAdd={vi.fn()} />);

    expect(screen.getByRole('button', { name: /add manual food/i })).toHaveClass('manual-submit-button');
  });

  it('adds a manual food with a nutrient vector, unused cost, and min/max serving bounds', async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    render(<ManualFoodForm onAdd={onAdd} />);

    await user.type(screen.getByLabelText(/food name/i), 'Greek yogurt');
    await user.clear(screen.getByLabelText(/energy/i));
    await user.type(screen.getByLabelText(/energy/i), '59');
    await user.clear(screen.getByLabelText(/protein/i));
    await user.type(screen.getByLabelText(/protein/i), '10');
    await user.clear(screen.getByLabelText(/minimum 100g units/i));
    await user.type(screen.getByLabelText(/minimum 100g units/i), '1');
    await user.clear(screen.getByLabelText(/maximum 100g units/i));
    await user.type(screen.getByLabelText(/maximum 100g units/i), '4');
    await user.click(screen.getByRole('button', { name: /add manual food/i }));

    expect(onAdd).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Greek yogurt',
      dataType: 'Manual',
      unit: 'per 100g',
      cost: 0,
      servingBounds: { min: 1, max: 4 },
      nutrients: expect.objectContaining({ calories: 59, protein: 10 }),
    }));
  });
});
