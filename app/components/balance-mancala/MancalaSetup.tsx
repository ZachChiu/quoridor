'use client';
import { useState } from 'react';
import { GiRuleBook } from 'react-icons/gi';
import { LuCircleHelp } from 'react-icons/lu';
import Modal from '@/components/Modal';
import PlatformCorner from '@/components/PlatformCorner';
import { fill, useTextTable } from '@/i18n/gameText';
import type { Locale } from '@/i18n/locales';
import { TEXT } from '@/games/balance-mancala/text';
import { MAX_SEATS, MIN_SEATS } from '@/games/balance-mancala/engine';
import type { Difficulty } from '@/games/balance-mancala/ai';
import { useMessages } from '@/i18n/LocaleProvider';
import { localSeats, type MatchSetup } from './match';
import MancalaFrame from './MancalaFrame';
import MancalaRules from './MancalaRules';
import { BRASS_DEEP, CLOTH, INK, WOOD } from './palette';

const SEAT_CHOICES = Array.from({ length: MAX_SEATS - MIN_SEATS + 1 }, (_, i) => MIN_SEATS + i);
const HUMAN_CHOICES = Array.from({ length: MAX_SEATS - 1 }, (_, i) => i + 2);
const LEVELS: Difficulty[] = ['easy', 'normal', 'hard'];

/** 主視覺：克里夫蘭美術館的三件阿坎黃金砝碼（CC0，摳掉攝影棚的灰底、留下淡淡的影子），直接放在布上 */
const KEY_ART = '/games/balance-mancala/weights.webp';

/**
 * 開局設定（這一頁同時是遊戲首頁）。整頁是一塊 Adinkra 印花布（MancalaFrame）；上面是三件黃金砝碼與標題，
 * 下面選模式、席數、難度。有 AI 時按難度就開始；全部是真人時按「開始」。
 * 選項照全站：選中的是墨、其餘是布上一層淡墨，沒有框線；難度的點數用砝碼的黃銅（一個面板一個色相）。
 * 左上是平台 logo、右上是聯絡與語言（PlatformCorner，遊戲首頁才放），離邊多讓一個布邊的寬度。
 */
export default function MancalaSetup({ locale, initial, onStart }: { locale: Locale; initial: MatchSetup; onStart: (m: MatchSetup) => void }) {
  const t = useTextTable(TEXT);
  const [mode, setMode] = useState(initial.mode);
  const [seats, setSeats] = useState(initial.mode === 'solo' ? initial.seats : 4);
  const [humans, setHumans] = useState(initial.mode === 'local' ? initial.humans : 2);
  const [helpOpen, setHelpOpen] = useState(false);
  const m = useMessages();
  const levelNames = [m.solo.level1, m.solo.level2, m.solo.level3];

  const total = mode === 'solo' ? seats : localSeats(humans);
  const computers = mode === 'solo' ? seats - 1 : total - humans;
  const start = (difficulty: Difficulty) => onStart({ mode, seats: total, humans: mode === 'solo' ? 1 : humans, difficulty });
  const choices = mode === 'solo' ? SEAT_CHOICES : HUMAN_CHOICES;
  const value = mode === 'solo' ? seats : humans;
  const note = mode === 'solo' ? fill(t.seatsSolo, { n: computers }) : computers > 0 ? fill(t.localFill, { n: computers }) : t.localNoFill;

  const chip = (on: boolean) => `h-12 rounded-2xl text-lg font-black transition ${on ? 'bg-[#201211] text-[#ebd2cb]' : 'bg-[#201211]/[0.07] fine:hover:bg-[#201211]/[0.12]'}`;

  return (
    <MancalaFrame className="items-center">
      <PlatformCorner locale={locale} offset="calc(var(--mcl-frame, 28px) + 6px)" />
      <div className="w-full max-w-[460px] px-5 pt-[60px]">
        <header className="flex flex-col items-center text-center">
          <figure className="flex w-full flex-col items-center gap-1">
            {/* eslint-disable-next-line @next/next/no-img-element -- 靜態匯出的單張主視覺，不需要 next/image */}
            <img src={KEY_ART} alt="" aria-hidden="true" width={1000} height={264}
              className="block h-auto w-[min(100%,24rem,calc(19dvh*3.79))]" />
            <figcaption className="text-[10px] font-bold text-ink-soft">{t.artCredit}</figcaption>
          </figure>
          <p className="mt-4 text-[11px] font-bold tracking-wide text-ink-soft">{t.showRef}</p>
          <h1 className="mt-1 text-[clamp(2rem,6dvh,3.25rem)] font-black leading-[1.05] tracking-tight">{t.title}</h1>
          {t.altName && <p className="mt-1 text-sm font-bold text-ink-soft">{t.altName}</p>}
          <p className="mt-2 text-sm font-bold">{t.tagline}</p>
        </header>
      </div>

      <main className="flex w-full max-w-[460px] flex-col gap-5 p-5">
        <div className="grid grid-cols-2 gap-1 rounded-2xl bg-[#201211]/[0.07] p-1" role="radiogroup" aria-label={t.modeSolo + ' / ' + t.modeLocal}>
          {(['solo', 'local'] as const).map((md) => (
            <button key={md} type="button" role="radio" aria-checked={mode === md} onClick={() => setMode(md)}
              className={`h-11 rounded-xl text-sm font-black transition ${mode === md ? 'bg-[#201211] text-[#ebd2cb]' : 'text-ink-soft fine:hover:text-[#201211]'}`}>
              {md === 'solo' ? t.modeSolo : t.modeLocal}
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
            {total === MAX_SEATS && <span className="rounded-full px-2 py-0.5 text-[10px]" style={{ background: WOOD, color: CLOTH }}>{t.showMode}</span>}
          </p>
        </section>

        {computers > 0 ? (
          <section>
            <p className="text-sm font-bold text-ink-soft">{t.level}</p>
            {/* 跟共用的 DifficultyButtons 同一個樣子，點數換成砝碼的黃銅 */}
            <div className="mt-2 grid w-full grid-cols-3 gap-3">
              {LEVELS.map((d, i) => (
                <button key={d} type="button" onClick={() => start(d)}
                  className="flex flex-col items-center gap-3 rounded-2xl bg-[#201211]/[0.07] py-5 text-xl font-black transition active:scale-[0.97] fine:hover:bg-[#201211]/[0.12]">
                  <span className="flex gap-1.5" aria-hidden="true">
                    {LEVELS.map((_, dot) => (
                      <span key={dot} className="size-2.5 rounded-full" style={{ background: dot <= i ? BRASS_DEEP : `${INK}26` }} />
                    ))}
                  </span>
                  {levelNames[i]}
                </button>
              ))}
            </div>
          </section>
        ) : (
          <button type="button" onClick={() => start('normal')}
            className="h-14 rounded-2xl bg-[#201211] text-lg font-black text-[#ebd2cb] transition active:scale-[0.98]">{t.start}</button>
        )}

        <button type="button" onClick={() => setHelpOpen(true)}
          className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#201211]/[0.07] text-sm font-black transition fine:hover:bg-[#201211]/[0.12]">
          <LuCircleHelp aria-hidden="true" />{t.howTo}
        </button>
      </main>

      <Modal isOpen={helpOpen} onClose={() => setHelpOpen(false)} title={t.rulesHeading} kicker={t.title}
        icon={GiRuleBook} band={{ style: { backgroundColor: WOOD }, fg: 'text-[#fef2ec]' }} panelClassName="!bg-[#ebd2cb]">
        <MancalaRules t={t} />
      </Modal>
    </MancalaFrame>
  );
}
