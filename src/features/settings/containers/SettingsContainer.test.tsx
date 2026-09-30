import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createTestRepositories } from '@/data/testing';
import { SettingsContainer } from './SettingsContainer';

describe('SettingsContainer', () => {
  it('shows goals, theme, storage and version', async () => {
    const { repos } = createTestRepositories();
    render(<SettingsContainer repos={repos} version="1.2.3" />);
    expect(screen.getByRole('heading', { level: 1, name: 'Settings' })).toBeInTheDocument();
    for (const name of ['Goals', 'Appearance', 'Storage', 'About']) {
      expect(screen.getByRole('region', { name })).toBeInTheDocument();
    }
    expect(await screen.findByText(/Not asked yet/)).toBeInTheDocument();
    expect(screen.getByText(/Nouri 1.2.3/)).toBeInTheDocument();
    expect(document.title).toBe('Settings · Nouri');
  });

  it('saves the theme override', async () => {
    const { repos } = createTestRepositories();
    render(<SettingsContainer repos={repos} />);
    await userEvent.click(await screen.findByRole('radio', { name: 'Dark' }));
    await waitFor(async () => {
      expect((await repos.settings.get()).theme).toBe('dark');
    });
    expect(screen.getByRole('radio', { name: 'Dark' })).toBeChecked();
  });

  it.each([
    [true, /^StorageProtected\. Your browser won’t clear/],
    [false, /Not protected\..*back up regularly/],
  ])('describes persistence %s', async (granted, text) => {
    const { repos } = createTestRepositories();
    await repos.settings.set('persistGranted', granted);
    render(<SettingsContainer repos={repos} />);
    await waitFor(() => {
      expect(screen.getByRole('region', { name: 'Storage' })).toHaveTextContent(text);
    });
  });
});

describe('units and credits', () => {
  it('switches units', async () => {
    const { repos } = createTestRepositories();
    render(<SettingsContainer repos={repos} version="1" />);
    await userEvent.click(await screen.findByRole('radio', { name: 'lb, ft/in' }));
    await waitFor(async () => {
      expect((await repos.profile.get()).units).toBe('imperial');
    });
  });

  it('credits the bundled data sources', async () => {
    const { repos } = createTestRepositories();
    render(<SettingsContainer repos={repos} version="1" />);
    const about = screen.getByRole('region', { name: 'About' });
    await waitFor(() => {
      expect(about).toHaveTextContent('USDA FoodData Central');
    });
    expect(about).not.toHaveTextContent('FNRI');
  });

  it('credits FNRI only when its data is bundled', async () => {
    const { repos } = createTestRepositories();
    const foods = {
      ...repos.foods,
      ready: () =>
        Promise.resolve({
          count: 1,
          sources: {
            usda: 'USDA FoodData Central',
            fnri: 'FNRI Philippine Food Composition Tables (PhilFCT), used with permission',
          },
        }),
    };
    render(<SettingsContainer repos={{ ...repos, foods }} version="1" />);
    expect(await screen.findByText(/FNRI Philippine Food Composition Tables/)).toBeInTheDocument();
  });
});
