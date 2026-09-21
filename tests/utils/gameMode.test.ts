import { describe, expect, it } from 'vitest';
import { gameHash, parseGameHash, readGameHash, toPlayersNum } from '@/utils/gameMode';

/*
  對局模式怎麼寫進網址、怎麼讀回來。

  這一組存在的理由是：先前人數只活在 GameContext 的 React state，
  重整一次三人局就變成兩人盤 —— 網址上完全沒有「這是哪一種對局」的資訊。
  人數後來改走真的路由（/local/3），難度仍然走 hash（/solo#hard）。
*/
describe('toPlayersNum：路由片段 → 人數', () => {
  it("只有 '3' 是三人，其餘一律兩人", () => {
    expect(toPlayersNum('3')).toBe(3);
    expect(toPlayersNum('2')).toBe(2);
  });

  it('看不懂的值不該讓頁面爆掉，一律退回兩人', () => {
    for (const bad of ['', '0', '4', 'three', '3人', '../../etc', undefined]) {
      expect(toPlayersNum(bad)).toBe(2);
    }
  });
});

describe('gameHash：模式 → hash', () => {
  it('沒有任何模式就不加 hash —— 網址不該多一個裸的 #', () => {
    expect(gameHash({})).toBe('');
  });

  it('難度與人數各自成立', () => {
    expect(gameHash({ aiDifficulty: 'hard' })).toBe('#hard');
    expect(gameHash({ playersNum: 3 })).toBe('#3p');
  });

  it('兩個都有時用 - 串起來', () => {
    expect(gameHash({ playersNum: 3, aiDifficulty: 'easy' })).toBe('#3p-easy');
  });
});

describe('parseGameHash：hash → 模式', () => {
  it('帶不帶 # 都認得', () => {
    expect(parseGameHash('#3p')).toEqual({ playersNum: 3 });
    expect(parseGameHash('3p')).toEqual({ playersNum: 3 });
  });

  it('三種難度都認得', () => {
    for (const d of ['easy', 'normal', 'hard'] as const) {
      expect(parseGameHash(`#${d}`)).toEqual({ aiDifficulty: d });
    }
  });

  it('看不懂的片段直接忽略，不會連帶吃掉認得的那些', () => {
    expect(parseGameHash('#3p-garbage-hard')).toEqual({ playersNum: 3, aiDifficulty: 'hard' });
    expect(parseGameHash('#roomId=abc')).toEqual({});
    expect(parseGameHash('')).toEqual({});
  });

  it('gameHash 與 parseGameHash 互為反函式', () => {
    for (const mode of [
      { playersNum: 2 as const },
      { playersNum: 3 as const },
      { aiDifficulty: 'normal' as const },
      { playersNum: 3 as const, aiDifficulty: 'hard' as const },
    ]) {
      expect(parseGameHash(gameHash(mode))).toEqual(mode);
    }
  });
});

describe('readGameHash：伺服器端不能炸', () => {
  it('沒有 window 時回空物件（靜態產生時會走到）', () => {
    // vitest 的 environment 是 node，本來就沒有 window
    expect(typeof window).toBe('undefined');
    expect(readGameHash()).toEqual({});
  });
});
