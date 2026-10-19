'use client';
import { useState } from 'react';
import { GiGoat, GiTigerHead } from 'react-icons/gi';
import DifficultyButtons from '@/components/DifficultyButtons';
import { useIsoLayoutEffect } from '@/hook/useIsoLayoutEffect';
import { useMessages } from '@/i18n/LocaleProvider';
import type { Locale } from '@/i18n/locales';
import type { Side } from '@/games/bagh-chal/engine';
import BaghPlay from './BaghPlay';
import { readSoloHash, soloHash } from './soloHash';

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

  if (mode === undefined) return <div className="min-h-dvh" />;
  if (mode) {
    return <BaghPlay key={`${mode.side}-${mode.difficulty}`} locale={locale} mode={{ kind: 'ai', human: mode.side, difficulty: mode.difficulty }} />;
  }

  return (
    <div className="flex min-h-dvh items-center justify-center px-5 font-[family-name:var(--font-app)]">
      <div className="flex w-full max-w-[380px] flex-col gap-6">
        <h1 className="text-center text-3xl font-black tracking-tight">{b.title}<span className="mt-1 block text-base text-ink-soft">{b.vsAi}</span></h1>
        <div className="flex flex-col gap-2">
          <p className="text-sm font-bold text-ink-soft">{b.playAs}</p>
          <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label={b.playAs}>
            {(['tiger', 'goat'] as const).map((s) => {
              const Icon = s === 'tiger' ? GiTigerHead : GiGoat;
              const on = side === s;
              return (
                <button key={s} type="button" role="radio" aria-checked={on} onClick={() => setSide(s)}
                  className={`flex items-center justify-center gap-2 rounded-2xl py-4 text-lg font-black transition ${on ? 'bg-tile-ink text-tile-cream' : 'bg-tile-ink/[0.07] text-ink-soft'}`}>
                  <Icon aria-hidden="true" className="text-3xl" />{s === 'tiger' ? b.tiger : b.goat}
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-sm font-bold text-ink-soft">{b.level}</p>
          <DifficultyButtons onPick={(difficulty) => {
            history.replaceState(null, '', location.pathname + soloHash(side, difficulty));
            setMode({ side, difficulty });
          }} />
        </div>
      </div>
    </div>
  );
}
