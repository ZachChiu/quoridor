/**
 * 連線模式下，這一刻該不該把本地棋譜寫回房間。
 *
 * 抽出來是因為這裡曾經有一個**安靜的**錯誤：連線三人房一定會變成兩人局。
 *
 * 成因是兩個 effect 在掛載時搶跑。連線模式的初始 state 是寫死的
 * `createGame(2)`（那時還不知道房間是幾人局，要等 Firebase 回來才知道），
 * 而寫入 effect 在第一次 render 就會跑 —— `room` 還是 null 的那一瞬間，
 * 它把本地這份兩人棋譜蓋掉了房間原本的 `"3|||"`。接著讀取 effect 看到的
 * 已經是自己剛寫的內容，於是永遠不會重播房間真正的棋譜。
 *
 * 症狀特別難抓：三個客戶端**一致地錯**，畫面同步、沒有任何錯誤訊息，
 * 一局可以完整打完 38 手。只有去數「盤上有幾顆棋子、有幾種顏色」才看得出來。
 *
 * 規則因此只有一條：**沒讀到房間的棋譜之前，一個字都不准寫回去。**
 */
export function shouldPushWgf(o: {
  isOnline: boolean;
  /** 已經套用過至少一次來自房間的棋譜 */
  syncedFromRoom: boolean;
  /** 本地目前的棋譜 */
  localWgf: string;
  /** 最後一次「套用或寫出」的棋譜。用來擋掉自己寫入所觸發的重播（echo） */
  lastApplied: string;
}): boolean {
  if (!o.isOnline) return false;
  if (!o.syncedFromRoom) return false;
  return o.localWgf !== o.lastApplied;
}
