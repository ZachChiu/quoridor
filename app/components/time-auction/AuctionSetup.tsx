'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LuCircleHelp, LuUsers } from 'react-icons/lu';
import Modal from '@/components/Modal';
import PlatformMark from '@/components/PlatformMark';
import ContactButton from '@/components/ContactButton';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { brandName } from '@/brand';
import { useMessages } from '@/i18n/LocaleProvider';
import { fill, useTextTable } from '@/i18n/gameText';
import { localePath, type Locale } from '@/i18n/locales';
import { TIME_AUCTION, trialOnline, trialRules } from '@/i18n/routes';
import { MAX_SEATS, ONLINE_MIN_SEATS, type Mode } from '@/games/time-auction/engine';
import type { Difficulty } from '@/games/time-auction/ai';
import { TEXT } from '@/games/time-auction/text';
import { KEY_ART, TAU_BAND, TAU_CORNER, TAU_PANEL, roundBtn } from './theme';
import TauFrame from './TauFrame';
import TauWordmark from './TauWordmark';

export type Setup = { mode: Mode; opponents: 3 | 4 | 5; difficulty: Difficulty };

const MODE_KEYS: Mode[] = ['quick', 'show'];
const OPPONENTS: Setup['opponents'][] = [3, 4, 5];
const LEVELS: Difficulty[] = ['easy', 'normal', 'hard'];
/** 連線房的人數：2–6（全是真人） */
const PLAYERS = Array.from({ length: MAX_SEATS - ONLINE_MIN_SEATS + 1 }, (_, i) => i + ONLINE_MIN_SEATS);


