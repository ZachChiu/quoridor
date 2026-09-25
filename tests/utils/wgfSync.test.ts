import { describe, expect, it } from 'vitest';
import { shouldPushWgf } from '@/utils/wgfSync';
import { createGame, toWgf } from '@/game/engine';

/*
  這一組鎖住的是一個**安靜的**錯誤：連線三人房一定會變成兩人局。

  連線模式的初始 state 是寫死的 createGame(2)（掛載時還不知道房間幾人），
  而寫入 effect 在第一次 render 就會跑 —— 它把本地那份兩人棋譜蓋掉房間
  原本的 "3|||"，之後讀取 effect 看到的已經是自己剛寫的，於是永遠不會
  重播房間真正的棋譜。

  三個客戶端會**一致地錯**：畫面同步、零錯誤訊息、一局能完整打完 38 手。
  只有去數盤上的棋子顏色才看得出來。
*/
describe('shouldPushWgf：什麼時候可以把本地棋譜寫回房間', () => {
  const twoP = toWgf(createGame(2));
  const threeP = toWgf(createGame(3));

  it('本機模式永遠不寫', () => {
    expect(shouldPushWgf({ isOnline: false, syncedFromRoom: true, localWgf: twoP, lastApplied: '' })).toBe(false);
  });

  it('**還沒讀到房間的棋譜就不准寫** —— 這就是三人局變兩人局的那一步', () => {
    expect(shouldPushWgf({
      isOnline: true,
      syncedFromRoom: false,
      localWgf: twoP,          // 掛載時的預設兩人盤
      lastApplied: '',
    })).toBe(false);
  });

  it('讀到房間之後，內容有變才寫', () => {
    expect(shouldPushWgf({ isOnline: true, syncedFromRoom: true, localWgf: threeP, lastApplied: '' })).toBe(true);
  });

  it('和最後套用的一樣就不寫 —— 擋掉自己寫入觸發的重播', () => {
    expect(shouldPushWgf({ isOnline: true, syncedFromRoom: true, localWgf: threeP, lastApplied: threeP })).toBe(false);
  });

  it('兩人與三人的初始棋譜本來就不一樣，所以蓋錯會真的蓋掉內容', () => {
    expect(twoP).not.toBe(threeP);
    expect(threeP).toBe('3|||');
  });
});
