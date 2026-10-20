'use client';
import { useMessages } from '@/i18n/LocaleProvider';
import type { Difficulty } from '@/games/bagh-chal/ai';

/** 虎羊棋的難度選擇（按鈕樣式在 styles.ts）。 */
const LEVELS: Difficulty[] = ['easy', 'normal', 'hard'];

/** 三個難度：淡沙色卡片，強度用一到三顆番紅花色的小圓牌表示 */
export function BaghDifficulty({ onPick }: { onPick: (difficulty: Difficulty) => void }) {
  const t = useMessages();
  const labels = [t.solo.level1, t.solo.level2, t.solo.level3];
  return (
    <div className="grid w-full grid-cols-3 gap-2.5">
      {LEVELS.map((key, i) => (
        <button key={key} type="button" onClick={() => onPick(key)}
          className="flex flex-col items-center gap-2.5 rounded-2xl bg-bagh-paper py-4 text-xl font-black text-tile-ink transition hover:bg-bagh-paper-deep active:scale-[0.97]">
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
