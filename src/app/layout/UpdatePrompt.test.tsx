import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createUpdateStore } from '../pwa/updateStore';
import { UpdatePrompt } from './UpdatePrompt';

describe('UpdatePrompt', () => {
  it('stays hidden until an update is ready', () => {
    render(<UpdatePrompt store={createUpdateStore()} />);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('reloads only when asked', async () => {
    const store = createUpdateStore();
    const apply = vi.fn(() => Promise.resolve());
    render(<UpdatePrompt store={store} />);
    act(() => {
      store.offer(apply);
    });
    expect(screen.getByRole('status')).toHaveTextContent(
      'A new version of Nouri is ready. Finish what you’re typing, then reload to update.',
    );
    expect(apply).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Reload' }));
    expect(apply).toHaveBeenCalledOnce();
    expect(screen.getByRole('button', { name: 'Reloading…' })).toBeDisabled();
  });

  it('can wait until later', async () => {
    const store = createUpdateStore();
    render(<UpdatePrompt store={store} />);
    act(() => {
      store.offer(() => Promise.resolve());
    });
    await userEvent.click(screen.getByRole('button', { name: 'Later' }));
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
