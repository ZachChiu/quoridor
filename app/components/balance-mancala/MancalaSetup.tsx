'use client';
import { useState } from 'react';
import { GiRuleBook } from 'react-icons/gi';
import { LuCircleHelp } from 'react-icons/lu';
import Modal from '@/components/Modal';
import DifficultyButtons from '@/components/DifficultyButtons';
import PlatformCorner from '@/components/PlatformCorner';
import { fill, useTextTable } from '@/i18n/gameText';
import type { Locale } from '@/i18n/locales';
import { TEXT } from '@/games/balance-mancala/text';
import { MAX_SEATS, MIN_SEATS } from '@/games/balance-mancala/engine';
import type { Difficulty } from '@/games/balance-mancala/ai';
import { localSeats, type MatchSetup } from './match';
import { CREAM, GOLD, NAVY } from './palette';
import MancalaRules from './MancalaRules';

const SEAT_CHOICES = Array.from({ length: MAX_SEATS - MIN_SEATS + 1 }, (_, i) => MIN_SEATS + i);
const HUMAN_CHOICES = Array.from({ length: MAX_SEATS - 1 }, (_, i) => i + 2);

/**
 * 開局設定（這一頁同時是遊戲首頁）。上面是主視覺（夜空藍＋key-art），下面選模式、席數、難度。
 * 有電腦時按難度就開始（跟 Wall Go、Bagh Chal 的難度鈕同一套）；全部是真人時按「開始」。
 * 左上是平台 logo、右上是聯絡與語言（PlatformCorner，遊戲首頁才放）。
 */
export default function MancalaSetup({ locale, initial, onStart }: { locale: Locale; initial: MatchSetup; onStart: (m: MatchSetup) => void }) {
  const t = useTextTable(TEXT);
  const [mode, setMode] = useState(initial.mode);
  const [seats, setSeats] = useState(initial.mode === 'solo' ? initial.seats : 4);
  const [humans, setHumans] = useState(initial.mode === 'local' ? initial.humans : 2);
  const [helpOpen, setHelpOpen] = useState(false);
  // 主視覺在整合時才會放進 public/；讀不到就只留夜空藍的色帶與標題
  const [artOk, setArtOk] = useState(true);

  const total = mode === 'solo' ? seats : localSeats(humans);
  const computers = mode === 'solo' ? seats - 1 : total - humans;
  const start = (difficulty: Difficulty) => onStart({ mode, seats: total, humans: mode === 'solo' ? 1 : humans, difficulty });
  const choices = mode === 'solo' ? SEAT_CHOICES : HUMAN_CHOICES;
  const value = mode === 'solo' ? seats : humans;
  const note = mode === 'solo' ? fill(t.seatsSolo, { n: computers }) : computers > 0 ? fill(t.localFill, { n: computers }) : t.localNoFill;

  const chip = (on: boolean) => `h-12 rounded-2xl text-lg font-black transition ${on ? 'bg-tile-ink text-tile-cream' : 'bg-tile-ink/[0.07] text-tile-ink hover:bg-tile-ink/[0.12]'}`;

  return (
    <div className="flex min-h-dvh flex-col items-center font-[family-name:var(--font-app)]">
      <PlatformCorner locale={locale} />
      <header className="w-full" style={{ background: NAVY, color: CREAM }}>
        {artOk && (
          // eslint-disable-next-line @next/next/no-img-element -- 靜態匯出的單張主視覺，不需要 next/image
          <img src="/games/balance-mancala/key-art.webp" alt="" onError={() => setArtOk(false)}
            className="mx-auto block h-[min(27dvh,240px)] w-full max-w-[760px] object-cover object-[70%_50%]" />
        )}
        <div className={`mx-auto max-w-[460px] px-5 pb-5 text-center ${artOk ? 'pt-1' : 'pt-16'}`}>
          <p className="text-[11px] font-bold tracking-wide" style={{ color: GOLD }}>{t.showRef}</p>
          <h1 className="mt-1 text-[clamp(2rem,6dvh,3.25rem)] font-black leading-[1.05] tracking-tight">{t.title}</h1>
          {t.altName && <p className="mt-1 text-sm font-bold opacity-75">{t.altName}</p>}
          <p className="mt-2 text-sm font-bold opacity-90">{t.tagline}</p>
        </div>
      </header>

      <main className="flex w-full max-w-[460px] flex-col gap-5 p-5">
        <div className="grid grid-cols-2 gap-1 rounded-2xl bg-tile-ink/[0.07] p-1" role="radiogroup" aria-label={t.modeSolo + ' / ' + t.modeLocal}>
          {(['solo', 'local'] as const).map((m) => (
            <button key={m} type="button" role="radio" aria-checked={mode === m} onClick={() => setMode(m)}
              className={`h-11 rounded-xl text-sm font-black transition ${mode === m ? 'bg-tile-ink text-tile-cream' : 'text-ink-soft hover:text-tile-ink'}`}>
              {m === 'solo' ? t.modeSolo : t.modeLocal}
            </button>
          ))}
        </div>

        <section>
          <p className="text-sm font-bold text-ink-soft">{mode === 'solo' ? t.seats : t.humans}</p>
          <div className="mt-2 grid gap-2" style={{ gridTemplateColumns: `repeat(${choices.length}, minmax(0, 1fr))` }} role="radiogroup"
            aria-label={mode === 'solo' ? t.seats : t.humans}>
            {choices.map((n) => (
              <button key={n} type="button" role="radio" aria-checked={value === n} className={chip(value === n)}
                onClick={() => (mode === 'solo' ? setSeats(n) : setHumans(n))}>
                {n}
              </button>
            ))}
          </div>
          <p className="mt-2 flex flex-wrap items-center gap-2 text-xs font-bold text-ink-soft">
            {note}
            {total === MAX_SEATS && <span className="rounded-full bg-tile-ink px-2 py-0.5 text-[10px] text-tile-cream">{t.showMode}</span>}
          </p>
        </section>

        {computers > 0 ? (
          <section>
            <p className="text-sm font-bold text-ink-soft">{t.level}</p>
            <div className="mt-2"><DifficultyButtons onPick={(d) => start(d)} /></div>
          </section>
        ) : (
          <button type="button" onClick={() => start('normal')}
            className="h-14 rounded-2xl bg-tile-ink text-lg font-black text-tile-cream transition active:scale-[0.98]">{t.start}</button>
        )}

        <button type="button" onClick={() => setHelpOpen(true)}
          className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-tile-ink/[0.07] text-sm font-black text-tile-ink transition hover:bg-tile-ink/[0.12]">
          <LuCircleHelp aria-hidden="true" />{t.howTo}
        </button>
      </main>

      <Modal isOpen={helpOpen} onClose={() => setHelpOpen(false)} title={t.rulesHeading} kicker={t.title}
        icon={GiRuleBook} band={{ className: 'bg-tile-forest', fg: 'text-tile-cream' }}>
        <MancalaRules t={t} />
      </Modal>
    </div>
  );
}
