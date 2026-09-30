import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { Tabs } from './Tabs';

const TABS = [
  { id: 'search', label: 'Search' },
  { id: 'recent', label: 'Recent' },
  { id: 'mine', label: 'My foods' },
] as const;
type Id = (typeof TABS)[number]['id'];

function Controlled() {
  const [tab, setTab] = useState<Id>('search');
  return (
    <Tabs label="Add food" tabs={TABS} value={tab} onChange={setTab}>
      <p>Panel: {tab}</p>
    </Tabs>
  );
}

describe('Tabs', () => {
  it('links the selected tab to its panel', () => {
    render(<Controlled />);
    const tab = screen.getByRole('tab', { name: 'Search' });
    expect(tab).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel', { name: 'Search' })).toHaveTextContent('Panel: search');
    expect(screen.getByRole('tablist', { name: 'Add food' })).toBeInTheDocument();
  });

  it('selects on click', async () => {
    render(<Controlled />);
    await userEvent.click(screen.getByRole('tab', { name: 'Recent' }));
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Panel: recent');
  });

  it('moves with arrows (wrapping), Home and End, keeping one tab stop', async () => {
    render(<Controlled />);
    await userEvent.tab();
    expect(screen.getByRole('tab', { name: 'Search' })).toHaveFocus();
    await userEvent.keyboard('{ArrowLeft}');
    expect(screen.getByRole('tab', { name: 'My foods' })).toHaveFocus();
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Panel: mine');
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Search' })).toHaveFocus();
    await userEvent.keyboard('{End}');
    expect(screen.getByRole('tab', { name: 'My foods' })).toHaveFocus();
    await userEvent.keyboard('{Home}');
    expect(screen.getByRole('tab', { name: 'Search' })).toHaveFocus();
    const stops = screen.getAllByRole('tab').filter((t) => t.tabIndex === 0);
    expect(stops).toHaveLength(1);
  });
});
