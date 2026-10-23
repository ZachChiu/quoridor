'use client';
import { useState } from 'react';
import Link from 'next/link';
import { GiRuleBook } from 'react-icons/gi';
import { LuCircleHelp } from 'react-icons/lu';
import Modal from '@/components/Modal';
import PlatformMark from '@/components/PlatformMark';
import ContactButton from '@/components/ContactButton';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { BRAND } from '@/brand';
import { useMessages } from '@/i18n/LocaleProvider';
import { fill, useTextTable } from '@/i18n/gameText';
import { localePath, type Locale } from '@/i18n/locales';
import type { Mode } from '@/games/time-auction/engine';
import type { Difficulty } from '@/games/time-auction/ai';
import { TEXT } from '@/games/time-auction/text';
import AuctionRules from './AuctionRules';
import { KEY_ART, TAU_BAND, TAU_CORNER, TAU_PANEL } from './theme';
import TauFrame from './TauFrame';
import TauWordmark from './TauWordmark';

export type Setup = { mode: Mode; opponents: 3 | 4 | 5; difficulty: Difficulty };

const MODE_KEYS: Mode[] = ['quick', 'show'];
const OPPONENTS: Setup['opponents'][] = [3, 4, 5];
const LEVELS: Difficulty[] = ['easy', 'normal', 'hard'];

/** 角落的小鈕（回平台、說明、換設定）：方角、一道墨線，像傳單角落的小框 */
export const roundBtn = 'grid size-11 shrink-0 place-items-center rounded-[2px] text-xl text-[#35331c] shadow-[inset_0_0_0_1.5px_#35331c] transition fine:hover:bg-[#35331c]/[0.07] disabled:opacity-35';

/**
 * 開局設定：整頁是一張維多利亞時代的拍賣傳單（TauFrame：報紙色的紙、紅色牛津角框）。
 * 上面是主視覺 —— Cruikshank〈Sales by Auction〉（1819）的拍賣場本身（公有領域，附出處）—— 與標題：
 * 中日韓的名字＋肥臉體的「TIME AUCTION」字標（英文版字標直接當標題）；下面是選項，最後一塊紅色版塊「開拍」。
 *
 * 介面照拍賣傳單與拍品票的印刷方式（globals.css 的 .tau-*，Zach 10/22：每款的按鈕要有自己的樣子，不要最後都是黑白按鈕）：
 * 區段標題左右夾細線、選項是方角雙線的票（選中＝紅色版塊）、對手人數是打孔的拍品票、難度用羅馬數字、
 * 開拍是紅色鉛字版塊、怎麼玩是一隻指示手 ☞。桌機（lg）改成左右兩欄。
 *
 * 最上面一列跟其他遊戲首頁一樣：左邊平台 logo（回平台首頁）、右邊說明、聯絡我們與語言。
 * 不用 PlatformCorner 釘在畫面角落 —— 那樣會疊在紅色牛津角框上（虎羊棋的教訓），所以放在框裡、跟內容走同一個流。
 * 聯絡與語言的圓鈕和彈窗換成這款的拍賣目錄（TAU_CORNER），不是 Wall Go 的奶油底黑鈕（Zach 10/24）。
 */
export default function AuctionSetup({ locale, value, onChange, onStart }: {
  locale: Locale;
  value: Setup;
  /** 只傳改了哪一項；由上層用 updater 合併，連點兩個選項也不會用到舊值 */
  onChange: (patch: Partial<Setup>) => void;
  onStart: () => void;
}) {
  const t = useTextTable(TEXT);
  const m = useMessages();
  const [helpOpen, setHelpOpen] = useState(false);
  const levelNames = [m.solo.level1, m.solo.level2, m.solo.level3];

  const legend = 'tau-head mb-2 w-full text-ink-soft';
  const ROMAN = ['I', 'II', 'III'];
  // 名字本來就是英文（英文版）就讓字標當標題，不重複寫兩次
  const latinTitle = t.nameEn === t.title;

  return (
    <TauFrame className="items-center px-4 pb-6 pt-3 lg:px-8">
      <div className="flex w-full max-w-[460px] items-center justify-between lg:max-w-[960px]">
        <Link href={localePath(locale, '/')} aria-label={BRAND} title={BRAND} className="transition hover:brightness-110 active:scale-95">
          <PlatformMark className="!size-11" />
        </Link>
        <div className="flex gap-1.5">
          <button type="button" onClick={() => setHelpOpen(true)} aria-label={t.howTo} className={roundBtn}><LuCircleHelp aria-hidden="true" /></button>
          <ContactButton theme={TAU_CORNER} />
          <LanguageSwitcher theme={TAU_CORNER} />
        </div>
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
                    className="tau-lot flex flex-col items-start gap-1 px-4 py-3 text-left">
                    <span className="text-base font-black">{key === 'quick' ? t.modeQuick : t.modeShow}</span>
                    <span className={`text-xs font-bold leading-snug ${on ? 'text-[#92383a]/80' : 'text-ink-soft'}`}>
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
                    className="tau-lot tau-ticket h-12 text-base font-black">
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
                    className="tau-lot flex flex-col items-center gap-0.5 py-2.5 text-base font-black">
                    {/* 強度用羅馬數字講（傳單上的分級寫法），不用三個色相 */}
                    <span aria-hidden="true" className="tau-display text-xl font-bold italic leading-none">{ROMAN[i]}</span>
                    {levelNames[i]}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <button type="button" onClick={onStart} className="tau-press mt-1 h-14 w-full text-lg font-black">
            {t.start}
          </button>
          <button type="button" onClick={() => setHelpOpen(true)} className="tau-hand mx-auto text-sm">
            {t.howTo}
          </button>
        </section>
      </main>

      <Modal isOpen={helpOpen} onClose={() => setHelpOpen(false)} title={t.howTo} kicker={t.title}
        icon={GiRuleBook} band={TAU_BAND} panelClassName={TAU_PANEL}>
        <AuctionRules mode={value.mode} />
      </Modal>
    </TauFrame>
  );
}
