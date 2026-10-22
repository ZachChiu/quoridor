import type React from 'react';
import type { WipePhase } from './WipeOverlay';

/**
 * 各款遊戲自己的進場：從平台卡片點進去的那一下。
 *
 * Wall Go 是磁磚脹開、虎羊棋是木窗門（WipeOverlay 的 doors）；其他遊戲原本全部共用 Wall Go 的色塊，
 * 2026-10-22 Zach：「為啥每一個進場都跟 Wall Go 一樣，可以有不同花樣嗎」。
 * 第二批五款各自一條分支、一款一款上線，所以進場不寫進 WipeOverlay：每款在自己的資料夾放一個 Entrance.tsx，
 * 在下面的表打開自己那一行；catalog 的 look.entrance 帶著同一個 id，平台卡片點下去就照表播。
 *
 * 表裡每一行之間隔一行空行：五條分支各改各的那一行，依序合併時 git 才不會衝突（同 catalog.ts）。
 */
export type EntranceScene = {
  /**
   * 轉場層裡畫的東西。第一格就要是這個階段的起點：cover 前是「還沒蓋上」、uncover 前是「已經蓋滿」——
   * 等 effect 跑起來才設的話，會先閃一格錯的畫面（同 WipeOverlay 色塊的理由）。
   */
  Scene: React.FC<{ phase: WipePhase }>;
  /**
   * 這個階段的動畫，一律交給 element.animate()，只動 transform 與 opacity：uncover 播的時候
   * React 正在畫新頁面、主執行緒被佔住，合成執行緒跑的動畫才不會卡（CLAUDE.md〈換頁轉場〉）。
   * 回傳的動畫全部播完就算這個階段結束；cover 要在 2 秒內播完（TransitionContext 的保險）。
   */
  play: (root: HTMLElement, phase: WipePhase) => Animation[];
};

const LOADERS: Record<string, () => Promise<{ default: EntranceScene }>> = {
  // 時間拍賣（feat/game-time-auction 打開這一行）

  // 九子棋（feat/game-nine-mens-morris 打開這一行）

  // 盲眼五子棋（feat/game-blind-gomoku 打開這一行）

  // 騎士巡邏（feat/game-knights-tour 打開這一行）

  // 均衡曼卡拉（feat/game-balance-mancala 打開這一行）
};

const ready = new Map<string, EntranceScene>();
const pending = new Set<string>();

/** 先把那款的進場載起來（平台卡片在閒置時呼叫）。失敗不處理：點下去時退回色塊，下次再試。 */
export function preloadEntrance(id: string): void {
  const load = LOADERS[id];
  if (!load || ready.has(id) || pending.has(id)) return;
  pending.add(id);
  load()
    .then((m) => { ready.set(id, m.default); })
    .catch(() => {})
    .finally(() => { pending.delete(id); });
}

/** 已經載好的進場。還沒載好就是 undefined —— 呼叫端退回色塊、不等（等了按起來像沒按到）。 */
export const entranceOf = (id: string): EntranceScene | undefined => ready.get(id);