/**
 * 開局設定：整頁是一張維多利亞時代的拍賣傳單（TauFrame：報紙色的紙、紅色牛津角框）。
 * 上面是主視覺 —— Cruikshank〈Sales by Auction〉（1819）的拍賣場本身（公有領域，附出處）—— 與標題：
 * 中日韓的名字＋肥臉體的「TIME AUCTION」字標（英文版字標直接當標題）；下面是選項，最後一塊紅色版塊「開拍」。
 *
 * 介面照拍賣傳單與拍品票的印刷方式（globals.css 的 .tau-*，Zach 10/22：每款的按鈕要有自己的樣子，不要最後都是黑白按鈕）：
 * 區段標題左右夾細線、選項是方角雙線的票（選中＝紅色版塊）、對手人數是打孔的拍品票、難度用羅馬數字、
 * 開拍是紅色鉛字版塊、怎麼玩是一隻指示手 ☞。桌機（lg）改成左右兩欄。
 *
 * 怎麼玩（右上的問號與最下面那隻指示手）連到規則頁 /time-auction/rules（一條一張圖，2026-10-25），不再開彈窗；換頁不播轉場。
 *
 * 最上面一列跟其他遊戲首頁一樣：左邊平台 logo（回平台首頁）、右邊說明、聯絡我們與語言。
 * 不用 PlatformCorner 釘在畫面角落 —— 那樣會疊在紅色牛津角框上（虎羊棋的教訓），所以放在框裡、跟內容走同一個流。
 * 聯絡與語言的圓鈕和彈窗換成這款的拍賣目錄（TAU_CORNER），不是 Wall Go 的奶油底黑鈕（Zach 10/24）。
 *
 * 「開拍」是跟電腦拍賣；下面一張票「邀請朋友」開連線房：彈窗裡選模式與人數（2–6，坐滿才開拍），
 * 按「開房」就到 /time-auction/online#new=quick-4，在那一頁開房、放邀請連結（AuctionOnline.tsx）。換頁不播轉場。
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
  const router = useRouter();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [players, setPlayers] = useState(2);
  const rulesHref = localePath(locale, trialRules(TIME_AUCTION));
  const openRoom = () => router.push(`${localePath(locale, trialOnline(TIME_AUCTION))}#new=${value.mode}-${players}`);
  const levelNames = [m.solo.level1, m.solo.level2, m.solo.level3];

  const legend = 'tau-head mb-2 w-full text-ink-soft';
  const ROMAN = ['I', 'II', 'III'];
  // 名字本來就是英文（英文版）就讓字標當標題，不重複寫兩次
  const latinTitle = t.nameEn === t.title;

  const modeField = (
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
  );

  return (
    <TauFrame className="items-center px-4 pb-6 pt-3 lg:px-8">
      <div className="flex w-full max-w-[460px] items-center justify-between lg:max-w-[960px]">
        <Link href={localePath(locale, '/')} aria-label={brandName(locale)} title={brandName(locale)} className="transition hover:brightness-110 active:scale-95">
          <PlatformMark mono className="!size-11" />
        </Link>
        <div className="flex gap-1.5">
          <Link href={rulesHref} aria-label={t.howTo} title={t.howTo} className={roundBtn}><LuCircleHelp aria-hidden="true" /></Link>
          <ContactButton theme={TAU_CORNER} />
          <LanguageSwitcher theme={TAU_CORNER} />
        </div>
      </div>

      <main className="mt-3 flex w-full max-w-[460px] flex-col gap-4 lg:my-auto lg:max-w-[960px] lg:flex-row lg:items-center lg:gap-10">
        <header className="flex flex-col lg:flex-1">
          {/* 主視覺：拍賣場本身（自己畫了框線，不再加框）；只有它跟著畫面高度縮 */}
          {/* 出處：George Cruikshank〈Sales by Auction〉（1819），芝加哥藝術博物館，公有領域。畫面上不寫出處（Zach 10/24：插圖不要說明） */}
          <div className="flex flex-col gap-1">
            {/* eslint-disable-next-line @next/next/no-img-element -- 靜態匯出，不需要 next/image */}
            <img src={KEY_ART} alt="" aria-hidden="true" width={818} height={462}
              className="h-[clamp(7rem,21svh,14rem)] w-full rounded-sm object-cover lg:h-auto" />
          </div>
          <div className="mt-3 text-center lg:text-left">
            <p className="text-xs font-bold tracking-wide text-ink-soft">{t.tag}</p>
            {latinTitle ? (
              <h1 className="mt-1.5"><span className="sr-only">{t.title}</span><TauWordmark className="mx-auto h-auto w-[min(100%,22rem)] lg:mx-0" /></h1>
            ) : (
              <h1 className="mt-1 flex flex-col items-center lg:items-start">
                <span className="text-[clamp(2.25rem,5.5svh,3.25rem)] font-black leading-none tracking-[0.04em]">{t.title}</span>
                <span className="sr-only">{t.nameEn}</span>
                <TauWordmark className="mt-2 h-[clamp(1.1rem,2.8svh,1.6rem)] w-auto" />
              </h1>
            )}
            <p className="mt-2 text-sm font-bold">{t.tagline}</p>
          </div>
        </header>

        <section className="flex flex-col gap-4 lg:w-[400px] lg:shrink-0">
          {modeField}

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
          {/* 跟朋友連線：次要的票（墨色雙線），不跟「開拍」搶紅色版塊 */}
          <button type="button" onClick={() => setInviteOpen(true)} className="tau-lot flex h-12 w-full items-center justify-center gap-2 text-base font-black">
            <LuUsers aria-hidden="true" className="text-lg" />{t.onlineTitle}
          </button>
          <Link href={rulesHref} className="tau-hand mx-auto text-sm">
            {t.howTo}
          </Link>
        </section>
      </main>

      <Modal isOpen={inviteOpen} onClose={() => setInviteOpen(false)} title={t.onlineTitle} kicker={t.title}
        icon={LuUsers} band={TAU_BAND} panelClassName={TAU_PANEL}
        footer={<button type="button" onClick={openRoom} className="tau-press h-12 flex-1 text-base font-black">{t.openRoom}</button>}>
        <div className="flex flex-col gap-4">
          <p className="text-sm font-bold leading-relaxed">{t.onlineSub}</p>
          {modeField}
          <fieldset>
            <legend className={legend}>{t.playersLabel}</legend>
            <div role="radiogroup" aria-label={t.playersLabel} className="grid grid-cols-5 gap-2">
              {PLAYERS.map((n) => (
                <button key={n} type="button" role="radio" aria-checked={players === n} onClick={() => setPlayers(n)}
                  className="tau-lot h-12 text-base font-black">
                  {fill(t.playersUnit, { n })}
                </button>
              ))}
            </div>
          </fieldset>
        </div>
      </Modal>
    </TauFrame>
  );
}
