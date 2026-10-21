'use client';
import { useState } from 'react';
import { GiRuleBook } from 'react-icons/gi';
import { LuCircleHelp, LuHouse } from 'react-icons/lu';
import Modal from '@/components/Modal';
import { useMessages } from '@/i18n/LocaleProvider';
import { fill, useTextTable } from '@/i18n/gameText';
import type { Mode } from '@/games/time-auction/engine';
import type { Difficulty } from '@/games/time-auction/ai';
import { TEXT } from '@/games/time-auction/text';
import AuctionRules from './AuctionRules';
import { KEY_ART, KEY_BG } from './theme';
import TauFrame from './TauFrame';
import TauWordmark from './TauWordmark';

export type Setup = { mode: Mode; opponents: 3 | 4 | 5; difficulty: Difficulty };

const MODE_KEYS: Mode[] = ['quick', 'show'];
const OPPONENTS: Setup['opponents'][] = [3, 4, 5];
const LEVELS: Difficulty[] = ['easy', 'normal', 'hard'];

/** 小圓鈕（回平台、說明）：紙上一層淡墨，沒有框線 */
export const roundBtn = 'grid size-11 shrink-0 place-items-center rounded-full bg-[#35331c]/[0.08] text-xl text-[#35331c] transition fine:hover:bg-[#35331c]/[0.14] disabled:opacity-35';

/**
 * 開局設定：整頁是一張維多利亞時代的拍賣傳單（TauFrame：報紙色的紙、紅色牛津角框）。
 * 上面是主視覺 —— Cruikshank〈Sales by Auction〉（1819）的拍賣場本身（公有領域，附出處）—— 與標題：
 * 中日韓的名字＋肥臉體的「TIME AUCTION」字標（英文版字標直接當標題）；下面是選項（選中的墨色、其餘淡墨），
 * 最後一顆墨色的「開始」。紅是唯一的主色，只用在難度的點數。桌機（lg）改成左右兩欄。
 */
