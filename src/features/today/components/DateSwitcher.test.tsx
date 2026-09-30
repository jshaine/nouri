import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { LocalDate } from '@/domain';
import { DateSwitcher } from './DateSwitcher';

const today = '2026-09-30' as LocalDate;

function setup(date: LocalDate) {
  const handlers = { onPrevious: vi.fn(), onNext: vi.fn(), onPick: vi.fn() };
  render(<DateSwitcher date={date} label="Label" today={today} {...handlers} />);
  return handlers;
}

describe('DateSwitcher', () => {
  it('goes back, and not forward past today', async () => {
    const h = setup(today);
    await userEvent.click(screen.getByRole('button', { name: 'Previous day' }));
    expect(h.onPrevious).toHaveBeenCalledOnce();
    expect(screen.getByRole('button', { name: 'Next day', hidden: true })).toBeDisabled();
  });

  it('goes forward from a past day', async () => {
    const h = setup('2026-09-28' as LocalDate);
    await userEvent.click(screen.getByRole('button', { name: 'Next day' }));
    expect(h.onNext).toHaveBeenCalledOnce();
  });

  it('picks a date natively, capped at today', () => {
    const h = setup(today);
    const picker = screen.getByLabelText('Label, choose a date');
    expect(picker).toHaveAttribute('max', today);
    fireEvent.change(picker, { target: { value: '2026-09-01' } });
    expect(h.onPick).toHaveBeenCalledWith('2026-09-01');
    fireEvent.change(picker, { target: { value: '' } });
    expect(h.onPick).toHaveBeenCalledOnce();
  });
});
