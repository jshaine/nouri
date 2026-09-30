import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { createTestRepositories } from '@/data/testing';
import { BackupReminder } from './BackupReminder';

const NOW = () => new Date('2026-10-01T09:00:00Z');

describe('BackupReminder', () => {
  it('nudges when there is data and no recent backup, and can be dismissed', async () => {
    const { repos } = createTestRepositories();
    render(
      <MemoryRouter>
        <BackupReminder settings={repos.settings} hasData now={NOW} />
      </MemoryRouter>,
    );
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Your log lives only on this phone. Back up now to keep a copy.',
    );
    expect(screen.getByRole('link', { name: 'Back up now' })).toHaveAttribute('href', '/settings');
    await userEvent.click(screen.getByRole('button', { name: 'Not now' }));
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('stays quiet after a recent backup or with nothing logged', async () => {
    const { repos } = createTestRepositories();
    await repos.settings.set('lastBackupAt', NOW().getTime() - 3 * 86_400_000);
    const { rerender } = render(
      <MemoryRouter>
        <BackupReminder settings={repos.settings} hasData now={NOW} />
      </MemoryRouter>,
    );
    await new Promise((r) => setTimeout(r, 50));
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    const fresh = createTestRepositories();
    rerender(
      <MemoryRouter>
        <BackupReminder settings={fresh.repos.settings} hasData={false} now={NOW} />
      </MemoryRouter>,
    );
    await new Promise((r) => setTimeout(r, 50));
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
