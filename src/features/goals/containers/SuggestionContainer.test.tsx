import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createTestRepositories } from '@/data/testing';
import { goalForDate, type LocalDate, type Profile } from '@/domain';
import { SuggestionContainer } from './SuggestionContainer';

const TODAY = '2026-09-30' as LocalDate;
const woman: Profile = {
  units: 'metric',
  exerciseCaloriesEnabled: false,
  sex: 'female',
  birthDate: '1996-05-01' as LocalDate,
  heightCm: 160,
  goalWeightKg: 58,
  activity: 'light',
  weeklyGoalKg: -0.5,
};

function setup(profile: Profile, currentKg: number | 'none' = 65) {
  const { repos } = createTestRepositories();
  render(
    <SuggestionContainer
      profile={profile}
      currentKg={currentKg === 'none' ? undefined : currentKg}
      repo={repos.goals}
      today={TODAY}
    />,
  );
  return repos;
}

describe('SuggestionContainer', () => {
  it('shows each figure, the macros and how it was worked out', async () => {
    setup(woman);
    expect(await screen.findByText('Daily goal')).toBeInTheDocument();
    const stats = screen.getByText('BMR').closest('dl')!;
    expect(stats).toHaveTextContent('BMR1,339 kcal');
    expect(stats).toHaveTextContent('Maintenance1,841 kcal');
    expect(stats).toHaveTextContent('Weekly goal−550 kcal');
    expect(stats).toHaveTextContent('Daily goal1,290 kcal');
    expect(screen.getByRole('list', { name: 'Macro targets' })).toHaveTextContent(
      'Protein 65 gCarbs 161 gFat 43 g',
    );
    await userEvent.click(screen.getByText('How this is calculated'));
    expect(
      screen.getByText(/10 × 65 kg \+ 6.25 × 160 cm − 5 × 30 − 161 = 1,339 kcal/),
    ).toBeVisible();
    expect(
      screen.getByText('Estimates based on standard formulas; individual needs vary.'),
    ).toBeInTheDocument();
  });

  it('applies the suggestion as a goal from today, then says it matches', async () => {
    const repos = setup(woman);
    await userEvent.selectOptions(await screen.findByLabelText('Macro split'), 'high-protein');
    expect(screen.getByRole('list', { name: 'Macro targets' })).toHaveTextContent('Protein 97 g');
    await userEvent.click(screen.getByRole('button', { name: 'Use these goals' }));
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Goals updated. They apply from today',
    );
    const goal = goalForDate(await repos.goals.all(), TODAY);
    expect(goal).toMatchObject({
      effectiveFrom: TODAY,
      kcal: 1290,
      p: 97,
      macroMode: 'percent',
      percents: { c: 40, p: 30, f: 30 },
    });
  });

  it('says when current goals already match', async () => {
    const { repos } = createTestRepositories();
    await repos.goals.setFrom(TODAY, {
      kcal: 1290,
      c: 161,
      p: 65,
      f: 43,
      macroMode: 'percent',
      percents: { c: 50, p: 20, f: 30 },
    });
    render(<SuggestionContainer profile={woman} currentKg={65} repo={repos.goals} today={TODAY} />);
    expect(await screen.findByText('Your goals match this suggestion.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Use these goals' })).not.toBeInTheDocument();
  });

  it('notes when the goal is raised to the minimum intake', async () => {
    setup(
      {
        ...woman,
        birthDate: '1976-01-01' as LocalDate,
        heightCm: 150,
        goalWeightKg: 45,
        activity: 'sedentary',
        weeklyGoalKg: -1,
      },
      50,
    );
    expect(await screen.findByRole('note')).toHaveTextContent(
      'Set to the minimum recommended intake. Weight loss will be slower than the selected pace.',
    );
    expect(screen.getByText('BMR').closest('dl')!).toHaveTextContent('Daily goal1,200 kcal');
  });

  it('lists what is missing', async () => {
    setup({ units: 'metric', exerciseCaloriesEnabled: false, heightCm: 160 }, 'none');
    expect(
      await screen.findByText(
        'Add your sex, age, goal weight, activity level, weekly goal and current weight (log it below) to see suggested goals.',
      ),
    ).toBeInTheDocument();
  });

  it('is for adults only', async () => {
    setup({ ...woman, birthDate: '2010-01-01' as LocalDate });
    expect(await screen.findByText(/This calculator is for adults/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Use these goals' })).not.toBeInTheDocument();
  });

  it('explains a goal weight below a healthy weight', async () => {
    setup({ ...woman, goalWeightKg: 45 });
    expect(await screen.findByText(/lowest goal we can plan for is 47.4 kg/)).toBeInTheDocument();
  });

  it('explains a failed save', async () => {
    const { repos } = createTestRepositories();
    const failing = { ...repos.goals, setFrom: () => Promise.reject(new Error('blocked')) };
    render(<SuggestionContainer profile={woman} currentKg={65} repo={failing} today={TODAY} />);
    await userEvent.click(await screen.findByRole('button', { name: 'Use these goals' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/allows this site to store data/);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Use these goals' })).toBeEnabled();
    });
  });
});
