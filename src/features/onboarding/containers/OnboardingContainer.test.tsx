import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { createTestRepositories, firstValue } from '@/data/testing';
import { goalForDate, type LocalDate } from '@/domain';
import { OnboardingContainer } from './OnboardingContainer';

const NOW = () => new Date(2026, 8, 30, 9);
const TODAY = '2026-09-30' as LocalDate;

function setup() {
  const { repos } = createTestRepositories();
  const router = createMemoryRouter(
    [
      { path: '/welcome', element: <OnboardingContainer repos={repos} now={NOW} /> },
      { path: '/', element: <p>Today screen</p> },
      { path: '/settings', element: <p>Settings screen</p> },
    ],
    { initialEntries: ['/welcome'] },
  );
  render(<RouterProvider router={router} />);
  return { repos, router };
}

const next = (name = 'Next') => userEvent.click(screen.getByRole('button', { name }));

/** Welcome → About you (female, 30, 160 cm, 65 kg) → Lightly active → goal step. */
async function throughActivity() {
  await userEvent.click(await screen.findByRole('button', { name: 'Get started' }));
  expect(await screen.findByRole('heading', { name: 'About you' })).toBeInTheDocument();
  expect(screen.getByText('Step 2 of 5')).toBeInTheDocument();
  await userEvent.click(screen.getByRole('radio', { name: 'Female' }));
  await userEvent.type(screen.getByLabelText('Age'), '30');
  await userEvent.type(screen.getByLabelText('Height'), '160');
  await userEvent.type(screen.getByLabelText('Current weight'), '65');
  await next();
  expect(await screen.findByRole('heading', { name: 'How active are you?' })).toBeInTheDocument();
  await userEvent.click(screen.getByRole('radio', { name: /Lightly active/ }));
  await next();
  expect(await screen.findByRole('heading', { name: 'Your goal' })).toBeInTheDocument();
}

describe('OnboardingContainer', () => {
  it('asks about you, activity and goal, then shows the plan and starts on Today', async () => {
    const { repos, router } = setup();
    await throughActivity();
    expect(screen.getByText('You weigh 65 kg now.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('radio', { name: /Lose weight/ }));
    expect(screen.getByRole('radio', { name: /Lose 0.5 kg per week/ })).toBeChecked();
    await userEvent.type(screen.getByLabelText('Goal weight'), '58');
    await next('See my plan');

    expect(await screen.findByRole('heading', { name: 'Your plan' })).toBeInTheDocument();
    expect(screen.getByText('Daily goal')).toBeInTheDocument();
    // The plan's own button is the only way forward (no empty Next).
    expect(screen.queryByRole('button', { name: 'Next' })).not.toBeInTheDocument();
    expect(screen.getAllByRole('button').every((b) => b.textContent.trim() !== '')).toBe(true);
    expect(await repos.profile.get()).toMatchObject({
      sex: 'female',
      birthDate: '1996-09-30',
      heightCm: 160,
      activity: 'light',
      goalWeightKg: 58,
      weeklyGoalKg: -0.5,
    });
    expect((await firstValue(repos.weights.live()))[0]).toMatchObject({ date: TODAY, kg: 65 });
    await next('Use this plan and start');
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/');
    });
    expect(goalForDate(await repos.goals.all(), TODAY)?.kcal).toBe(1290); // 1841 − 550
    expect((await repos.settings.get()).onboardingDone).toBe(true);
  });

  it('maintains at the current weight without asking for a goal weight', async () => {
    const { repos } = setup();
    await throughActivity();
    await userEvent.click(screen.getByRole('radio', { name: /Maintain my weight/ }));
    expect(screen.queryByLabelText('Goal weight')).not.toBeInTheDocument();
    await next('See my plan');
    await screen.findByRole('heading', { name: 'Your plan' });
    expect(await repos.profile.get()).toMatchObject({ goalWeightKg: 65, weeklyGoalKg: 0 });
    await next('Use this plan and start');
    await waitFor(async () => {
      expect(goalForDate(await repos.goals.all(), TODAY)?.kcal).toBe(1840);
    });
  });

  it('explains what is missing or doesn’t fit, and stays on the step', async () => {
    setup();
    await userEvent.click(await screen.findByRole('button', { name: 'Get started' }));
    await next();
    expect(screen.getByRole('group', { name: /Sex/ })).toHaveAccessibleDescription(/Choose/);
    expect(screen.getByLabelText('Age')).toHaveAccessibleDescription(/Enter your age in years/);
    expect(screen.getByLabelText('Current weight')).toHaveAccessibleDescription(/Enter a weight/);
    expect(screen.getByRole('heading', { name: 'About you' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Back' }));
    await throughActivity();
    await next('See my plan');
    expect(
      screen.getByRole('group', { name: 'What would you like to do?' }),
    ).toHaveAccessibleDescription('Choose what you’d like to do.');
    await userEvent.click(screen.getByRole('radio', { name: /Lose weight/ }));
    await userEvent.type(screen.getByLabelText('Goal weight'), '70');
    await next('See my plan');
    expect(screen.getByLabelText('Goal weight')).toHaveAccessibleDescription(
      'To lose weight, enter less than 65 kg.',
    );
    await userEvent.clear(screen.getByLabelText('Goal weight'));
    await userEvent.type(screen.getByLabelText('Goal weight'), '45');
    await next('See my plan');
    expect(screen.getByLabelText('Goal weight')).toHaveAccessibleDescription(/BMI of 18.5/);
  });

  it('offers paces toward the goal, slowest first', async () => {
    setup();
    await throughActivity();
    await userEvent.click(screen.getByRole('radio', { name: /Gain weight/ }));
    const paces = screen.getByRole('group', { name: 'How fast?' });
    expect(Array.from(paces.querySelectorAll('b'), (b) => b.textContent)).toEqual([
      'Gain 0.25 kg per week',
      'Gain 0.5 kg per week',
    ]);
  });

  it('can be skipped from any step, going to Settings to set goals', async () => {
    const { repos, router } = setup();
    await userEvent.click(await screen.findByRole('button', { name: 'Get started' }));
    await userEvent.click(
      await screen.findByRole('button', { name: 'Skip, I’ll set goals myself' }),
    );
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/settings');
    });
    expect((await repos.settings.get()).onboardingDone).toBe(true);
  });

  it('switches units on the first step', async () => {
    const { repos } = setup();
    await userEvent.click(await screen.findByRole('radio', { name: 'lb, ft/in' }));
    await waitFor(async () => {
      expect((await repos.profile.get()).units).toBe('imperial');
    });
  });
});
