import { describe, it, expect } from 'vitest';
import {
  createAuction, playRound, bidFromHold, capBid, resolveBids, standings, publicHistory, maxRemaining,
  viewFor, currentRound, isOver, remaining, formatTenths, MODES, type AuctionState, type BidderView,
} from '@/games/time-auction/engine';
import {
  decideBid, guaranteedBid, assignPersonas, planTargets, rngFor, PERSONAS, type Difficulty,
} from '@/games/time-auction/ai';

/** 一回合：依序給每一席的出價（0.1 秒） */
const play = (s: AuctionState, ...bids: number[]) => playRound(s, bids);

describe('開局', () => {
  it('快速局每人 2 分鐘、節目局 10 分鐘，都是 19 回合', () => {
    const quick = createAuction('quick', 6);
    expect(quick.budget).toBe(1200);
    expect(quick.rounds).toBe(19);
    expect(quick.spent).toEqual([0, 0, 0, 0, 0, 0]);
    expect(quick.tokens).toEqual([0, 0, 0, 0, 0, 0]);
    expect(createAuction('show', 4).budget).toBe(6000);
    expect(MODES.quick.countdownMs).toBe(3000);
    expect(MODES.show.countdownMs).toBe(5000);
  });

  it('4–6 席，其他人數丟錯', () => {
    expect(() => createAuction('quick', 3)).toThrow();
    expect(() => createAuction('quick', 7)).toThrow();
    expect(createAuction('quick', 4).seats).toBe(4);
  });
});

describe('按住多久 → 出價', () => {
  it('倒數內放手＝放棄（0），不扣時間', () => {
    expect(bidFromHold(0, 3000, 1200)).toBe(0);
    expect(bidFromHold(2999, 3000, 1200)).toBe(0);
    // 倒數剛結束、還不滿 0.1 秒也是 0
    expect(bidFromHold(3000, 3000, 1200)).toBe(0);
    expect(bidFromHold(3099, 3000, 1200)).toBe(0);
  });

  it('倒數之後每滿 0.1 秒算 0.1 秒，無條件捨去', () => {
    expect(bidFromHold(3100, 3000, 1200)).toBe(1);
    expect(bidFromHold(3000 + 12_349, 3000, 1200)).toBe(123);
    expect(bidFromHold(5000 + 129_500, 5000, 6000)).toBe(1295);
  });

  it('不能超過剩餘時間（按鈕自動彈起）', () => {
    expect(bidFromHold(3000 + 60_000, 3000, 250)).toBe(250);
    expect(bidFromHold(3000 + 60_000, 3000, 0)).toBe(0);
    expect(capBid(Infinity, 77)).toBe(77);
    expect(capBid(-5, 77)).toBe(0);
    expect(capBid(Number.NaN, 77)).toBe(0);
    expect(capBid(12.9, 77)).toBe(12);
  });
});

