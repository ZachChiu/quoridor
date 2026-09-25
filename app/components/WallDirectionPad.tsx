'use client';
import React from 'react';
import { LuCheck, LuRotateCcw, LuFlag, LuHammer } from 'react-icons/lu';
import type { Direction } from '@/types/chessboard';
import { useGameText } from '@/i18n/LocaleProvider';
import TurnGuide from './TurnGuide';

/**
 * 手機用的操作盤。
 *
 * 盤面上的落點與築牆預覽對手指都太小（實測牆的預覽只有 29x9，
 * WCAG 2.5.8 的最低觸控目標是 24px）。而四個方向各要 44px、
 * 格子卻只有 45px，純粹放大熱區只會讓四邊互相蓋住。
 *
 * 版面本身就是說明：
 *
 *        ▬▬▬        ← 外圈長條 = 牆
 *        [↑]        ← 內圈箭頭 = 移動
 *   ▌ [←](●)[→] ▐
 *        [↓]
 *        ▬▬▬
 *
 * ── 兩個刻意的決定 ─────────────────────────────────────────────
 *
 * **一直在，不是選了棋子才出現。** 先前是選取後才升起，於是每按一下
 * 棋子整個版面就往上推一次 —— 棋盤大小變、位置變，剛才看準的那一格
 * 跑掉了。現在從開局到終局都佔著同一塊空間，按鈕該停用就停用。
 * 版面穩定比省那塊空間重要得多。
 *
 * **橫式改放右側。** 手機橫躺時高度只剩約 390px，底部的 272px 會吃掉
 * 七成畫面。改成直向排在右邊，棋盤才有地方站。
 */
type Props = {
  /** 開局擺子階段：整組停用，只顯示提示 */
  placing: boolean;
  /** 有沒有選中棋子 */
  selected: boolean;
  movable: Record<Direction, boolean>;
  buildable: Record<Direction, boolean>;
  /** 四個方向上有沒有「可以打破」的牆（三人局限定） */
  breakable: Record<Direction, boolean>;
  /** 還剩幾次破牆（0 = 用完了，undefined = 這局沒有破牆規則） */
  breaksLeft?: number;
  pending: Direction | null;
  onPick: (dir: Direction) => void;
  onMove: (dir: Direction) => void;
  onBreak: (dir: Direction) => void;
  onConfirm: () => void;
  onRedo: () => void;
  /** 投降 —— 由上層開確認 Modal，這裡只負責按鈕 */
  onSurrender: () => void;
  dirty: boolean;
  color: string;
  /** 現在是不是我的回合 */
  myTurn: boolean;
  remainSteps: number;
  /**
   * 破牆模式。狀態放在 PlayClient 而不是這裡 ——
   * 步驟提示（TurnGuide）現在排在棋盤與控制盤中間、由 PlayClient 渲染，
   * 它也要知道現在是不是在挑要破的牆。同一件事兩個地方各存一份遲早對不上。
   */
  breakMode: boolean;
  onToggleBreak: () => void;
  /** 移動已經結束，只剩蓋牆。同樣由 PlayClient 算（它手上有 pending 與 legalMoves）。 */
  onWallStep: boolean;
  /** 中央那顆棋子可不可以按（有沒有別顆可換） */
  canSwitch: boolean;
  /** 換到下一顆能選的棋子。沒選的時候就是選第一顆 */
  onSwitchPiece: () => void;
};

const ARROW: Record<Direction, string> = {
  top: 'M12 5v14M5 12l7-7 7 7',
  bottom: 'M12 19V5M5 12l7 7 7-7',
  left: 'M19 12H5M12 5l-7 7 7 7',
  right: 'M5 12h14M12 5l7 7-7 7',
};
const MOVE_POS: Record<Direction, string> = {
  top: 'col-start-3 row-start-2', bottom: 'col-start-3 row-start-4',
  left: 'col-start-2 row-start-3', right: 'col-start-4 row-start-3',
};
const WALL_POS: Record<Direction, string> = {
  top: 'col-start-3 row-start-1', bottom: 'col-start-3 row-start-5',
  left: 'col-start-1 row-start-3', right: 'col-start-5 row-start-3',
};
const WALL_BAR: Record<Direction, string> = {
  top: 'h-[6px] w-8', bottom: 'h-[6px] w-8', left: 'h-8 w-[6px]', right: 'h-8 w-[6px]',
};
/*
  ✓ / ↺ / 🔨 放在**九宮格的四個角**。

  九宮格＝四個箭頭與中央棋子圍出來的 3x3（格線的第 2~4 列與第 2~4 欄），
  它的四個角原本是空的。牆的長條在更外面一圈，所以這三顆夾在
  「移動」與「築牆」之間，位置上正好對應它們的角色：
  都是對這一手的操作，而不是方向。

  ✓ 與 ↺ 是一組（送出／收回），並排在下面兩角；🔨 放右上、🏳 放左上。

  上面兩角是「這一局」的事（破牆、投降），下面兩角是「這一手」的事
  （重來、完成）—— 離手指近的那一排才是每回合都會按的。

  先前放在最外圈的四角，離十字太遠，看起來仍然是另外一組東西。
*/
const CORNER = {
  surrender: 'col-start-2 row-start-2',
  hammer: 'col-start-4 row-start-2',
  redo: 'col-start-2 row-start-4',
  confirm: 'col-start-4 row-start-4',
} as const;
const DIRS: Direction[] = ['top', 'bottom', 'left', 'right'];

