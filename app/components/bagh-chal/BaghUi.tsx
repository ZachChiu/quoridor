'use client';
import { useMessages } from '@/i18n/LocaleProvider';
import type { Difficulty } from '@/games/bagh-chal/ai';

/**
 * 虎羊棋自己的按鈕與難度選擇。虎羊棋整套視覺不沿用 Wall Go（Zach：虎羊棋設計大改，
 * Wall Go 的設計跟元素要全部換掉）—— Wall Go 是奶油底上的灰色無框鈕，這裡是紙色底、
 * 深墨粗框（跟首頁四個按鈕同一種），圓鈕用橄欖綠的外圈（跟畫框的框線同色）。
 */
export const BAGH_ROUND = 'grid size-11 shrink-0 place-items-center rounded-full bg-[#fbf4e1] text-xl text-tile-ink ring-2 ring-[#5b6620] transition hover:bg-[#f4e8cc] active:scale-95 disabled:opacity-35';
const BTN = 'flex items-center justify-center gap-2 rounded-xl border-2 border-tile-ink font-black transition active:scale-[0.98] disabled:opacity-35';
export const BAGH_PRIMARY = `${BTN} bg-tile-ink text-tile-cream hover:brightness-125`;
export const BAGH_SECONDARY = `${BTN} bg-[#fbf4e1] text-tile-ink hover:bg-[#f4e8cc]`;

const LEVELS: Difficulty[] = ['easy', 'normal', 'hard'];

/** 三個難度：紙色框卡片，強度用一到三顆番紅花色的小圓牌表示 */
export function BaghDifficulty({ onPick }: { onPick: (difficulty: Difficulty) => void }) {
  const t = useMessages();
  const labels = [t.solo.level1, t.solo.level2, t.solo.level3];
  return (
    <div className="grid w-full grid-cols-3 gap-2.5">
      {LEVELS.map((key, i) => (
        <button key={key} type="button" onClick={() => onPick(key)}
          className="flex flex-col items-center gap-2.5 rounded-2xl border-2 border-tile-ink bg-[#fbf4e1] py-4 text-xl font-black text-tile-ink transition hover:bg-[#f4e8cc] active:scale-[0.97]">
          <span className="flex gap-1" aria-hidden="true">
            {LEVELS.map((_, dot) => (
              <span key={dot} className={`size-3 rounded-full border-2 border-tile-ink ${dot <= i ? 'bg-[#e3a43c]' : ''}`} />
            ))}
          </span>
          {labels[i]}
        </button>
      ))}
    </div>
  );
}
