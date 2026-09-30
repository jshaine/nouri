import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createTestRepositories, firstValue } from '@/data/testing';
import type { LocalDate } from '@/domain';
import { BackupContainer } from './BackupContainer';

const NOW = () => new Date('2026-10-01T09:00:00Z');

async function seeded() {
  const t = createTestRepositories();
  await t.repos.weights.set('2026-09-30' as LocalDate, 65);
  await t.repos.goals.setFrom('2026-09-01' as LocalDate, {
    kcal: 1850,
    p: 1,
    c: 1,
    f: 1,
    macroMode: 'grams',
  });
  return t;
}

describe('BackupContainer', () => {
  beforeEach(() => {
    URL.createObjectURL = vi.fn(() => 'blob:x');
    URL.revokeObjectURL = vi.fn();
  });

  it('downloads a backup file and records when', async () => {
    const { repos } = await seeded();
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => undefined);
    render(<BackupContainer repos={repos} now={NOW} />);
    expect(await screen.findByText(/No backup yet/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Back up' }));
    expect(await screen.findByRole('status')).toHaveTextContent('Backup saved.');
    expect(click).toHaveBeenCalledOnce();
    expect((await repos.settings.get()).lastBackupAt).toBe(NOW().getTime());
    expect(await screen.findByText(/Last backup: Oct 1, 2026/)).toBeInTheDocument();
    click.mockRestore();
  });

  it('uses the share sheet on phones, and a cancelled share is not a backup', async () => {
    const { repos } = await seeded();
    const share = vi.fn(() => Promise.reject(new DOMException('cancel', 'AbortError')));
    Object.assign(navigator, { canShare: () => true, share });
    render(<BackupContainer repos={repos} now={NOW} />);
    await userEvent.click(await screen.findByRole('button', { name: 'Back up' }));
    await waitFor(() => {
      expect(share).toHaveBeenCalledOnce();
    });
    expect((await repos.settings.get()).lastBackupAt).toBeNull();
    Reflect.deleteProperty(navigator, 'canShare');
    Reflect.deleteProperty(navigator, 'share');
  });

  it('restores by merging, after showing what the file has', async () => {
    const source = await seeded();
    const json = JSON.stringify(await source.repos.backup.export());
    const { repos } = createTestRepositories();
    render(<BackupContainer repos={repos} now={NOW} />);
    await userEvent.upload(
      await screen.findByLabelText('Restore from a backup'),
      new File([json], 'b.json', { type: 'application/json' }),
    );
    expect(await screen.findByRole('group', { name: 'Restore options' })).toHaveTextContent(
      'This backup has 0 entries, 0 foods, 1 weigh-in, 1 goal.',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Merge: add what’s missing' }));
    expect(await screen.findByRole('status')).toHaveTextContent('Merged.');
    expect(await firstValue(repos.weights.live())).toHaveLength(1);
  });

  it('asks before replacing everything', async () => {
    const source = await seeded();
    const json = JSON.stringify(await source.repos.backup.export());
    const { repos } = createTestRepositories();
    await repos.weights.set('2026-09-01' as LocalDate, 70);
    render(<BackupContainer repos={repos} now={NOW} />);
    await userEvent.upload(
      await screen.findByLabelText('Restore from a backup'),
      new File([json], 'b.json'),
    );
    await userEvent.click(await screen.findByRole('button', { name: 'Replace everything' }));
    expect(screen.getByRole('group', { name: 'Confirm replace' })).toHaveTextContent(
      'Replace everything on this phone?',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Keep my data' }));
    expect(await firstValue(repos.weights.live())).toHaveLength(1);
    await userEvent.upload(
      screen.getByLabelText('Restore from a backup'),
      new File([json], 'b.json'),
    );
    await userEvent.click(await screen.findByRole('button', { name: 'Replace everything' }));
    await userEvent.click(screen.getByRole('button', { name: 'Yes, replace' }));
    expect(await screen.findByRole('status')).toHaveTextContent('Restored.');
    expect((await firstValue(repos.weights.live())).map((w) => w.kg)).toEqual([65]);
  });

  it('explains a file that is not a backup', async () => {
    const { repos } = createTestRepositories();
    render(<BackupContainer repos={repos} now={NOW} />);
    await userEvent.upload(
      await screen.findByLabelText('Restore from a backup'),
      new File(['not json'], 'x.json'),
    );
    expect(await screen.findByRole('alert')).toHaveTextContent('That file isn’t a Nouri backup.');
  });
});