export default function WallDirectionPad({
  placing, selected, movable, buildable, breakable, breaksLeft,
  pending, onPick, onMove, onBreak, onConfirm, onRedo, onSurrender, dirty, color, myTurn, remainSteps,
  breakMode, onToggleBreak, onWallStep, canSwitch, onSwitchPiece,
}: Props) {
  const g = useGameText();

  const canBreakAny = breaksLeft !== undefined && breaksLeft > 0 && DIRS.some((d) => breakable[d]);
  // 破牆模式下外圈代表「可以打破的牆」而不是「可以蓋的位置」
  const active = breakMode ? breakable : buildable;
  const onOuter = breakMode ? onBreak : onPick;

  const moveLabel: Record<Direction, string> = {
    top: g.pad.moveUp, bottom: g.pad.moveDown, left: g.pad.moveLeft, right: g.pad.moveRight,
  };
  /*
    破牆模式下外圈那四顆做的是「打破牆」，不是「蓋牆」—— 標籤要跟著換。
    不換的話讀屏會唸「在上方築牆」，而按下去其實是把上方的牆打掉，
    那是唯一一個不可逆的操作，唸錯的代價特別大。
  */
  const wallLabel: Record<Direction, string> = breakMode
    ? { top: g.pad.breakUp, bottom: g.pad.breakDown, left: g.pad.breakLeft, right: g.pad.breakRight }
    : { top: g.pad.wallUp, bottom: g.pad.wallDown, left: g.pad.wallLeft, right: g.pad.wallRight };

  return (
    <div
      /*
        `hidden coarse:block` —— 出不出現由 CSS 決定，不由 JS。

        先前是用 useCoarsePointer() 在 render 時決定要不要掛這個元件。
        靜態匯出的 HTML 不知道裝置是什麼，那個值在 hydration 之前一律是
        false，於是手機一重整就會先畫出一次沒有控制盤的桌機版面、
        接著整個版面再跳一次。改成 media query 就沒有「之前」——
        第一幀就已經是對的。
      */
      className="bg-primary-50/95 fixed inset-x-0 bottom-0 z-40 hidden
                 h-[var(--wall-pad-h)] border-t-2 border-tile-ink/10 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2.5 backdrop-blur
                 coarse:block
                 coarse-land:inset-y-0 coarse-land:left-auto coarse-land:right-0 coarse-land:flex coarse-land:h-auto
                 coarse-land:w-[var(--wall-pad-w)] coarse-land:flex-col coarse-land:justify-center coarse-land:border-l-2
                 coarse-land:border-t-0 coarse-land:pb-2 coarse-land:pr-[max(0.5rem,env(safe-area-inset-right))]"
    >
      {/* 橫式的提示收在控制盤內部頂端（那是這欄的標籤）。
          直式的那顆由 PlayClient 排在棋盤與控制盤中間的文件流裡，
          所以這顆在直式要隱藏 —— 同一個元件、兩個掛載點。 */}
      <TurnGuide
        className="hidden landscape:absolute landscape:inset-x-0 landscape:top-3 landscape:flex"
        placing={placing}
        myTurn={myTurn}
        selected={selected}
        onWallStep={onWallStep}
        breakMode={breakMode}
        remainSteps={remainSteps}
        color={color}
      />

      <div className="flex items-center justify-center gap-3 px-4 landscape:flex-col landscape:gap-2 landscape:px-2">
        <div
          className="grid gap-1"
          style={{ gridTemplateColumns: '26px 44px 44px 44px 26px', gridTemplateRows: '26px 44px 44px 44px 26px' }}
          role="group"
          aria-label={g.pad.heading}
        >
          {DIRS.map((dir) => (
            <button
              key={`m-${dir}`}
              type="button"
              disabled={placing || !selected || breakMode || !movable[dir]}
              aria-label={moveLabel[dir]}
              onClick={() => onMove(dir)}
              className={`${MOVE_POS[dir]} grid place-items-center rounded-xl bg-tile-ink/[0.07] text-tile-ink transition enabled:active:scale-95 disabled:opacity-20`}
            >
              <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d={ARROW[dir]} />
              </svg>
            </button>
          ))}

          {DIRS.map((dir) => (
            <button
              key={`w-${dir}`}
              type="button"
              disabled={placing || !selected || !active[dir]}
              aria-label={wallLabel[dir]}
              aria-pressed={pending === dir}
              onClick={() => onOuter(dir)}
              className={`${WALL_POS[dir]} grid place-items-center rounded-lg transition enabled:active:scale-95 disabled:opacity-15 ${
                pending === dir ? '' : 'bg-tile-ink/[0.04]'
              }`}
              style={pending === dir ? { backgroundColor: `${color}22` } : undefined}
            >
              <span
                className={`block rounded-full ${WALL_BAR[dir]}`}
                style={{
                  backgroundColor: breakMode
                    ? 'rgb(var(--tile-red))'
                    : pending === dir ? color : 'rgb(var(--tile-ink) / 0.25)',
                }}
              />
            </button>
          ))}

          {/* 投降放左上角。和破牆同一排 —— 都是「對整局」而不是「對這一手」
              的操作，而且都不可逆，所以兩顆都會再跳一次確認。 */}
          <button
            type="button"
            disabled={placing || !myTurn}
            aria-label={g.surrender.label}
            onClick={onSurrender}
            className={`${CORNER.surrender} grid size-11 place-items-center rounded-xl bg-tile-ink/[0.07] text-xl text-ink-soft transition enabled:active:scale-95 disabled:opacity-20`}
          >
            <LuFlag />
          </button>
          <button
            type="button"
            disabled={!pending}
            aria-label={g.pad.done}
            onClick={onConfirm}
            className={`${CORNER.confirm} grid size-11 place-items-center rounded-xl bg-tile-ink text-2xl text-tile-cream transition enabled:active:scale-95 disabled:opacity-20`}
          >
            <LuCheck />
          </button>
          <button
            type="button"
            disabled={!dirty}
            aria-label={g.pad.redo}
            onClick={onRedo}
            className={`${CORNER.redo} grid size-11 place-items-center rounded-xl bg-tile-ink/[0.07] text-xl text-ink-soft transition enabled:active:scale-95 disabled:opacity-20`}
          >
            <LuRotateCcw />
          </button>
          {/* 破牆只有三人局有，所以這顆只在那時才佔位置。
              按下去之後外圈的長條改代表「可以打破的牆」（染成磚紅），
              再按一下退出 —— 不做成一次性的動作，因為選錯牆的代價是
              整局唯一的一次機會。 */}
          {/* 兩人局沒有破牆，但那一角空著會讓九宮格看起來缺了一塊 ——
              四個角只剩三個有東西，十字的形狀就散了。補一塊同樣大小、
              同樣底色但更淡的空位：看得出「這裡有個位置，只是這一局用不到」，
              而它不是按鈕（不可點、不進焦點、讀屏不念）。 */}
          {breaksLeft === undefined && (
            <span
              className={`${CORNER.hammer} size-11 rounded-xl bg-tile-ink/[0.03]`}
              aria-hidden="true"
            />
          )}
          {breaksLeft !== undefined && (
            <button
              type="button"
              disabled={!canBreakAny}
              aria-label={breaksLeft > 0 ? g.pad.breakWall : g.pad.breakNone}
              aria-pressed={breakMode}
              onClick={onToggleBreak}
              className={`${CORNER.hammer} grid size-11 place-items-center rounded-xl text-xl transition enabled:active:scale-95 disabled:opacity-20 ${
                breakMode ? 'bg-tile-red text-tile-cream' : 'bg-tile-ink/[0.07] text-ink-soft'
              }`}
            >
              <LuHammer />
            </button>
          )}

          {/*
            中央這顆棋子可以按：按一下選第一顆，再按就換下一顆（依棋子編號輪流）。
            手機上不必再去點盤面上那顆小小的棋子 —— 整個回合都可以在控制盤上完成。
            點盤面的方式照舊保留。

            規則跟點盤面一樣：走過之後就不能換（要換請按重來）、被圍死的棋子跳過。
            沒得換的時候停用，外觀退回原本那顆只是指示顏色的點。
            可以按的時候外面多一圈同色的淡環 —— 平塗語彙裡「這是個按鈕」的暗示，
            不加陰影也不加描邊；已經選了一顆的時候外圈深一點。
          */}
          <button
            type="button"
            disabled={!canSwitch}
            aria-label={selected ? g.pad.switchPiece : g.pad.pickPiece}
            onClick={onSwitchPiece}
            className="col-start-3 row-start-3 grid place-items-center rounded-full transition enabled:active:scale-90"
          >
            <span
              className="grid size-10 place-items-center rounded-full transition-colors"
              style={{ backgroundColor: canSwitch ? `color-mix(in srgb, ${color} ${selected ? 28 : 16}%, transparent)` : 'transparent' }}
            >
              {/* 開局擺子時不畫：那時控制盤整組停用，中央浮一顆淡色棋子
                  看起來像在暗示「要把棋子放在這裡」（Zach 回報，不要）。
                  其餘時候一律實色，不再用淡色表示「還沒選」—— 淡色棋子
                  讀起來就是預覽／提示。選了沒選改由外圈的深淺表示。 */}
              {!placing && (
                <span className="block size-6 rounded-full" style={{ backgroundColor: color }} />
              )}
            </span>
          </button>
        </div>

      </div>
    </div>
  );
}
