import { afterEach, describe, expect, it, vi } from 'vitest';
import { track } from '@/utils/analytics';

describe('track', () => {
  afterEach(() => { vi.unstubAllGlobals(); });

  it('GA 沒載入（被擋、或還沒到）時什麼都不做，也不丟錯', () => {
    vi.stubGlobal('window', {});
    expect(() => track('contact_open', {})).not.toThrow();
  });

  it('事件名稱原樣送出，undefined 的參數拿掉', () => {
    const gtag = vi.fn();
    vi.stubGlobal('window', { gtag });
    track('game_start', { mode: 'local', players: 2, difficulty: undefined });
    expect(gtag).toHaveBeenCalledWith('event', 'game_start', { mode: 'local', players: 2 });
  });
});
