'use client';
import React from 'react';
import { LuCheck, LuRotateCcw } from 'react-icons/lu';
import type { Direction } from '@/types/chessboard';
import { useGameText } from '@/i18n/LocaleProvider';
import { fmt } from '@/i18n/content/game';

/**
 * 手機用的操作盤。
 *
 * 盤面上的落點與築牆預覽對手指都太小（實測牆的預覽只有 29x9，
 * WCAG 2.5.8 的最低觸控目標是 24px）。而四個方向各要 44px、
 * 格子卻只有 45px，純粹放大熱區只會讓四邊互相蓋住。
 *
 * 所以把整個回合搬到一個固定在拇指區的控制盤上，版面直接說明流程：
 *
 *        ▬▬▬        ← 外圈是牆
 *        [↑]        ← 內圈是移動
 *   ▌ [←](●)[→] ▐
 *        [↓]
 *        ▬▬▬
 *
 * 中間那顆點是你的棋子。箭頭在它旁邊＝移動，長條在箭頭外面＝在那一邊築牆。
 * 位置關係本身就是說明，不需要圖例。
 *
 * 一個回合固定兩步：先移動（可以不動），再選一道牆，然後按 ✓ 送出。
 * ✗ 把這一回合整個倒回開始前 —— 走錯一步不該就這樣交出去。
 * 送出前什麼都還沒定案，所以怎麼點都不會把回合白白浪費掉。
 *
 * 只在 pointer: coarse 出現；滑鼠仍然直接點盤面。
 */
type Props = {
  legal: Record<Direction, boolean>;
  /** 四個方向能不能移動（一步） */
  movable: Record<Direction, boolean>;
  pending: Direction | null;
  onPick: (dir: Direction) => void;
  onMove: (dir: Direction) => void;
  onConfirm: () => void;
  /** 把這一回合倒回開始前 */
  onRedo: () => void;
  /** 這一回合已經動過（決定「重來」要不要啟用） */
  dirty: boolean;
  remainSteps: number;
  color: string;
};

const ARROW: Record<Direction, string> = {
  top: 'M12 5v14M5 12l7-7 7 7',
  bottom: 'M12 19V5M5 12l7 7 7-7',
  left: 'M19 12H5M12 5l-7 7 7 7',
  right: 'M5 12h14M12 5l7 7-7 7',
};

/** 方向鍵：內圈，移動。 */
const MOVE_POS: Record<Direction, string> = {
  top: 'col-start-3 row-start-2', bottom: 'col-start-3 row-start-4',
  left: 'col-start-2 row-start-3', right: 'col-start-4 row-start-3',
};
/** 牆：外圈，長條狀 —— 形狀本身就是一道牆。 */
const WALL_POS: Record<Direction, string> = {
  top: 'col-start-3 row-start-1', bottom: 'col-start-3 row-start-5',
  left: 'col-start-1 row-start-3', right: 'col-start-5 row-start-3',
};
const WALL_BAR: Record<Direction, string> = {
  top: 'h-[6px] w-8', bottom: 'h-[6px] w-8', left: 'h-8 w-[6px]', right: 'h-8 w-[6px]',
};

const DIRS: Direction[] = ['top', 'bottom', 'left', 'right'];

/**
 * 控制盤現在該不該出現。
 *
 * 抽出來是因為有兩個地方要知道：Chessboard 決定要不要畫它，
 * PlayClient 要把底部的狀態膠囊往上讓位。兩邊各寫一份遲早會漂掉，
 * 而漂掉的症狀是膠囊被壓在控制盤後面 —— 不會壞、只會醜。
 */
export const wallPadVisible = (o: {
  coarse: boolean; locked: boolean; placing: boolean; hasSelection: boolean;
}) => o.coarse && !o.locked && !o.placing && o.hasSelection;

