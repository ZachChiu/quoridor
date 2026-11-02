'use client';
import { useState } from 'react';
import { useIsoLayoutEffect } from '@/hook/useIsoLayoutEffect';
import { useMessages } from '@/i18n/LocaleProvider';
import type { Locale } from '@/i18n/locales';
import type { Side } from '@/games/bagh-chal/engine';
import BaghPlay from './BaghPlay';
import { readSoloHash, soloHash } from './soloHash';
import { GoatToken, TigerToken } from './tokens';
import BaghFrame from './BaghFrame';
import { BaghDifficulty } from './BaghUi';
import BaghWordmark from './BaghWordmark';
import { BAGH_SELECTED } from './styles';
import { track } from '@/utils/analytics';

/**
 * /bagh-chal/solo：跟電腦下。
 *
 * 網址帶 `#tiger-normal` 就直接開打；沒帶（書籤、cmd 點磁磚開新分頁）就先在這裡選邊與難度。
 * 這頁 noindex，靜態 HTML 不必有內容 —— 掛載前什麼都不畫，就不會像 Wall Go 那樣
 * 先閃一下選單再跳進對局（那邊要靠內嵌 script 擋）。
 */
export default function BaghSolo({ locale }: { locale: Locale }) {
  const t = useMessages();
  const b = t.baghChal;
  const [mode, setMode] = useState<ReturnType<typeof readSoloHash> | undefined>(undefined);
  const [side, setSide] = useState<Side>('tiger');

  useIsoLayoutEffect(() => {
    const read = () => setMode(readSoloHash(location.hash));
    read();
    window.addEventListener('hashchange', read);
    return () => window.removeEventListener('hashchange', read);
  }, []);

  // 掛載前先畫空的畫框：靜態 HTML 就是這一格，接著才換成選單或對局，底色不會閃
  if (mode === undefined) return <BaghFrame variant="play"><div /></BaghFrame>;
  if (mode) {
    return <BaghPlay key={`${mode.side}-${mode.difficulty}`} locale={locale} mode={{ kind: 'ai', human: mode.side, difficulty: mode.difficulty }} />;
  }

  return (
    <BaghFrame variant="play">
    <div className="flex flex-1 items-center justify-center px-5 py-8">
      <div className="flex w-full max-w-[380px] flex-col gap-6">
        <h1 aria-label={`${b.title} ${b.subtitle}`} className="flex flex-col items-center gap-1 text-center">
          <BaghWordmark className="h-12 w-auto" />
          <span className="text-base font-black text-ink-soft">{b.vsAi}</span>
        </h1>
        <div className="flex flex-col gap-2">
          <p className="text-sm font-bold text-ink-soft">{b.playAs}</p>
          <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label={b.playAs}>
            {(['tiger', 'goat'] as const).map((s) => {
              const Icon = s === 'tiger' ? TigerToken : GoatToken;
              const on = side === s;
              return (
                <button key={s} type="button" role="radio" aria-checked={on} onClick={() => setSide(s)}
                  className={`flex items-center justify-center gap-2.5 py-3.5 text-lg font-black transition ${on ? BAGH_SELECTED : 'bagh-line bg-[#f2e4c4] text-tile-ink hover:bg-[#ead8ad]'}`}>
                  <Icon className={`text-[40px] transition ${on ? '' : 'opacity-70 grayscale-[35%]'}`} />{s === 'tiger' ? b.tiger : b.goat}
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-sm font-bold text-ink-soft">{b.level}</p>
          <BaghDifficulty side={side} onPick={(difficulty) => {
            track('mode_select', { game: 'bagh-chal', mode: 'solo', players: 2, difficulty, entry: 'solo_page' });
            history.replaceState(null, '', location.pathname + soloHash(side, difficulty));
            setMode({ side, difficulty });
          }} />
        </div>
      </div>
    </div>
    </BaghFrame>
  );
}
