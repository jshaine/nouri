import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { appRoutes } from './routes';

function renderAt(path: string) {
  const router = createMemoryRouter(appRoutes(), { initialEntries: [path] });
  render(<RouterProvider router={router} />);
  return router;
}

describe('app shell', () => {
  it('opens on Today with the main tabs', () => {
    renderAt('/');
    const nav = screen.getByRole('navigation', { name: 'Main' });
    const links = within(nav).getAllByRole('link');
    expect(links.map((l) => l.textContent)).toEqual(['Today', 'History', 'Profile', 'Settings']);
    expect(within(nav).getByRole('link', { name: 'Today' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(document.title).toBe('Today · Nouri');
  });

  it('moves between tabs', async () => {
    const router = renderAt('/');
    await userEvent.click(screen.getByRole('link', { name: 'Settings' }));
    expect(router.state.location.pathname).toBe('/settings');
    expect(screen.getByRole('link', { name: 'Settings' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Today' })).not.toHaveAttribute('aria-current');
  });

  it('puts the screen before the tab bar so focus reaches content first', () => {
    renderAt('/history');
    const main = screen.getByRole('main');
    const nav = screen.getByRole('navigation', { name: 'Main' });
    expect(main.compareDocumentPosition(nav) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('explains unknown pages and how to get back', () => {
    renderAt('/nope');
    expect(screen.getByText(/Use the tabs to get back/)).toBeInTheDocument();
  });
});
