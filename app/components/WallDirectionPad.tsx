'use client';
import React, { useState } from 'react';
import { LuCheck, LuRotateCcw, LuHammer } from 'react-icons/lu';
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
const DIRS: Direction[] = ['top', 'bottom', 'left', 'right'];

/**
 * 控制盤現在該不該出現。
 *
 * 只看「是不是手指裝置」與「牌局有沒有結束」—— 刻意**不**看有沒有
 * 選中棋子。看了的話它就會忽隱忽現，而每一次出現都把版面推一次。
 */
export const wallPadVisible = (o: { coarse: boolean; locked: boolean }) =>
  o.coarse && !o.locked;

export default function WallDirectionPad({
  placing, selected, movable, buildable, breakable, breaksLeft,
  pending, onPick, onMove, onBreak, onConfirm, onRedo, dirty, remainSteps, color,
}: Props) {
  const g = useGameText();
  const [breakMode, setBreakMode] = useState(false);

  const canBreakAny = breaksLeft !== undefined && breaksLeft > 0 && DIRS.some((d) => breakable[d]);
  // 破牆模式下外圈代表「可以打破的牆」而不是「可以蓋的位置」
  const active = breakMode ? breakable : buildable;
  const onOuter = breakMode ? onBreak : onPick;

  // 沒得破牆時自動退出破牆模式 —— 留在一個什麼都按不了的模式裡最令人困惑
  if (breakMode && !canBreakAny) setBreakMode(false);

  const moveLabel: Record<Direction, string> = {
    top: g.pad.moveUp, bottom: g.pad.moveDown, left: g.pad.moveLeft, right: g.pad.moveRight,
  };
  const wallLabel: Record<Direction, string> = {
    top: g.pad.wallUp, bottom: g.pad.wallDown, left: g.pad.wallLeft, right: g.pad.wallRight,
  };

  const onWallStep = pending !== null;
  const hint = placing ? g.pad.hintPlace
    : !selected ? g.pad.hintWait
    : breakMode ? g.pad.breakPick
    : onWallStep ? g.pad.hintReady
    : remainSteps > 0 ? g.pad.hintMove
    : g.pad.hintWall;

  const stepChip = (label: string, on: boolean, extra?: React.ReactNode) => (
    <span
      className={`rounded-full px-2.5 py-1 ${on ? 'text-tile-cream' : 'bg-tile-ink/[0.07] text-ink-soft'}`}
      style={on ? { backgroundColor: color } : undefined}
    >
      {label}
      {extra}
    </span>
  );

  return (
    <div
      className="bg-primary-50/95 fixed inset-x-0 bottom-0 z-40
                 h-[var(--wall-pad-h)] border-t-2 border-tile-ink/10 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur
                 landscape:inset-y-0 landscape:left-auto landscape:right-0 landscape:flex landscape:h-auto
                 landscape:w-[var(--wall-pad-w)] landscape:flex-col landscape:justify-center landscape:border-l-2
                 landscape:border-t-0 landscape:pb-2 landscape:pr-[max(0.5rem,env(safe-area-inset-right))]"
    >
      <div className="mb-1.5 flex items-center justify-center gap-2 text-xs font-black">
        {stepChip(g.pad.step1, !onWallStep && !breakMode,
          remainSteps > 0 && !onWallStep && !breakMode && selected ? (
            <span className="ml-1 font-bold opacity-80">{fmt(g.pad.remain, { n: remainSteps })}</span>
          ) : null)}
        <span className="text-ink-soft/40">›</span>
        {stepChip(g.pad.step2, onWallStep || breakMode)}
      </div>

      <p className="mb-2 px-2 text-center text-xs font-bold text-ink-soft">{hint}</p>

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

          <span className="col-start-3 row-start-3 grid place-items-center" aria-hidden="true">
            <span
              className="block size-6 rounded-full transition-opacity"
              style={{ backgroundColor: color, opacity: selected ? 1 : 0.25 }}
            />
          </span>
        </div>

        <div className="flex flex-col gap-2 landscape:flex-row">
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
            onClick={() => { setBreakMode(false); onRedo(); }}
            className="grid size-12 place-items-center rounded-xl bg-tile-ink/[0.07] text-xl text-ink-soft transition enabled:active:scale-95 disabled:opacity-20"
          >
            <LuRotateCcw />
          </button>
          {/* 破牆只有三人局有，所以這顆只在那時才佔位置。
              按下去之後外圈的長條改代表「可以打破的牆」（染成磚紅），
              再按一下退出 —— 不做成一次性的動作，因為選錯牆的代價是
              整局唯一的一次機會。 */}
          {breaksLeft !== undefined && (
            <button
              type="button"
              disabled={!canBreakAny}
              aria-label={breaksLeft > 0 ? g.pad.breakWall : g.pad.breakNone}
              aria-pressed={breakMode}
              onClick={() => setBreakMode((b) => !b)}
              className={`grid size-12 place-items-center rounded-xl text-xl transition enabled:active:scale-95 disabled:opacity-20 ${
                breakMode ? 'bg-tile-red text-tile-cream' : 'bg-tile-ink/[0.07] text-ink-soft'
              }`}
            >
              <LuHammer />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
