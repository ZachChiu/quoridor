'use client';
import React from 'react';
import type { Direction } from '@/types/chessboard';

/**
 * 手機用的築牆控制盤。
 *
 * 盤面上那四條牆的預覽只有 9px 厚 —— 滑鼠點得到，手指點不到
 * （WCAG 2.5.8 的最低觸控目標是 24px，Apple 建議 44px）。而四個方向
 * 各要 44px、格子本身卻只有 45px，純粹放大熱區會讓四個方向互相蓋住，
 * 點下去是哪一邊全看運氣。
 *
 * 所以換一種操作：方向由大按鈕選、選完先預覽、再按中間確認。
 * 點錯不會直接送出，代價只是再點一次。
 *
 * 只在 `pointer: coarse` 出現；滑鼠仍然直接點盤面上的預覽，沒有多一步。
 */
type Props = {
  /** 這一格四個方向哪些能築牆 */
  legal: Record<Direction, boolean>;
  pending: Direction | null;
  onPick: (dir: Direction) => void;
  onConfirm: () => void;
  /** 當前玩家色，讓控制盤和即將築的那道牆是同一個顏色 */
  color: string;
};

const ARROW: Record<Direction, string> = { top: 'M12 5v14M5 12l7-7 7 7', bottom: 'M12 19V5M5 12l7 7 7-7', left: 'M19 12H5M12 5l-7 7 7 7', right: 'M5 12h14M12 5l7 7-7 7' };
const LABEL: Record<Direction, string> = { top: '上方', bottom: '下方', left: '左方', right: '右方' };
// grid 位置：十字排列，中央留給確認鍵
const POS: Record<Direction, string> = { top: 'col-start-2 row-start-1', bottom: 'col-start-2 row-start-3', left: 'col-start-1 row-start-2', right: 'col-start-3 row-start-2' };

/**
 * 控制盤現在該不該出現。
 *
 * 抽出來是因為有兩個地方要知道：Chessboard 決定要不要畫它，
 * PlayClient 要把底部的狀態膠囊往上讓位。兩邊各寫一份遲早會漂掉，
 * 而漂掉的症狀是膠囊被壓在控制盤後面 —— 不會壞、只會醜，
 * 所以更不容易被發現。
 */
export const wallPadVisible = (o: {
  coarse: boolean; locked: boolean; placing: boolean; hasSelection: boolean;
}) => o.coarse && !o.locked && !o.placing && o.hasSelection;

export default function WallDirectionPad({ legal, pending, onPick, onConfirm, color }: Props) {
  const any = (Object.keys(legal) as Direction[]).some((d) => legal[d]);
  if (!any) return null;

  return (
    <div
      className="bg-primary-50/95 fixed inset-x-0 bottom-0 z-40 flex items-center justify-center gap-4 border-t-2 border-tile-ink/10 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur"
      role="group"
      aria-label="築牆方向"
    >
      <p className="max-w-36 text-sm font-bold leading-snug text-ink-soft">
        {pending ? `要在${LABEL[pending]}築牆` : '選一個方向築牆'}
      </p>

      <div className="grid grid-cols-3 grid-rows-3 gap-1">
        {(Object.keys(ARROW) as Direction[]).map((dir) => (
          <button
            key={dir}
            type="button"
            disabled={!legal[dir]}
            aria-label={`選擇${LABEL[dir]}`}
            aria-pressed={pending === dir}
            onClick={() => onPick(dir)}
            className={`${POS[dir]} grid size-12 place-items-center rounded-xl transition
              disabled:opacity-25
              ${pending === dir ? 'text-tile-cream' : 'bg-tile-ink/[0.07] text-tile-ink enabled:active:scale-95'}`}
            style={pending === dir ? { backgroundColor: color } : undefined}
          >
            <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d={ARROW[dir]} />
            </svg>
          </button>
        ))}

        {/* 中央的確認鍵。沒選方向前是停用的 —— 它要確認的東西還不存在。 */}
        <button
          type="button"
          disabled={!pending}
          aria-label="確定築牆"
          onClick={onConfirm}
          className="col-start-2 row-start-2 grid size-12 place-items-center rounded-xl bg-tile-ink text-tile-cream transition enabled:active:scale-95 disabled:opacity-20"
        >
          <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 13l4 4L19 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
