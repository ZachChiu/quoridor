import { describe, it, expect, vi, afterEach } from 'vitest';
import { withTimeout } from '@/utils/withTimeout';

/*
  Firebase 連不上時 SDK 會一直重試，promise 可能永遠不結束 ——
  沒有上限的話畫面就一直停在「連線中…」。
*/
describe('withTimeout', () => {
  afterEach(() => vi.useRealTimers());

  it('時間內完成就照常回傳', async () => {
    await expect(withTimeout(Promise.resolve(42), 1000)).resolves.toBe(42);
  });

  it('時間內失敗就照常丟出原本的錯', async () => {
    await expect(withTimeout(Promise.reject(new Error('原本的錯')), 1000)).rejects.toThrow('原本的錯');
  });

  it('永遠不結束的 promise 到時間就 reject', async () => {
    vi.useFakeTimers();
    const p = withTimeout(new Promise(() => {}), 15_000);
    const caught = p.catch((e: Error) => e.message);
    await vi.advanceTimersByTimeAsync(14_999);
    let settled = false; void p.then(() => {}, () => { settled = true; });
    await Promise.resolve();
    expect(settled).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(await caught).toContain('逾時');
  });
});
