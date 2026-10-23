'use client';
import { useMessages } from '@/i18n/LocaleProvider';
import type { Locale } from '@/i18n/locales';
import type { Side } from '@/games/bagh-chal/engine';
import type { Difficulty } from '@/games/bagh-chal/ai';
import { GOAT_SRC, TIGER_SRC } from './tokens';

/** 虎羊棋的難度選擇（按鈕樣式在 styles.ts）。 */
const LEVELS: Difficulty[] = ['easy', 'normal', 'hard'];

/**
 * 三個難度：淡沙色卡片，強度用一到三顆**對手**的頭表示、疊在一起排 —— 難度說的是電腦有多強，
 * 所以當老虎時是羊頭、當羊時是虎頭（Zach 10/24）。原本是一到三顆番紅花色的小圓點。
 */
export function BaghDifficulty({ side, onPick }: { side: Side; onPick: (difficulty: Difficulty) => void }) {
  const t = useMessages();
  const labels = [t.solo.level1, t.solo.level2, t.solo.level3];
  const src = side === 'tiger' ? GOAT_SRC : TIGER_SRC;
  return (
    <div className="grid w-full grid-cols-3 gap-2.5">
      {LEVELS.map((key, i) => (
        <button key={key} type="button" onClick={() => onPick(key)}
          className="flex flex-col items-center gap-2.5 rounded-2xl bg-[#f2e4c4] py-4 text-xl font-black text-tile-ink transition hover:bg-[#ead8ad] active:scale-[0.97]">
          <span className="flex h-9 items-center -space-x-2.5" aria-hidden="true">
            {LEVELS.slice(0, i + 1).map((_, n) => (
              // 背景圖、不用 <img>（見 BaghBoard 的 iPhone 漏畫）；紙色外圈把疊在一起的頭分開
              <span key={n} className="block size-9 rounded-full bg-cover bg-center ring-2 ring-[#f2e4c4]" style={{ backgroundImage: `url(${src})` }} />
            ))}
          </span>
          {labels[i]}
        </button>
      ))}
    </div>
  );
}

/** 「你要當：老虎」這種標籤＋值。中文、日文用全形冒號，其他語言用半形加空白（英文原本變成「Play as：Tigers」） */
export const labelled = (locale: Locale, label: string, value: string) =>
  `${label}${/^(zh|ja)/.test(locale) ? '：' : ': '}${value}`;