describe('一回合的結算', () => {
  it('每個人都付自己的出價，最高者得 1 枚標記', () => {
    const s = play(createAuction('quick', 4), 300, 0, 120, 5);
    expect(s.spent).toEqual([300, 0, 120, 5]);
    expect(s.tokens).toEqual([1, 0, 0, 0]);
    expect(s.history[0]).toEqual({ bids: [300, 0, 120, 5], winner: 0, top: 300 });
    expect(remaining(s, 0)).toBe(900);
    expect(remaining(s, 1)).toBe(1200);
  });

  it('放棄（0）不扣時間', () => {
    const s = play(createAuction('quick', 4), 0, 0, 0, 40);
    expect(s.spent).toEqual([0, 0, 0, 40]);
    expect(s.tokens).toEqual([0, 0, 0, 1]);
  });

  it('只有一人參加：照規則得標，付他自己按的秒數', () => {
    const s = play(createAuction('quick', 4), 0, 1, 0, 0);
    expect(s.history[0].winner).toBe(1);
    expect(s.history[0].top).toBe(1);
    expect(s.spent[1]).toBe(1);
  });

  it('最高出價同秒＝流標，同秒的人照樣付錢', () => {
    const s = play(createAuction('quick', 5), 250, 250, 100, 0, 30);
    expect(s.history[0].winner).toBeNull();
    expect(s.history[0].top).toBe(250);
    expect(s.tokens).toEqual([0, 0, 0, 0, 0]);
    expect(s.spent).toEqual([250, 250, 100, 0, 30]);
  });

  it('較低的出價同秒不影響', () => {
    expect(resolveBids([90, 40, 40, 0])).toEqual({ winner: 0, top: 90 });
  });

  it('所有人都放棄：流標，大螢幕停在 0', () => {
    const s = play(createAuction('quick', 4), 0, 0, 0, 0);
    expect(s.history[0]).toEqual({ bids: [0, 0, 0, 0], winner: null, top: 0 });
    expect(s.spent).toEqual([0, 0, 0, 0]);
  });

  it('超過剩餘時間的出價收成剩餘時間', () => {
    let s = play(createAuction('quick', 4), 1100, 0, 0, 0);
    s = play(s, 999, 0, 0, 50);
    // 第 0 席只剩 100，出 999 只算 100 —— 而且 100 > 50，照樣得標
    expect(s.history[1].bids[0]).toBe(100);
    expect(s.history[1].winner).toBe(0);
    expect(remaining(s, 0)).toBe(0);
    // 沒時間了：再怎麼出都是 0
    s = play(s, 500, 0, 0, 0);
    expect(s.history[2].bids[0]).toBe(0);
    expect(remaining(s, 0)).toBe(0);
  });

  it('出價數量不對、負數、NaN 丟錯', () => {
    const s = createAuction('quick', 4);
    expect(() => playRound(s, [1, 2, 3])).toThrow();
    expect(() => playRound(s, [1, 2, 3, -1])).toThrow();
    expect(() => playRound(s, [1, 2, 3, Number.NaN])).toThrow();
  });

  it('不改傳入的局面', () => {
    const s = createAuction('quick', 4);
    const before = JSON.stringify(s);
    play(s, 10, 20, 30, 40);
    expect(JSON.stringify(s)).toBe(before);
  });
});

describe('整局', () => {
  it('19 回合後結束，不能再出價', () => {
    let s = createAuction('quick', 4);
    for (let r = 1; r <= 19; r++) {
      expect(currentRound(s)).toBe(r);
      expect(isOver(s)).toBe(false);
      s = play(s, 10, 0, 0, 0);
    }
    expect(isOver(s)).toBe(true);
    expect(currentRound(s)).toBe(19);
    expect(s.tokens[0]).toBe(19);
    expect(() => play(s, 0, 0, 0, 0)).toThrow();
  });
});

describe('排名', () => {
  it('標記多的在前，同數比剩餘時間', () => {
    let s = createAuction('quick', 4);
    s = play(s, 100, 0, 0, 0); // 0 得標，剩 1100
    s = play(s, 0, 300, 0, 0); // 1 得標，剩 900
    s = play(s, 0, 0, 0, 50); //  3 得標，剩 1150
    s = play(s, 0, 0, 0, 10); //  3 得標，剩 1140
    expect(standings(s).map((r) => [r.seat, r.tokens, r.remaining, r.rank])).toEqual([
      [3, 2, 1140, 1],
      [0, 1, 1100, 2],
      [1, 1, 900, 3],
      [2, 0, 1200, 4],
    ]);
  });

  it('標記與剩餘時間都一樣就並列（1、1、3）', () => {
    let s = createAuction('quick', 4);
    s = play(s, 100, 0, 0, 0);
    s = play(s, 0, 100, 0, 0);
    expect(standings(s).map((r) => [r.seat, r.rank])).toEqual([[0, 1], [1, 1], [2, 3], [3, 3]]);
  });
});

