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
import { CLOTH, MCL_BAND, MCL_PANEL, WOOD } from './palette';
import { MCL_CORNER } from './styles';

const SEAT_CHOICES = Array.from({ length: MAX_SEATS - MIN_SEATS + 1 }, (_, i) => MIN_SEATS + i);
const HUMAN_CHOICES = Array.from({ length: MAX_SEATS - 1 }, (_, i) => i + 2);
const LEVELS: Difficulty[] = ['easy', 'normal', 'hard'];

/** 主視覺：克里夫蘭美術館的三件阿坎黃金砝碼（CC0，摳掉攝影棚的灰底、留下淡淡的影子），直接放在布上 */
const KEY_ART = '/games/balance-mancala/weights.webp';

/**
 * 開局設定（這一頁同時是遊戲首頁）。整頁是一塊 Adinkra 印花布（MancalaFrame）；上面是三件黃金砝碼與標題，
 * 下面選模式、席數、難度。有 AI 時按難度就開始；全部是真人時按「開始」。
 * 選項照全站：選中的是墨、其餘是布上一層淡墨，沒有框線；難度的點數用砝碼的黃銅（一個面板一個色相）。
 * 左上是平台 logo、右上是聯絡與語言（PlatformCorner，遊戲首頁才放），離邊多讓一個布邊的寬度；
 * 那兩顆鈕與打開的彈窗用這款自己的樣子（MCL_CORNER：切角淡布片、亮布面板、黃銅牌）。
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

  // 選中的是黃銅砝碼的牌子（切角），其餘是一條印花布（上下兩道梳線）—— globals.css 的 .mcl-*
  const chip = (on: boolean) => `h-12 text-lg font-black ${on ? 'mcl-plaque' : 'mcl-cloth'}`;

  return (
    <MancalaFrame className="items-center">
      <PlatformCorner locale={locale} theme={MCL_CORNER} offset="calc(var(--mcl-frame, 28px) + 6px)" />
      <div className="w-full max-w-[460px] px-5 pt-[60px]">
        <header className="flex flex-col items-center text-center">
          {/* 出處：阿坎（今迦納）19 世紀的黃金砝碼，克里夫蘭美術館（CC0）。畫面上不寫出處（Zach 10/24：插圖不要說明） */}
          <div className="flex w-full flex-col items-center gap-1">
            {/* eslint-disable-next-line @next/next/no-img-element -- 靜態匯出的單張主視覺，不需要 next/image */}
            <img src={KEY_ART} alt="" aria-hidden="true" width={1000} height={264}
              className="block h-auto w-[min(100%,24rem,calc(19dvh*3.79))]" />
          </div>
          <p className="mt-4 text-[11px] font-bold tracking-wide text-ink-soft">{t.showRef}</p>
          <h1 className="mt-1 text-[clamp(2rem,6dvh,3.25rem)] font-black leading-[1.05] tracking-tight">{t.title}</h1>
          {t.altName && <p className="mt-1 text-sm font-bold text-ink-soft">{t.altName}</p>}
          <p className="mt-2 text-sm font-bold">{t.tagline}</p>
        </header>
      </div>

      <main className="flex w-full max-w-[460px] flex-col gap-5 p-5">
        <div className="mcl-cloth grid grid-cols-2 gap-1 px-1 py-2.5" role="radiogroup" aria-label={t.modeSolo + ' / ' + t.modeLocal}>
          {(['solo', 'local'] as const).map((md) => (
            <button key={md} type="button" role="radio" aria-checked={mode === md} onClick={() => setMode(md)}
              className={`h-11 text-sm font-black ${mode === md ? 'mcl-plaque' : 'text-ink-soft fine:hover:text-[#201211]'}`}>
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
            {total === MAX_SEATS && <span className="mcl-cut px-2 py-0.5 text-[10px]" style={{ background: WOOD, color: CLOTH }}>{t.showMode}</span>}
          </p>
        </section>

        {computers > 0 ? (
          <section>
            <p className="text-sm font-bold text-ink-soft">{t.level}</p>
            {/* 一條條印花布；強度用小塊的黃銅砝碼講：一塊、兩塊、三塊 */}
            <div className="mt-2 grid w-full grid-cols-3 gap-3">
              {LEVELS.map((d, i) => (
                <button key={d} type="button" onClick={() => start(d)}
                  className="mcl-cloth flex flex-col items-center gap-3 py-5 text-xl font-black active:scale-[0.97]">
                  <span className="flex h-[13px] gap-1" aria-hidden="true">
                    {Array.from({ length: i + 1 }, (_, k) => <span key={k} className="mcl-weight" />)}
                  </span>
                  {levelNames[i]}
                </button>
              ))}
            </div>
          </section>
        ) : (
          <button type="button" onClick={() => start('normal')}
            className="mcl-plaque h-14 text-lg font-black active:scale-[0.98]">{t.start}</button>
        )}

        <button type="button" onClick={() => setHelpOpen(true)}
          className="mcl-link mx-auto flex h-11 items-center justify-center gap-1.5 text-sm">
          <LuCircleHelp aria-hidden="true" />{t.howTo}
        </button>
      </main>

      <Modal isOpen={helpOpen} onClose={() => setHelpOpen(false)} title={t.rulesHeading} kicker={t.title}
        icon={GiRuleBook} band={MCL_BAND} panelClassName={MCL_PANEL}>
        <MancalaRules t={t} />
      </Modal>
    </MancalaFrame>
  );
}
