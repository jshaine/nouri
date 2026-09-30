import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Sheet } from './Sheet';

function renderSheet(open = true) {
  const onClose = vi.fn();
  const utils = render(
    <Sheet open={open} onClose={onClose} title="Chicken adobo" footer={<button>Add to log</button>}>
      <p>Portion picker</p>
    </Sheet>,
  );
  return { onClose, ...utils };
}

describe('Sheet', () => {
  it('opens as a dialog named by its title', () => {
    renderSheet();
    const dialog = screen.getByRole('dialog', { name: 'Chicken adobo' });
    expect(dialog).toHaveAttribute('open');
    expect(screen.getByText('Portion picker')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add to log' })).toBeInTheDocument();
  });

  it('stays closed when not open and closes when open turns false', () => {
    const { rerender, onClose } = renderSheet(false);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    rerender(
      <Sheet open onClose={onClose} title="Chicken adobo">
        x
      </Sheet>,
    );
    expect(screen.getByRole('dialog')).toHaveAttribute('open');
    rerender(
      <Sheet open={false} onClose={onClose} title="Chicken adobo">
        x
      </Sheet>,
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('asks the owner to close from the close button', async () => {
    const { onClose } = renderSheet();
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('lets the owner decide on Escape instead of closing itself', () => {
    const { onClose } = renderSheet();
    const dialog = screen.getByRole('dialog');
    const cancel = new Event('cancel', { cancelable: true });
    dialog.dispatchEvent(cancel);
    expect(cancel.defaultPrevented).toBe(true);
    expect(onClose).toHaveBeenCalledOnce();
    expect(dialog).toHaveAttribute('open');
  });

  it('closes on a backdrop tap but not on a tap inside', () => {
    const { onClose } = renderSheet();
    fireEvent.click(screen.getByText('Portion picker'));
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('dialog'));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
