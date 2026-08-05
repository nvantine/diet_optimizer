import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import GoalsPanel from './GoalsPanel';
import { NUTRIENT_TIERS } from '../lib/nutrientMap';

describe('GoalsPanel nutrient tiers', () => {
  it('shows only simple macro constraints and meal share controls by default', () => {
    render(<GoalsPanel constraints={{}} mealShareLimits={{}} setConstraints={vi.fn()} setMealShareLimits={vi.fn()} />);

    expect(screen.getByRole('radio', { name: /simple/i })).toBeChecked();
    expect(screen.getByLabelText(/Protein minimum/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Sodium maximum/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/Vitamin C minimum/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Vitamin C meal share cap/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Leucine minimum/i)).not.toBeInTheDocument();
    expect(screen.getByLabelText(/Protein meal share cap/i)).toHaveValue(50);
  });

  it('updates per-nutrient meal share caps for visible nutrients only', () => {
    const setMealShareLimits = vi.fn(updater => {
      const next = typeof updater === 'function' ? updater({ protein: 0.5 }) : updater;
      expect(next.protein).toBe(0.42);
    });

    render(<GoalsPanel constraints={{}} mealShareLimits={{ protein: 0.5 }} setConstraints={vi.fn()} setMealShareLimits={setMealShareLimits} />);

    fireEvent.change(screen.getByLabelText(/Protein meal share cap/i), { target: { value: '42' } });

    expect(setMealShareLimits).toHaveBeenCalled();
  });

  it('shows the DRI-style medium set without amino acid and fatty acid detail', () => {
    render(<GoalsPanel constraints={{}} setConstraints={vi.fn()} />);

    fireEvent.click(screen.getByRole('radio', { name: /medium/i }));

    expect(screen.getByLabelText(/Vitamin C minimum/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Pantothenic acid minimum/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Biotin minimum/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Chromium minimum/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Molybdenum minimum/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/Leucine minimum/i)).not.toBeInTheDocument();
  });

  it('shows every mapped nutrient in the all tier', () => {
    render(<GoalsPanel constraints={{}} setConstraints={vi.fn()} />);

    fireEvent.click(screen.getByRole('radio', { name: /^all/i }));

    expect(screen.getByLabelText('Leucine minimum')).toBeInTheDocument();
    expect(screen.getByLabelText('EPA 20:5 n-3 minimum')).toBeInTheDocument();
    expect(screen.getByLabelText('Water minimum')).toBeInTheDocument();
  });

  it('applies approximate biometric presets only to the visible nutrient tier', async () => {
    const user = userEvent.setup();
    const setConstraints = vi.fn(updater => {
      const next = typeof updater === 'function' ? updater({}) : updater;
      expect(next).toEqual(expect.objectContaining({
        calories: expect.objectContaining({ min: expect.closeTo(2370, 0) }),
        protein: { min: 56, max: '' },
        carbs: { min: 130, max: '' },
        fiber: { min: 38, max: '' },
        sodium: { min: '', max: 2300 },
      }));
      expect(next.vitaminC).toBeUndefined();
    });

    render(<GoalsPanel constraints={{}} selectedTier={NUTRIENT_TIERS.simple} setConstraints={setConstraints} setSelectedTier={vi.fn()} />);

    expect(screen.getByText(/not medical guidance/i)).toBeInTheDocument();
    expect(screen.getByText(/assumes light activity/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('25')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('170')).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText(/sex/i), 'male');
    await user.clear(screen.getByLabelText(/weight/i));
    await user.type(screen.getByLabelText(/weight/i), '70');
    await user.clear(screen.getByLabelText(/height/i));
    await user.type(screen.getByLabelText(/height/i), '178');
    await user.clear(screen.getByLabelText(/age/i));
    await user.type(screen.getByLabelText(/age/i), '25');
    await user.click(screen.getByRole('button', { name: /apply preset/i }));

    expect(setConstraints).toHaveBeenCalledTimes(1);
  });

  it('includes medium fixed-value nutrients when applying presets in the medium tier', async () => {
    const user = userEvent.setup();
    const setConstraints = vi.fn(updater => {
      const next = typeof updater === 'function' ? updater({}) : updater;
      expect(next.vitaminC).toEqual({ min: 75, max: '' });
      expect(next.iron).toEqual({ min: 18, max: '' });
      expect(next.leucine).toBeUndefined();
    });

    render(<GoalsPanel constraints={{}} selectedTier={NUTRIENT_TIERS.medium} setConstraints={setConstraints} setSelectedTier={vi.fn()} />);

    await user.selectOptions(screen.getByLabelText(/sex/i), 'female');
    await user.clear(screen.getByLabelText(/weight/i));
    await user.type(screen.getByLabelText(/weight/i), '57');
    await user.click(screen.getByRole('button', { name: /apply preset/i }));

    expect(setConstraints).toHaveBeenCalledTimes(1);
  });
});