export default function WallDirectionPad({
  legal, movable, pending, onPick, onMove, onConfirm, onRedo, dirty, remainSteps, color,
}: Props) {
  const g = useGameText();
  if (!DIRS.some((d) => legal[d] || movable[d])) return null;

  const moveLabel: Record<Direction, string> = {
    top: g.pad.moveUp, bottom: g.pad.moveDown, left: g.pad.moveLeft, right: g.pad.moveRight,
  };
  const wallLabel: Record<Direction, string> = {
    top: g.pad.wallUp, bottom: g.pad.wallDown, left: g.pad.wallLeft, right: g.pad.wallRight,
  };

  // 目前在哪一步，決定提示文字與兩顆步驟標的亮暗
  const onWallStep = pending !== null;
  const hint = onWallStep ? g.pad.hintReady : remainSteps > 0 ? g.pad.hintMove : g.pad.hintWall;

  return (
    <div className="bg-primary-50/95 fixed inset-x-0 bottom-0 z-40 border-t-2 border-tile-ink/10 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur">
      {/* 步驟指示。兩步固定順序，目前在哪一步就亮哪一個 —— 這比任何說明文字
          都直接，而且它一直在，不是只在做錯時才出現。 */}
      <div className="mb-1.5 flex items-center justify-center gap-2 text-xs font-black">
        <span className={`rounded-full px-2.5 py-1 ${!onWallStep ? 'text-tile-cream' : 'bg-tile-ink/[0.07] text-ink-soft'}`}
              style={!onWallStep ? { backgroundColor: color } : undefined}>
          {g.pad.step1}
          {remainSteps > 0 && !onWallStep && (
            <span className="ml-1 font-bold opacity-80">{fmt(g.pad.remain, { n: remainSteps })}</span>
          )}
        </span>
        <span className="text-ink-soft/40">›</span>
        <span className={`rounded-full px-2.5 py-1 ${onWallStep ? 'text-tile-cream' : 'bg-tile-ink/[0.07] text-ink-soft'}`}
              style={onWallStep ? { backgroundColor: color } : undefined}>
          {g.pad.step2}
        </span>
      </div>

      <p className="mb-2 text-center text-xs font-bold text-ink-soft">{hint}</p>

      <div className="flex items-center justify-center gap-3 px-4">
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
              disabled={!movable[dir]}
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
              disabled={!legal[dir]}
              aria-label={wallLabel[dir]}
              aria-pressed={pending === dir}
              onClick={() => onPick(dir)}
              className={`${WALL_POS[dir]} grid place-items-center rounded-lg transition enabled:active:scale-95 disabled:opacity-15 ${
                pending === dir ? '' : 'bg-tile-ink/[0.04]'
              }`}
              style={pending === dir ? { backgroundColor: `${color}22` } : undefined}
            >
              <span
                className={`block rounded-full ${WALL_BAR[dir]}`}
                style={{ backgroundColor: pending === dir ? color : 'rgb(var(--tile-ink) / 0.25)' }}
              />
            </button>
          ))}

          {/* 中央是你的棋子。箭頭圍著它＝移動，長條在更外圈＝在那一邊築牆。 */}
          <span className="col-start-3 row-start-3 grid place-items-center" aria-hidden="true">
            <span className="block size-6 rounded-full" style={{ backgroundColor: color }} />
          </span>
        </div>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            disabled={!pending}
            aria-label={g.pad.done}
            onClick={onConfirm}
            className="grid size-12 place-items-center rounded-xl bg-tile-ink text-2xl text-tile-cream transition enabled:active:scale-95 disabled:opacity-20"
          >
            <LuCheck />
          </button>
          <button
            type="button"
            disabled={!dirty}
            aria-label={g.pad.redo}
            onClick={onRedo}
            className="grid size-12 place-items-center rounded-xl bg-tile-ink/[0.07] text-xl text-ink-soft transition enabled:active:scale-95 disabled:opacity-20"
          >
            <LuRotateCcw />
          </button>
        </div>
      </div>
    </div>
  );
}