describe('公開資訊', () => {
  it('只公開得標者與停下的秒數，不公開誰出了多少', () => {
    const s = play(createAuction('quick', 4), 300, 237, 0, 5);
    expect(publicHistory(s)).toEqual([{ winner: 0, top: 300 }]);
    // 自己知道自己剩多少
    expect(viewFor(s, 1).remaining).toBe(963);
    // 別人看不到第 1 席輸掉的 23.7 秒
    const v = viewFor(s, 2);
    expect(JSON.stringify(v)).not.toContain('237');
    expect(JSON.stringify(v)).not.toContain('963');
    expect(v).not.toHaveProperty('spent');
  });

  it('對手最多還剩多少＝預算 − 他公開得標過的秒數', () => {
    let s = createAuction('quick', 4);
    s = play(s, 300, 0, 0, 0);
    s = play(s, 0, 0, 120, 100); // 3 輸了，付的 100 不公開
    s = play(s, 250, 0, 0, 0);
    const h = publicHistory(s);
    expect(maxRemaining(1200, h, 0)).toBe(650);
    expect(maxRemaining(1200, h, 2)).toBe(1080);
    expect(maxRemaining(1200, h, 3)).toBe(1200); // 上限：真正只剩 1100
  });

  it('別人輸掉的出價不同、公開資訊相同時，電腦看到的完全一樣', () => {
    const a = play(createAuction('quick', 4), 300, 0, 80, 10);
    const b = play(createAuction('quick', 4), 300, 0, 5, 200);
    expect(viewFor(a, 1)).toEqual(viewFor(b, 1));
    for (const p of PERSONAS) expect(decideBid(viewFor(a, 1), p, 'hard', 42)).toBe(decideBid(viewFor(b, 1), p, 'hard', 42));
  });
});

describe('時間的寫法', () => {
  it('跟大螢幕一樣是 分:秒.十分之一秒', () => {
    expect(formatTenths(0)).toBe('0:00.0');
    expect(formatTenths(58)).toBe('0:05.8');
    expect(formatTenths(1498)).toBe('2:29.8');
    expect(formatTenths(2499)).toBe('4:09.9');
    expect(formatTenths(6000)).toBe('10:00.0');
  });
});

// ── 電腦出價者 ─────────────────────────────────────────────────────────

/** 依種子跑一整局：第 0 席照 human 出價，其餘是電腦。每一手都檢查電腦沒有超出預算 */
function runGame(seed: number, difficulty: Difficulty, human: (v: BidderView) => number, seats = 6, mode: 'quick' | 'show' = 'quick') {
  let s = createAuction(mode, seats);
  const personas = assignPersonas(seats - 1, seed);
  while (!isOver(s)) {
    const bids = [human(viewFor(s, 0))];
    personas.forEach((p, i) => {
      const v = viewFor(s, i + 1);
      const bid = decideBid(v, p, difficulty, seed);
      if (!Number.isInteger(bid) || bid < 0 || bid > v.remaining) throw new Error(`電腦出價超出範圍：${p} ${difficulty} ${bid} / ${v.remaining}`);
      bids.push(bid);
    });
    s = playRound(s, bids);
  }
  return s;
}

describe('電腦：個性', () => {
  it('四席以上四種個性各一，種子相同結果相同', () => {
    expect(new Set(assignPersonas(4, 7)).size).toBe(4);
    expect(new Set(assignPersonas(5, 7))).toEqual(new Set(PERSONAS));
    expect(new Set(assignPersonas(3, 7)).size).toBe(3);
    expect(assignPersonas(5, 123)).toEqual(assignPersonas(5, 123));
  });

  it('計畫的回合都在 1–19 之間、不重複；後發型與狙擊型一定押最後一回合', () => {
    for (let seed = 0; seed < 50; seed++) {
      for (const p of PERSONAS) {
        const t = planTargets(p, { seats: 6, rounds: 19 }, rngFor(seed));
        expect(new Set(t).size).toBe(t.length);
        expect(t.every((r) => r >= 1 && r <= 19)).toBe(true);
        if (p === 'lateBloomer' || p === 'sniper') expect(t[t.length - 1]).toBe(19);
      }
    }
  });

  it('同一個種子、同樣的公開資訊，出同樣的價', () => {
    const v = viewFor(createAuction('quick', 6), 3);
    for (const p of PERSONAS) expect(decideBid(v, p, 'normal', 99)).toBe(decideBid(v, p, 'normal', 99));
  });
});

