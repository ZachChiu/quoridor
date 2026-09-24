import { describe, it, expect, vi, beforeEach } from 'vitest';

/*
  回饋寫進 RTDB 之前的整理。

  兩個先前的洞，都讓大部分回饋送不出去、而且畫面上只會看到「送出失敗」：
    1. 聯絡方式沒填 → contact: undefined → RTDB 的 set() 直接丟例外
    2. uid 從 auth.currentUser 讀 → 本機與單人模式從不登入 → null →
       規則要求 auth != null，寫入被拒
  這裡把 firebase/database 換成假的，只看最後交給 set() 的東西。
*/
const set = vi.fn(async () => {});
vi.mock('firebase/database', () => ({
  ref: vi.fn(() => ({})),
  push: vi.fn(() => ({})),
  set: (...args: unknown[]) => set(...(args as [])),
}));
vi.mock('@/utils/firebase', () => ({
  getFirebaseDb: vi.fn(async () => ({})),
  getFirebaseAuth: vi.fn(async () => ({ currentUser: null })),
}));

const { sendFeedback } = await import('@/utils/gameService');

const base = {
  rating: 2 as const, message: 'hi', wgf: '2|||', mode: 'local' as const,
  playersNum: 2, result: '', ended: 'unfinished' as const, ua: 'x', viewport: '1x1@1',
};

describe('sendFeedback', () => {
  beforeEach(() => set.mockClear());

  it('沒填聯絡方式時不帶 contact 欄位（RTDB 不收 undefined）', async () => {
    await sendFeedback({ ...base, contact: undefined }, 'uid-1');
    const payload = (set.mock.calls[0] as unknown[])[1] as Record<string, unknown>;
    expect('contact' in payload).toBe(false);
    expect(Object.values(payload)).not.toContain(undefined);
  });

  it('有填就照帶', async () => {
    await sendFeedback({ ...base, contact: 'me@example.com' }, 'uid-1');
    const payload = (set.mock.calls[0] as unknown[])[1] as Record<string, unknown>;
    expect(payload.contact).toBe('me@example.com');
  });

  it('uid 用呼叫端給的，不靠 auth.currentUser（本機模式那裡是 null）', async () => {
    await sendFeedback(base, 'uid-from-ensureUser');
    const payload = (set.mock.calls[0] as unknown[])[1] as Record<string, unknown>;
    expect(payload.uid).toBe('uid-from-ensureUser');
  });
});
