import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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

async function fill(label: string, value: string) {
  const input = screen.getByLabelText(label);
  await userEvent.clear(input);
  await userEvent.type(input, value);
  await userEvent.tab();
}

describe('OnboardingContainer', () => {
  it('walks through units, details and suggested goals, then finishes on Today', async () => {
    const { repos, router } = setup();
    expect(await screen.findByRole('heading', { name: 'Welcome to Nouri' })).toBeInTheDocument();
    expect(screen.getByText('Step 1 of 4')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Next' }));

    expect(await screen.findByRole('heading', { name: 'About you' })).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('Current weight'), '65');
    await userEvent.click(screen.getByRole('radio', { name: 'Female' }));
    fireEvent.change(screen.getByLabelText('Birth date'), { target: { value: '1996-05-01' } });
    fireEvent.blur(screen.getByLabelText('Birth date'));
    await fill('Height', '160');
    await fill('Goal weight', '58');
    await userEvent.click(screen.getByRole('radio', { name: /Lightly active/ }));
    await waitFor(async () => {
      expect((await repos.profile.get()).goalWeightKg).toBe(58);
    });
    // The weight isn't saved until Next, so only "maintain" is offered here.
    await userEvent.selectOptions(screen.getByLabelText('Weekly goal'), 'Maintain my weight');
    await userEvent.click(screen.getByRole('button', { name: 'Next' }));

    expect(await screen.findByRole('heading', { name: 'Suggested goals' })).toBeInTheDocument();
    expect((await firstValue(repos.weights.live()))[0]).toMatchObject({ date: TODAY, kg: 65 });
    expect(await screen.findByText('Daily goal')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Use these goals' }));
    await screen.findByText(/Goals updated/);
    expect(goalForDate(await repos.goals.all(), TODAY)?.kcal).toBe(1840); // 1841 → maintain, rounded
    await userEvent.click(screen.getByRole('button', { name: 'Next' }));

    expect(await screen.findByRole('heading', { name: 'You’re set' })).toBeInTheDocument();
    expect(screen.getByText(/Your goals are ready/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Start logging' }));
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/');
    });
    expect((await repos.settings.get()).onboardingDone).toBe(true);
  });

  it('can be skipped from any step, going to Settings to set goals', async () => {
    const { repos, router } = setup();
    await userEvent.click(await screen.findByRole('button', { name: 'Next' }));
    await userEvent.click(
      await screen.findByRole('button', { name: 'Skip, I’ll set goals myself' }),
    );
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/settings');
    });
    expect((await repos.settings.get()).onboardingDone).toBe(true);
  });

  it('explains an invalid current weight and stays on the step', async () => {
    setup();
    await userEvent.click(await screen.findByRole('button', { name: 'Next' }));
    await userEvent.type(await screen.findByLabelText('Current weight'), '5');
    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByLabelText('Current weight')).toHaveAccessibleDescription(
      /Enter a weight in kg/,
    );
    expect(screen.getByRole('heading', { name: 'About you' })).toBeInTheDocument();
  });

  it('switches units on the first step', async () => {
    const { repos } = setup();
    await userEvent.click(await screen.findByRole('radio', { name: 'lb, ft/in' }));
    await waitFor(async () => {
      expect((await repos.profile.get()).units).toBe('imperial');
    });
  });
});
