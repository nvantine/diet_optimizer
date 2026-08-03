import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import ManualFoodForm from './ManualFoodForm';

describe('ManualFoodForm', () => {
  it('adds a manual food with numeric optimizer fields', async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    render(<ManualFoodForm onAdd={onAdd} />);

    await user.type(screen.getByLabelText(/food name/i), 'Greek yogurt');
    await user.clear(screen.getByLabelText(/calories/i));
    await user.type(screen.getByLabelText(/calories/i), '59');
    await user.clear(screen.getByLabelText(/protein/i));
    await user.type(screen.getByLabelText(/protein/i), '10');
    await user.clear(screen.getByLabelText(/cost/i));
    await user.type(screen.getByLabelText(/cost/i), '1.25');
    await user.click(screen.getByRole('button', { name: /add manual food/i }));

    expect(onAdd).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Greek yogurt',
      calories: 59,
      protein: 10,
      cost: 1.25,
      unit: 'per 100g',
    }));
  });
});
