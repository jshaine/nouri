import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Entry, LocalDate } from '@/domain';
import { EntryRow } from './EntryRow';

const base: Entry = {
  id: 'e',
  date: '2026-09-30' as LocalDate,
  meal: 'lunch',
  foodKey: 'usda:1',
  amount: 1,
  unit: { kind: 'portion', label: '1 cup' },
  name: 'Rice, white, cooked',
  source: 'usda',
  totals: { kcal: 205.4, p: 4.27, c: 44.2, f: 0.47 },
  createdAt: 1,
};

describe('EntryRow', () => {
  it.each([
    [{ amount: 1 }, '1 cup · P 4.3 C 44 F 0.5'],
    [{ amount: 2.5 }, '2.5 × 1 cup'],
    [{ amount: 150, unit: { kind: 'grams' as const } }, '150 g'],
  ])('describes %j', (over, text) => {
    render(
      <ul>
        <EntryRow entry={{ ...base, ...over }} />
      </ul>,
    );
    expect(screen.getByRole('listitem')).toHaveTextContent(text);
  });

  it('shows name, source and calories, and presses when interactive', async () => {
    const onOpen = vi.fn();
    render(
      <ul>
        <EntryRow
          entry={base}
          press={{
            onClick: () => {
              onOpen(base);
            },
          }}
        />
      </ul>,
    );
    const button = screen.getByRole('button', {
      name: 'Rice, white, cooked Source: USDA 1 cup · P 4.3 C 44 F 0.5 205 kcal',
    });
    await userEvent.click(button);
    expect(onOpen).toHaveBeenCalledWith(base);
  });

  it('is not a button when read-only', () => {
    render(
      <ul>
        <EntryRow entry={base} />
      </ul>,
    );
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
