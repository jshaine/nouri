import { render, screen, within } from '@testing-library/react';
import { NutritionLabel } from './NutritionLabel';

const totals = { kcal: 1240, p: 82, c: 151, f: 68 };
const goal = { kcal: 1850, p: 120, c: 230, f: 62 };

describe('NutritionLabel', () => {
  it('shows calories against the goal with what is left', () => {
    render(<NutritionLabel totals={totals} goal={goal} />);
    const label = screen.getByRole('region', { name: 'Daily Facts' });
    expect(label).toHaveTextContent('Calories1,240');
    expect(label).toHaveTextContent('Goal 1,850');
    expect(label).toHaveTextContent('610 left');
  });

  it('lists each macro with grams, goal and percent', () => {
    render(<NutritionLabel totals={totals} goal={goal} />);
    const rows = within(screen.getByRole('region', { name: 'Daily Facts' })).getAllByRole(
      'listitem',
    );
    expect(rows[0]).toHaveTextContent('Protein 82 g / 120 g68%');
    expect(rows[1]).toHaveTextContent('Carbs 151 g / 230 g66%');
  });

  it('states going over plainly, without alarm', () => {
    render(<NutritionLabel totals={{ ...totals, kcal: 2000 }} goal={goal} />);
    const label = screen.getByRole('region', { name: 'Daily Facts' });
    expect(label).toHaveTextContent('150 over');
    expect(label).toHaveTextContent('6 g over'); // fat 68 of 62
    expect(label).toHaveTextContent('110%');
    expect(label.textContent).not.toMatch(/exceed|too much|warning/i);
  });

  it('works without a goal and offers the action', () => {
    render(
      <NutritionLabel
        totals={totals}
        goal={undefined}
        noGoalAction={<a href="/settings">Set goals</a>}
      />,
    );
    expect(screen.getByText('No goal set yet')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Set goals' })).toBeInTheDocument();
    expect(screen.queryByText('% goal')).not.toBeInTheDocument();
    expect(screen.getAllByRole('listitem')[0]).toHaveTextContent('Protein 82 g');
  });

  it('shows the calorie split in text', () => {
    render(<NutritionLabel totals={{ kcal: 2000, p: 100, c: 250, f: 66.7 }} goal={goal} />);
    expect(screen.getByText('Calorie split').parentElement).toHaveTextContent('P 20%C 50%F 30%');
  });

  it('has an empty split before anything is logged', () => {
    const { container } = render(
      <NutritionLabel totals={{ kcal: 0, p: 0, c: 0, f: 0 }} goal={goal} />,
    );
    expect(container).toHaveTextContent('P 0%C 0%F 0%');
    expect(container).toHaveTextContent('1,850 left');
  });
});