export default function AuctionSetup({ value, onChange, onStart, onHome }: {
  value: Setup;
  /** 只傳改了哪一項；由上層用 updater 合併，連點兩個選項也不會用到舊值 */
  onChange: (patch: Partial<Setup>) => void;
  onStart: () => void;
  onHome: () => void;
}) {
  const t = useTextTable(TEXT);
  const m = useMessages();
  const [helpOpen, setHelpOpen] = useState(false);
  const levelNames = [m.solo.level1, m.solo.level2, m.solo.level3];

  const option = (on: boolean) =>
    `rounded-2xl transition ${on ? 'bg-[#35331c] text-[#ebe1b8]' : 'bg-[#35331c]/[0.08] text-[#35331c] fine:hover:bg-[#35331c]/[0.14]'}`;
  const legend = 'mb-1.5 text-sm font-bold text-ink-soft';
  // 名字本來就是英文（英文版）就讓字標當標題，不重複寫兩次
  const latinTitle = t.nameEn === t.title;

  return (
    <TauFrame className="items-center px-4 pb-6 pt-3 lg:px-8">
      <div className="flex w-full max-w-[460px] items-center justify-between lg:max-w-[960px]">
        <button type="button" onClick={onHome} aria-label={t.home} className={roundBtn}><LuHouse aria-hidden="true" /></button>
        <button type="button" onClick={() => setHelpOpen(true)} aria-label={t.howTo} className={roundBtn}><LuCircleHelp aria-hidden="true" /></button>
      </div>

      <main className="mt-3 flex w-full max-w-[460px] flex-col gap-4 lg:my-auto lg:max-w-[960px] lg:flex-row lg:items-center lg:gap-10">
        <header className="flex flex-col lg:flex-1">
          {/* 主視覺：拍賣場本身（自己畫了框線，不再加框）；只有它跟著畫面高度縮 */}
          <figure className="flex flex-col gap-1">
            {/* eslint-disable-next-line @next/next/no-img-element -- 靜態匯出，不需要 next/image */}
            <img src={KEY_ART} alt="" aria-hidden="true" width={818} height={462}
              className="h-[clamp(7rem,21dvh,14rem)] w-full rounded-sm object-cover lg:h-auto" />
            <figcaption className="text-[11px] font-bold text-ink-soft">{t.artCredit}</figcaption>
          </figure>
          <div className="mt-3 text-center lg:text-left">
            <p className="text-xs font-bold tracking-wide text-ink-soft">{t.tag}</p>
            {latinTitle ? (
              <h1 className="mt-1.5"><span className="sr-only">{t.title}</span><TauWordmark className="mx-auto h-auto w-[min(100%,22rem)] lg:mx-0" /></h1>
            ) : (
              <h1 className="mt-1 flex flex-col items-center lg:items-start">
                <span className="text-[clamp(2.25rem,5.5dvh,3.25rem)] font-black leading-none tracking-[0.04em]">{t.title}</span>
                <span className="sr-only">{t.nameEn}</span>
                <TauWordmark className="mt-2 h-[clamp(1.1rem,2.8dvh,1.6rem)] w-auto" />
              </h1>
            )}
            <p className="mt-2 text-sm font-bold">{t.tagline}</p>
          </div>
        </header>

        <section className="flex flex-col gap-4 lg:w-[400px] lg:shrink-0">
          <fieldset>
            <legend className={legend}>{t.modeLabel}</legend>
            <div role="radiogroup" aria-label={t.modeLabel} className="grid grid-cols-2 gap-2.5">
              {MODE_KEYS.map((key) => {
                const on = value.mode === key;
                return (
                  <button key={key} type="button" role="radio" aria-checked={on} onClick={() => onChange({ mode: key })}
                    className={`flex flex-col items-start gap-1 px-4 py-3 text-left ${option(on)}`}>
                    <span className="text-base font-black">{key === 'quick' ? t.modeQuick : t.modeShow}</span>
                    <span className={`text-xs font-bold leading-snug ${on ? 'text-[#ebe1b8]/75' : 'text-ink-soft'}`}>
                      {key === 'quick' ? t.modeQuickNote : t.modeShowNote}
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <fieldset>
            <legend className={legend}>{t.opponentsLabel}</legend>
            <div role="radiogroup" aria-label={t.opponentsLabel} className="grid grid-cols-3 gap-2.5">
              {OPPONENTS.map((n) => {
                const on = value.opponents === n;
                return (
                  <button key={n} type="button" role="radio" aria-checked={on} onClick={() => onChange({ opponents: n })}
                    className={`h-12 text-base font-black ${option(on)}`}>
                    {fill(t.opponentsUnit, { n })}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <fieldset>
            <legend className={legend}>{t.levelLabel}</legend>
            <div role="radiogroup" aria-label={t.levelLabel} className="grid grid-cols-3 gap-2.5">
              {LEVELS.map((level, i) => {
                const on = value.difficulty === level;
                return (
                  <button key={level} type="button" role="radio" aria-checked={on} onClick={() => onChange({ difficulty: level })}
                    className={`flex flex-col items-center gap-2 py-2.5 text-base font-black ${option(on)}`}>
                    {/* 強度用點數講，不用三個色相（CLAUDE.md〈視覺〉） */}
                    <span className="flex gap-1.5" aria-hidden="true">
                      {LEVELS.map((_, dot) => (
                        <span key={dot} className={`size-2.5 rounded-full ${dot <= i ? (on ? 'bg-[#ebe1b8]' : KEY_BG) : on ? 'bg-[#ebe1b8]/25' : 'bg-[#35331c]/15'}`} />
                      ))}
                    </span>
                    {levelNames[i]}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <button type="button" onClick={onStart}
            className="mt-1 h-14 w-full rounded-2xl bg-[#35331c] text-lg font-black text-[#ebe1b8] transition active:scale-[0.985] fine:hover:brightness-125">
            {t.start}
          </button>
          <button type="button" onClick={() => setHelpOpen(true)} className="mx-auto text-sm font-bold text-ink-soft underline underline-offset-4">
            {t.howTo}
          </button>
        </section>
      </main>

      <Modal isOpen={helpOpen} onClose={() => setHelpOpen(false)} title={t.howTo} kicker={t.title}
        icon={GiRuleBook} band={{ className: KEY_BG, fg: 'text-[#ebe1b8]' }} panelClassName="!bg-[#ebe1b8]">
        <AuctionRules mode={value.mode} />
      </Modal>
    </TauFrame>
  );
}
