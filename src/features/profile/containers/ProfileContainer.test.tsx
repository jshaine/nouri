import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createTestRepositories } from '@/data/testing';
import type { LocalDate } from '@/domain';
import { ProfileContainer } from './ProfileContainer';

const NOW = () => new Date(2026, 8, 30, 9);

function setup() {
  const { repos } = createTestRepositories();
  render(<ProfileContainer repos={repos} now={NOW} />);
  return repos;
}

async function typeAndLeave(label: string, value: string) {
  const input = screen.getByLabelText(label);
  await userEvent.clear(input);
  await userEvent.type(input, value);
  await userEvent.tab();
}

describe('ProfileContainer', () => {
  it('saves choices at once and typed fields when you leave them', async () => {
    const repos = setup();
    await userEvent.click(await screen.findByRole('radio', { name: 'Female' }));
    fireEvent.change(screen.getByLabelText('Birth date'), { target: { value: '1996-05-01' } });
    fireEvent.blur(screen.getByLabelText('Birth date'));
    await typeAndLeave('Height', '160');
    await typeAndLeave('Goal weight', '58');
    await userEvent.click(screen.getByRole('radio', { name: /Lightly active/ }));
    await waitFor(async () => {
      expect(await repos.profile.get()).toMatchObject({
        sex: 'female',
        birthDate: '1996-05-01',
        heightCm: 160,
        goalWeightKg: 58,
        activity: 'light',
      });
    });
    expect(document.title).toBe('Profile · Nouri');
  });

  it('explains values it cannot use and keeps the last good one', async () => {
    const repos = setup();
    await typeAndLeave(await screen.findByLabelText('Height').then(() => 'Height'), '60');
    expect(screen.getByLabelText('Height')).toHaveAccessibleDescription(/between 100 and 250/);
    expect((await repos.profile.get()).heightCm).toBeUndefined();
  });

  it('takes feet, inches and pounds in imperial, storing metric', async () => {
    const repos = setup();
    await userEvent.click(await screen.findByRole('radio', { name: 'lb, ft/in' }));
    await typeAndLeave(await screen.findByLabelText('Feet').then(() => 'Feet'), '5');
    await typeAndLeave('Inches', '4');
    await typeAndLeave('Goal weight', '130');
    await waitFor(async () => {
      expect(await repos.profile.get()).toMatchObject({
        units: 'imperial',
        heightCm: 162.56, // 5 ft 4 in exactly
        goalWeightKg: 58.97, // 130 lb
      });
    });
  });

  it('offers paces that fit the goal once a weight is logged, and resets one that no longer fits', async () => {
    const { repos } = createTestRepositories();
    await repos.weights.set('2026-09-29' as LocalDate, 65);
    await repos.profile.update({ goalWeightKg: 58, weeklyGoalKg: -0.5 });
    render(<ProfileContainer repos={repos} now={NOW} />);
    const pace = await screen.findByLabelText('Weekly goal');
    expect(pace).toHaveDisplayValue('Lose 0.5 kg per week');
    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual([
      'Lose 1 kg per week',
      'Lose 0.75 kg per week',
      'Lose 0.5 kg per week',
      'Lose 0.25 kg per week',
      'Maintain my weight',
    ]);
    await typeAndLeave('Goal weight', '70');
    await waitFor(async () => {
      expect(await repos.profile.get()).toMatchObject({ goalWeightKg: 70, weeklyGoalKg: 0 });
    });
    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual([
      'Maintain my weight',
      'Gain 0.25 kg per week',
      'Gain 0.5 kg per week',
    ]);
  });

  it('blocks a goal weight below BMI 18.5 and names the lowest allowed', async () => {
    const { repos } = createTestRepositories();
    await repos.profile.update({ heightCm: 160 });
    render(<ProfileContainer repos={repos} now={NOW} />);
    await typeAndLeave(await screen.findByLabelText('Goal weight').then(() => 'Goal weight'), '45');
    expect(screen.getByLabelText('Goal weight')).toHaveAccessibleDescription(
      'The lowest goal weight for your height is 47.4 kg (a BMI of 18.5).',
    );
    expect((await repos.profile.get()).goalWeightKg).toBeUndefined();
    await typeAndLeave('Goal weight', '47.4');
    await waitFor(async () => {
      expect((await repos.profile.get()).goalWeightKg).toBe(47.4);
    });
  });

  it('shows no pace as chosen until one is picked', async () => {
    const { repos } = createTestRepositories();
    await repos.weights.set('2026-09-29' as LocalDate, 65);
    await repos.profile.update({ goalWeightKg: 58 });
    render(<ProfileContainer repos={repos} now={NOW} />);
    const pace = await screen.findByLabelText('Weekly goal');
    expect(pace).toHaveDisplayValue('Choose a weekly goal');
    await userEvent.selectOptions(pace, 'Lose 0.5 kg per week');
    await waitFor(async () => {
      expect((await repos.profile.get()).weeklyGoalKg).toBe(-0.5);
    });
  });

  it('asks for a weight before offering paces', async () => {
    setup();
    expect(await screen.findByLabelText('Weekly goal')).toHaveAccessibleDescription(
      /Log your current weight/,
    );
  });
});

describe('update prompt', () => {
  it('asks to update goals after a new weight, and can be dismissed', async () => {
    const { repos } = createTestRepositories();
    await repos.profile.update({
      sex: 'female',
      birthDate: '1996-05-01' as LocalDate,
      heightCm: 160,
      goalWeightKg: 58,
      activity: 'light',
      weeklyGoalKg: -0.5,
    });
    render(<ProfileContainer repos={repos} now={NOW} />);
    expect(
      await screen.findByText('Add your current weight (log it below) to see suggested goals.'),
    ).toBeInTheDocument();
    await userEvent.type(screen.getByRole('textbox', { name: 'Weight' }), '65');
    await userEvent.click(screen.getByRole('button', { name: 'Log weight' }));
    expect(
      await screen.findByText('New weight logged. Update your goals? Here’s the new suggestion.'),
    ).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: 'Use these goals' })).toBeInTheDocument();
    expect(await repos.goals.all()).toEqual([]); // never applied on its own
    await userEvent.click(screen.getByRole('button', { name: 'Not now' }));
    expect(screen.queryByText(/New weight logged/)).not.toBeInTheDocument();
  });
});
