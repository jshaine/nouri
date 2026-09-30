import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { createTestRepositories } from '@/data/testing';
import { appRoutes } from './routes';

async function renderAt(path: string, onboardingDone = true) {
  const { repos } = createTestRepositories();
  await repos.settings.set('onboardingDone', onboardingDone);
  const router = createMemoryRouter(appRoutes(repos), { initialEntries: [path] });
  render(<RouterProvider router={router} />);
  await screen.findByRole('main').catch(() => undefined);
  return router;
}

describe('first launch', () => {
  it('sends a new user to the welcome screen', async () => {
    const router = await renderAt('/', false);
    expect(await screen.findByRole('heading', { name: 'Welcome to Nouri' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/welcome');
    expect(screen.queryByRole('navigation', { name: 'Main' })).not.toBeInTheDocument();
  });
});

describe('app shell', () => {
  it('opens on Today with the main tabs', async () => {
    await renderAt('/');
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
    const router = await renderAt('/');
    await userEvent.click(screen.getByRole('link', { name: 'Settings' }));
    expect(router.state.location.pathname).toBe('/settings');
    expect(screen.getByRole('link', { name: 'Settings' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Today' })).not.toHaveAttribute('aria-current');
  });

  it('puts the screen before the tab bar so focus reaches content first', async () => {
    await renderAt('/history');
    const main = screen.getByRole('main');
    const nav = screen.getByRole('navigation', { name: 'Main' });
    expect(main.compareDocumentPosition(nav) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('explains unknown pages and how to get back', async () => {
    await renderAt('/nope');
    expect(screen.getByText(/Use the tabs to get back/)).toBeInTheDocument();
  });
});
