import { describe, it, expect } from 'vitest';
import { GRACE_MS, OPEN_SLACK_MS, PRESS_WAIT_MS, deriveAuction } from '@/games/time-auction/online';
import { MODES, remaining } from '@/games/time-auction/engine';
import type { AuctionPress, AuctionRoom } from '@/types/auctionRoom';

/**
 * 連線版的推導（games/time-auction/online.ts）：同一份按鍵時間，每台裝置都要算出同一個結果。
 * 時間都是伺服器時間（毫秒）。快速局：每人 2 分鐘（1200 個 0.1 秒）、倒數 3 秒。
 */
const CD = MODES.quick.countdownMs;
const player = (uid: string, joinedAt: number) => ({ uid, displayName: 'player', joinedAt });

type Rounds = Record<number, Record<number, AuctionPress>>;
function room(seats: number, rounds: Rounds = {}, joined: number[] = Array.from({ length: seats }, (_, i) => 100 + i)): AuctionRoom {
  return {
    id: 'r', mode: 'quick', seats, createdAt: 0,
    players: Object.fromEntries(joined.map((t, i) => [`s${i}`, player(`u${i}`, t)])),
    rounds: Object.fromEntries(Object.entries(rounds).map(([n, rec]) => [`r${n}`, Object.fromEntries(Object.entries(rec).map(([i, p]) => [`s${i}`, p]))])),
  };
}
/** 回合在 start 開始：每人在 start 前一點按下，放手在「倒數結束後 ms 毫秒」（null＝沒放手、'pass'＝倒數中放手） */
const hold = (start: number, ms: number | 'pass' | null, downAt = start): AuctionPress =>
  ms === null ? { down: downAt } : { down: downAt, up: ms === 'pass' ? start + 1000 : start + CD + ms };

