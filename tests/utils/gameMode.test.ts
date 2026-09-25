import { describe, expect, it } from 'vitest';
import { gameHash, parseGameHash, readGameHash, toPlayersNum, roomShareUrl, parseOnlineHash, newRoomHash } from '@/utils/gameMode';
import { LOCALES } from '@/i18n/locales';

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

describe('roomShareUrl', () => {
  const ORIGIN = 'https://quoridorgame.com';

  it('指向 /online 而不是舊的 /match 相容層', () => {
    expect(roomShareUrl(ORIGIN, 'zh-TW', 'r')).not.toContain('/match');
    expect(roomShareUrl(ORIGIN, 'ja', 'r')).not.toContain('/match');
  });

  it('zh-TW 不加前綴', () => {
    expect(roomShareUrl(ORIGIN, 'zh-TW', 'abc123')).toBe(
      'https://quoridorgame.com/online#roomId=abc123'
    );
  });

  it('其他語系帶著自己的前綴 —— 朋友點進來不會落在中文站', () => {
    expect(roomShareUrl(ORIGIN, 'ja', 'abc123')).toBe(
      'https://quoridorgame.com/ja/online#roomId=abc123'
    );
    expect(roomShareUrl(ORIGIN, 'ko', 'abc123')).toBe(
      'https://quoridorgame.com/ko/online#roomId=abc123'
    );
    expect(roomShareUrl(ORIGIN, 'en', 'abc123')).toBe(
      'https://quoridorgame.com/en/online#roomId=abc123'
    );
  });

  it('四個語系各自產生不同的連結', () => {
    const urls = LOCALES.map((l) => roomShareUrl(ORIGIN, l, 'r'));
    expect(new Set(urls).size).toBe(LOCALES.length);
  });

  it('roomId 原樣帶過去（Firebase push key 含 - 與 _）', () => {
    expect(roomShareUrl(ORIGIN, 'zh-TW', '-OaB_c12XyZ')).toContain('#roomId=-OaB_c12XyZ');
  });
});

describe('連線頁的 hash', () => {
  /*
    首頁連線磁磚現在帶 `#new=2` 過去，由連線頁開房。
    這裡解析錯的症狀是「按了連線卻顯示連結不完整」或「進了別人的房」，
    在元件裡看不出來。
  */
  it('#roomId=… 是進既有的房', () => {
    expect(parseOnlineHash('#roomId=-Abc123')).toEqual({ roomId: '-Abc123' });
  });

  it('#new=2 / #new=3 是開新房', () => {
    expect(parseOnlineHash('#new=2')).toEqual({ create: 2 });
    expect(parseOnlineHash('#new=3')).toEqual({ create: 3 });
  });

  it('roomId 優先於 new（開完房換網址時兩個不會同時出現，但就算有也不能再開一間）', () => {
    expect(parseOnlineHash('#new=2&roomId=-X')).toEqual({ roomId: '-X' });
  });

  it('看不懂的一律 invalid：空的、被截斷的、人數不合法的', () => {
    for (const h of ['', '#', '#roomId=', '#new=4', '#new=', '#hello']) {
      expect(parseOnlineHash(h)).toEqual({ invalid: true });
    }
  });

  it('newRoomHash 產出的東西 parseOnlineHash 認得', () => {
    expect(parseOnlineHash(newRoomHash(2))).toEqual({ create: 2 });
    expect(parseOnlineHash(newRoomHash(3))).toEqual({ create: 3 });
  });
});
