import { describe, it, expect, vi, afterEach } from 'vitest';
import { atStep, describeOnlineError, OnlineStepError, stripHash } from '@/utils/onlineError';
import { TimeoutError } from '@/utils/withTimeout';

/*
  連線失敗要回報「卡在哪一步」與「是不是逾時」——
  2026-10-03 一天 17 次 connectFail，當時只知道失敗、不知道原因。
*/
describe('atStep / describeOnlineError', () => {
  afterEach(() => vi.useRealTimers());

  it('成功就照常回傳', async () => {
    await expect(atStep('auth', Promise.resolve('uid'))).resolves.toBe('uid');
  });

  it('Firebase 回錯：標上步驟，不算逾時，原因保留原本的錯', async () => {
    const original = new Error('PERMISSION_DENIED');
    const err = await atStep('join', Promise.reject(original)).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(OnlineStepError);
    expect(describeOnlineError(err)).toEqual({ step: 'join', timeout: false, cause: original });
  });

  it('等太久：標上步驟，而且算逾時', async () => {
    vi.useFakeTimers();
    const p = atStep('getRoom', new Promise(() => {}), 1000).catch((e: unknown) => e);
    await vi.advanceTimersByTimeAsync(1000);
    const info = describeOnlineError(await p);
    expect(info.step).toBe('getRoom');
    expect(info.timeout).toBe(true);
    expect(info.cause).toBeInstanceOf(TimeoutError);
  });

  it('沒經過 atStep 的錯（程式本身的 bug）：沒有步驟', () => {
    const bug = new TypeError('x is undefined');
    expect(describeOnlineError(bug)).toEqual({ step: undefined, timeout: false, cause: bug });
  });
});

describe('stripHash', () => {
  it('房號在 hash 裡，回報前要剝掉', () => {
    expect(stripHash('https://quoridorgame.com/online/#roomId=abc123')).toBe('https://quoridorgame.com/online/');
    expect(stripHash('/en/online/#new=2')).toBe('/en/online/');
  });
  it('沒有 hash 就原樣', () => {
    expect(stripHash('https://quoridorgame.com/rules/')).toBe('https://quoridorgame.com/rules/');
  });
});