describe('電腦：不會超出預算', () => {
  it('三個難度、兩種模式、4–6 席跑很多局，每一手都在 0 到剩餘時間之間', () => {
    for (const difficulty of ['easy', 'normal', 'hard'] as const) {
      for (let seed = 1; seed <= 40; seed++) {
        const seats = 4 + (seed % 3);
        const s = runGame(seed * 7919, difficulty, (v) => (seed % 2 ? v.remaining / (v.rounds - v.round + 1) : 0), seats, seed % 4 ? 'quick' : 'show');
        for (let seat = 0; seat < seats; seat++) expect(remaining(s, seat)).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('沒有時間就出 0', () => {
    const v: BidderView = { ...viewFor(createAuction('quick', 6), 2), remaining: 0 };
    for (const p of PERSONAS) for (const d of ['easy', 'normal', 'hard'] as const) expect(decideBid(v, p, d, 5)).toBe(0);
  });
});

describe('電腦：算帳型的必勝出價', () => {
  // 三位對手都公開得標過大筆時間：上限分別是 200、300、400
  let s = createAuction('quick', 4);
  s = play(s, 0, 1000, 0, 0);
  s = play(s, 0, 0, 900, 0);
  s = play(s, 0, 0, 0, 800);

  it('出「對手上限的最大值＋0.1 秒」，一定贏', () => {
    const v = viewFor(s, 0);
    expect(guaranteedBid(v)).toBe(401);
  });

  it('付不起就沒有必勝出價', () => {
    expect(guaranteedBid({ ...viewFor(s, 0), remaining: 400 })).toBeNull();
    expect(guaranteedBid(viewFor(createAuction('quick', 4), 0))).toBeNull();
  });

  it('三級的算帳型一看到就出必勝價', () => {
    for (let seed = 0; seed < 20; seed++) expect(decideBid(viewFor(s, 0), 'accountant', 'hard', seed)).toBe(401);
  });

  it('必勝價真的贏：對手全部梭哈也一樣', () => {
    const t = playRound(s, [401, 200, 300, 400]);
    expect(t.history[3].winner).toBe(0);
  });

  it('二級的算帳型只在最後三回合算', () => {
    let late = s;
    while (currentRound(late) < 17) late = play(late, 0, 0, 0, 0);
    expect(decideBid(viewFor(late, 0), 'accountant', 'normal', 3)).toBe(401);
  });
});

describe('電腦：難度', () => {
  /*
    「每回合固定出剩餘 ÷ 剩下回合」是最容易想到的打法。電腦如果只顧自己的計畫，
    一半的回合沒人認真搶，這招就能包下整局（調整前三級也有 93% 勝率）。
    三級要會從公開紀錄看出有人在撿便宜、跟著去搶；一級則應該擋不住。
  */
  const share = (v: BidderView) => v.remaining / (v.rounds - v.round + 1);
  const winRate = (difficulty: Difficulty) => {
    let wins = 0;
    for (let g = 0; g < 120; g++) {
      const seed = (g * 2654435761) >>> 0;
      if (standings(runGame(seed, difficulty, share)).find((r) => r.seat === 0)!.rank === 1) wins++;
    }
    return wins / 120;
  };

  it('三級不會被固定出價包下來，一級會', () => {
    expect(winRate('hard')).toBeLessThan(0.35);
    expect(winRate('easy')).toBeGreaterThan(0.7);
  });
});