describe('時間拍賣連線版的推導', () => {
  it('還有空位：等人', () => {
    const r = room(3);
    delete r.players!.s2;
    expect(deriveAuction(r, 10_000).phase).toBe('waiting');
  });

  it('坐滿了、還沒人按：第 1 回合開放，開放時間是最後一個人入座', () => {
    const v = deriveAuction(room(3, {}, [100, 900, 500]), 10_000);
    expect(v.phase).toBe('open');
    expect(v.round).toMatchObject({ n: 1, openAt: 900, cutoff: null, start: null });
  });

  it('有人按了、還沒到齊：等人，期限是第一個人按下去起算', () => {
    const v = deriveAuction(room(3, { 1: { 0: { down: 1000 }, 2: { down: 1500 } } }), 5000);
    expect(v.phase).toBe('gathering');
    expect(v.round?.pressed).toEqual([true, false, true]);
    expect(v.round?.cutoff).toBe(1000 + PRESS_WAIT_MS);
    expect(v.wakeAt).toBe(1000 + PRESS_WAIT_MS + GRACE_MS);
  });

  it('到齊就開始（最後一個人按下去那一刻）；倒數結束前不公布', () => {
    const r = room(2, { 1: { 0: { down: 1000, up: 1200 }, 1: { down: 2000, up: 2100 } } });
    const mid = deriveAuction(r, 2500);
    expect(mid.phase).toBe('live');
    expect(mid.round?.start).toBe(2000);
    expect(mid.round?.inRound).toEqual([true, true]);
    expect(mid.wakeAt).toBe(2000 + CD);
    // 兩個人都在倒數前或倒數中放手：倒數跑完才結算，全員放棄
    const after = deriveAuction(r, 2000 + CD);
    expect(after.game.history[0]).toEqual({ bids: [0, 0], winner: null, top: 0 });
    expect(after.phase).toBe('open');
  });

  it('出價＝放手的時間 − 開始 − 倒數，無條件捨去到 0.1 秒；最後放手的人得標，所有人付掉自己按的時間', () => {
    const s = 1000;
    const v = deriveAuction(room(3, { 1: { 0: hold(s, 1234), 1: hold(s, 999, 400), 2: hold(s, 'pass') } }), 99_999);
    expect(v.game.history[0]).toEqual({ bids: [12, 9, 0], winner: 0, top: 12 });
    expect([0, 1, 2].map((i) => remaining(v.game, i))).toEqual([1188, 1191, 1200]);
    // 第 2 回合在最後一個人放手（倒數結束後 1.234 秒）時開放
    expect(v.round).toMatchObject({ n: 2, openAt: s + CD + 1234 });
  });

  it('最高出價同一個 0.1 秒就流標（毫秒差多半是網路造成的）', () => {
    const v = deriveAuction(room(2, { 1: { 0: hold(1000, 1250), 1: hold(1000, 1299) } }), 99_999);
    expect(v.game.history[0]).toEqual({ bids: [12, 12], winner: null, top: 12 });
  });

  it('期限到了還有人沒按：不等他，回合在期限＋寬限那一刻開始；下一回合不再等他', () => {
    const first = 1000;
    const start = first + PRESS_WAIT_MS + GRACE_MS;
    const before = deriveAuction(room(3, { 1: { 0: { down: first }, 1: { down: first + 300 } } }), start - 1);
    expect(before.phase).toBe('gathering');
    const at = deriveAuction(room(3, { 1: { 0: { down: first }, 1: { down: first + 300 } } }), start);
    expect(at.phase).toBe('live');
    expect(at.round?.start).toBe(start);
    expect(at.round?.inRound).toEqual([true, true, false]);

    // s0 出 0.5 秒、s1 不參加 → s0 得標。第 2 回合只等 s0、s1，s0、s1 按住就開始
    const r1 = { 0: hold(start, 500, first), 1: hold(start, 'pass', first + 300) };
    const close = start + CD + 500;
    const v = deriveAuction(room(3, { 1: r1, 2: { 0: { down: close + 2000 }, 1: { down: close + 2500 } } }), close + 2600);
    expect(v.game.history[0].winner).toBe(0);
    expect(v.round).toMatchObject({ n: 2, required: [true, true, false], start: close + 2500 });
  });

  it('倒數中才按的人沒趕上（出價 0），但人在 —— 下一回合要等他', () => {
    // 第 1 回合 s2 沒來（期限到了才開始），第 2 回合就不等他；他在倒數中才按，沒趕上
    const first = 1000;
    const s1 = first + PRESS_WAIT_MS + GRACE_MS;
    const r1 = { 0: hold(s1, 500, first), 1: hold(s1, 'pass', first) };
    const open2 = s1 + CD + 500;
    const s2 = open2 + 1000;
    const r2 = { 0: hold(s2, 800, open2 + 500), 1: hold(s2, 300, s2), 2: { down: s2 + 1500, up: s2 + CD + 5000 } };
    const open3 = s2 + CD + 800;
    const v = deriveAuction(room(3, { 1: r1, 2: r2, 3: { 0: { down: open3 + 100 }, 1: { down: open3 + 200 } } }), open3 + 300);
    expect(v.game.history[1].bids).toEqual([8, 3, 0]);
    expect(v.round).toMatchObject({ n: 3, required: [true, true, true], start: null });
    expect(v.phase).toBe('gathering');
  });

  it('一直沒放手（斷線）：時間用完再過寬限才當作按到底，出價＝剩餘時間', () => {
    const s = 1000;
    const r = room(2, { 1: { 0: hold(s, 2000), 1: { down: s } } });
    const expiry = s + CD + 1200 * 100;
    const pending = deriveAuction(r, expiry + GRACE_MS - 1);
    expect(pending.phase).toBe('live');
    expect(pending.wakeAt).toBe(expiry + GRACE_MS);
    const done = deriveAuction(r, expiry + GRACE_MS);
    expect(done.game.history[0]).toEqual({ bids: [20, 1200], winner: 1, top: 1200 });
    expect(remaining(done.game, 1)).toBe(0);
    // 晚到的 up（時間用完之後才寫）結果一樣：按鈕在時間用完那一刻就彈起來了
    const late = deriveAuction(room(2, { 1: { 0: hold(s, 2000), 1: { down: s, up: expiry + 60_000 } } }), expiry + 1);
    expect(late.game.history[0]).toEqual(done.game.history[0]);
  });

  it('回合開放之前就寫好的 down 不算（例如有人先替後面的回合按好）', () => {
    const s = 1000;
    const close = s + CD + 500;
    const r = room(2, { 1: { 0: hold(s, 500), 1: hold(s, 100) }, 2: { 0: { down: 50 }, 1: { down: close - OPEN_SLACK_MS - 1 } } });
    const v = deriveAuction(r, close + 10);
    expect(v.phase).toBe('open');
    expect(v.round?.pressed).toEqual([false, false]);
    // 開放前 1 秒內的算數（本機估的伺服器時間可能早一點點）
    const ok = deriveAuction(room(2, { 1: { 0: hold(s, 500), 1: hold(s, 100) }, 2: { 0: { down: close - 300 } } }), close + 10);
    expect(ok.round?.pressed).toEqual([true, false]);
  });

  it('所有人的時間都用完：剩下的回合直接全員放棄、拍賣結束', () => {
    const s = 1000;
    const v = deriveAuction(room(2, { 1: { 0: hold(s, 200_000), 1: hold(s, 200_000) } }), 999_999);
    expect(v.phase).toBe('over');
    expect(v.game.history).toHaveLength(19);
    expect(v.game.history[0]).toEqual({ bids: [1200, 1200], winner: null, top: 1200 });
    expect(v.game.tokens).toEqual([0, 0]);
  });

  it('19 回合打完是 over；同一份資料不管何時、key 的順序如何，算出來都一樣', () => {
    const rounds: Rounds = {};
    let t = 1000;
    for (let n = 1; n <= 19; n++) {
      const s = t + 50;
      rounds[n] = { 0: hold(s, 300 + n * 10, t), 1: hold(s, n % 3 === 0 ? 'pass' : 200 + n * 20, s), 2: hold(s, 250, t + 10) };
      t = s + CD + 1500;
    }
    const a = deriveAuction(room(3, rounds), t + 10_000);
    expect(a.phase).toBe('over');
    const reversed = room(3, rounds);
    reversed.rounds = Object.fromEntries(Object.entries(reversed.rounds!).reverse());
    const b = deriveAuction(reversed, t + 9_999_999);
    expect(b.game).toEqual(a.game);
  });

  it('房間只有 2 個人也能開（連線最少 2 席）', () => {
    const v = deriveAuction(room(2, { 1: { 0: hold(1000, 700), 1: hold(1000, 'pass') } }), 99_999);
    expect(v.game.history[0].winner).toBe(0);
  });
});
