import { registerSW } from 'virtual:pwa-register';
import { registerServiceWorker } from './registerServiceWorker';

vi.mock('virtual:pwa-register', () => ({ registerSW: vi.fn() }));

describe('registerServiceWorker', () => {
  const updateSW = vi.fn(() => Promise.resolve());

  beforeEach(() => {
    vi.mocked(registerSW).mockReset().mockReturnValue(updateSW);
    Object.defineProperty(navigator, 'serviceWorker', { value: {}, configurable: true });
  });

  it('hands the listener an apply callback instead of reloading on its own', async () => {
    const listener = vi.fn();
    registerServiceWorker(listener);

    const options = vi.mocked(registerSW).mock.calls[0]?.[0];
    options?.onNeedRefresh?.();
    expect(listener).toHaveBeenCalledOnce();
    expect(updateSW).not.toHaveBeenCalled();

    const apply = listener.mock.calls[0]?.[0] as () => Promise<void>;
    await apply();
    expect(updateSW).toHaveBeenCalledWith(true);
  });

  it('does nothing when service workers are unsupported', () => {
    Reflect.deleteProperty(navigator, 'serviceWorker');
    registerServiceWorker(vi.fn());
    expect(registerSW).not.toHaveBeenCalled();
  });
});
