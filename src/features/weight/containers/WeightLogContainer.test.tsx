import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import type { Repositories } from '@/data';
import { createTestRepositories } from '@/data/testing';
import type { LocalDate, UnitSystem } from '@/domain';
import { useLive } from '@/ui';
import { WeightLogContainer } from './WeightLogContainer';

const TODAY = '2026-09-30' as LocalDate;

function Harness({
  repos,
  units = 'metric',
  goalKg,
}: {
  repos: Repositories;
  units?: UnitSystem;
  goalKg?: number;
}) {
  const weights = useLive(() => repos.weights.live(), [repos.weights]);
  const [logged, setLogged] = useState(0);
  if (!weights.value) return null;
  return (
    <>
      <WeightLogContainer
        weights={weights.value}
        repo={repos.weights}
        units={units}
        goalKg={goalKg}
        today={TODAY}
        onLogged={() => {
          setLogged((n) => n + 1);
        }}
      />
      <span data-testid="logged">{logged}</span>
    </>
  );
}

describe('WeightLogContainer', () => {
  it('invites a first weigh-in, then logs one for today', async () => {
    const { repos } = createTestRepositories();
    render(<Harness repos={repos} />);
    expect(await screen.findByText(/Log your weight to track your trend/)).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('Weight'), '65.4');
    await userEvent.click(screen.getByRole('button', { name: 'Log weight' }));
    const list = await screen.findByRole('list', { name: 'Weigh-ins' });
    expect(within(list).getByRole('listitem')).toHaveTextContent('Today65.4 kg');
    expect(screen.getByLabelText('Weight')).toHaveValue('');
    expect(screen.getByTestId('logged')).toHaveTextContent('1');
    expect(screen.getByText(/One weigh-in: 65.4 kg. Log another/)).toBeInTheDocument();
  });

  it('explains an invalid weight', async () => {
    const { repos } = createTestRepositories();
    render(<Harness repos={repos} />);
    await userEvent.click(await screen.findByRole('button', { name: 'Log weight' }));
    expect(screen.getByLabelText('Weight')).toHaveAccessibleDescription(/Enter a weight in kg/);
  });

  it('lists newest first with neutral changes, and summarizes the trend', async () => {
    const { repos } = createTestRepositories();
    await repos.weights.set('2026-09-01' as LocalDate, 66);
    await repos.weights.set('2026-09-29' as LocalDate, 65.6);
    render(<Harness repos={repos} goalKg={58} />);
    const items = within(await screen.findByRole('list', { name: 'Weigh-ins' })).getAllByRole(
      'listitem',
    );
    expect(items.map((i) => i.textContent)).toEqual([
      expect.stringMatching(/^Yesterday65.6 kg −0.4 kg/),
      expect.stringMatching(/^Tue, Sep 166 kg/),
    ]);
    expect(screen.getByText('From 66 kg (Tue, Sep 1) to 65.6 kg (Yesterday).')).toBeInTheDocument();
  });

  it('shows pounds in imperial and stores kilograms', async () => {
    const { repos } = createTestRepositories();
    render(<Harness repos={repos} units="imperial" />);
    await userEvent.type(await screen.findByLabelText('Weight'), '150');
    await userEvent.click(screen.getByRole('button', { name: 'Log weight' }));
    const list = await screen.findByRole('list', { name: 'Weigh-ins' });
    expect(list).toHaveTextContent('150 lb');
  });

  it('edits and deletes with undo', async () => {
    const { repos } = createTestRepositories();
    await repos.weights.set('2026-09-29' as LocalDate, 65.6);
    render(<Harness repos={repos} />);
    await userEvent.click(await screen.findByRole('button', { name: 'Edit Yesterday' }));
    const field = screen.getByLabelText('Weight');
    expect(field).toHaveValue('65.6');
    await userEvent.clear(field);
    await userEvent.type(field, '65.2');
    await userEvent.click(screen.getByRole('button', { name: 'Save weight' }));
    await waitFor(() => {
      expect(screen.getByRole('list', { name: 'Weigh-ins' })).toHaveTextContent('65.2 kg');
    });

    await userEvent.click(screen.getByRole('button', { name: 'Delete Yesterday' }));
    expect(await screen.findByRole('status')).toHaveTextContent('Deleted Yesterday.');
    await waitFor(() => {
      expect(screen.queryByRole('list', { name: 'Weigh-ins' })).not.toBeInTheDocument();
    });
    await userEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(await screen.findByRole('list', { name: 'Weigh-ins' })).toHaveTextContent('65.2 kg');
  });

  it('reads each weigh-in from the chart with the keyboard', async () => {
    const { repos } = createTestRepositories();
    await repos.weights.set('2026-09-01' as LocalDate, 66);
    await repos.weights.set('2026-09-29' as LocalDate, 65.6);
    render(<Harness repos={repos} goalKg={58} />);
    const chart = await screen.findByRole('slider', { name: 'Weight trend' });
    expect(chart).toHaveAttribute('aria-valuetext', 'Yesterday: 65.6 kg');
    expect(chart).toHaveAccessibleDescription(/From 66 kg/);
    chart.focus();
    await userEvent.keyboard('{ArrowLeft}');
    expect(chart).toHaveAttribute('aria-valuetext', 'Tue, Sep 1: 66 kg');
    await userEvent.keyboard('{End}');
    expect(chart).toHaveAttribute('aria-valuenow', '1');
  });
});
