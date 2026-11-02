'use client';
import { useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { LuCalendarDays, LuChevronRight } from 'react-icons/lu';
import { GiHexes, GiStopwatch } from 'react-icons/gi';
import ContactButton from '@/components/ContactButton';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import LocalName, { letteringOf } from '@/components/LocalName';
import Modal from '@/components/Modal';
import PlatformMark from '@/components/PlatformMark';
import { brandName } from '@/brand';
import { fill, useTextTable } from '@/i18n/gameText';
import { localePath, type Locale } from '@/i18n/locales';
import { HEXAGON } from '@/i18n/routes';
import { localDate, type Level } from '@/games/hexagon/engine';
import { NAME_LETTERING } from '@/games/hexagon/nameLettering';
import { TEXT, type HexText } from '@/games/hexagon/text';
import HowToPlay from './HowToPlay';
import HxFrame from './HxFrame';
import { useDaily } from './records';
import { BAND, HX_CORNER, MODAL_PANEL } from './styles';

const noop = () => () => {};

/**
 * 六角數字盤的首頁（選模式）。整頁是磁磚牆（HxFrame），主視覺就是原件：伊茲尼克 1535 年左右的六角花磚（Met 40.181.11，CC0），
 * 去背放在釉白上（public/games/hexagon/tile.webp）。
 *
 * 最上面一排是平台 logo（回平台）與聯絡我們、語言 —— 跟著版面排下來，不浮在畫面上（11/3 Zach：「跟時間拍賣一樣，不是浮著的」）。
 * 模式：每日一題（主要，鈷藍）、節目規則、練習（白釉；練習先選難度）。怎麼玩是文字連結，打開一步一張圖的說明。
 * 每日一題、節目規則是真的 `<a href="#…">`，點擊在當下交給上層 pushState（WebKit 的返回鍵規則，同騎士巡遊）。
 */
export default function HexMenu({ locale, onDaily, onShow, onPractice }: {
  locale: Locale;
  onDaily: () => void;
  onShow: () => void;
  onPractice: (level: Level) => void;
}) {
  const t = useTextTable<HexText>(TEXT);
  const lettering = letteringOf(NAME_LETTERING, locale, t.title);
  // 日期只在瀏覽器上算（靜態 HTML 不知道使用者那邊是幾號）
  const today = useSyncExternalStore(noop, () => localDate(new Date()), () => '');
  const done = useDaily(today);
  const [levelOpen, setLevelOpen] = useState(false);
  const [howOpen, setHowOpen] = useState(false);
  const card = 'flex w-full items-center gap-3 px-4 py-3.5 text-left active:scale-[0.99]';
  const href = (h: string) => `${localePath(locale, HEXAGON)}${h}`;
  const date = today.replace(/^\d{4}-0?(\d+)-0?(\d+)$/, '$1/$2');

  return (
    <HxFrame className="px-4 pb-6 pt-3">
      <div className="flex w-full items-center justify-between">
        <Link href={localePath(locale, '/')} aria-label={brandName(locale)} title={brandName(locale)} className="transition active:scale-95">
          <PlatformMark mono />
        </Link>
        <div className="flex gap-1">
          <ContactButton theme={HX_CORNER} />
          <LanguageSwitcher theme={HX_CORNER} />
        </div>
      </div>

      <main className="mx-auto flex w-full max-w-[440px] flex-1 flex-col items-center justify-center gap-[max(0.9rem,2.4svh)] py-4 lg:max-w-[960px] lg:flex-row lg:gap-16">
        <div className="w-[min(100%,20rem,36svh)] lg:w-[min(26rem,60svh)]">
          {/* eslint-disable-next-line @next/next/no-img-element -- 靜態匯出，next/image 沒有最佳化可做 */}
          <img src="/games/hexagon/tile.webp" alt="" width={720} height={622} className="h-auto w-full" />
        </div>

        <div className="flex w-full flex-col items-center gap-2.5 text-center lg:w-[400px]">
          <h1 className="flex w-full flex-col items-center">
            {lettering ? (
              <>
                <span className="sr-only">{t.title}</span>
                <LocalName data={lettering} className="justify-center text-[clamp(2.2rem,6.5svh,3.5rem)] text-[#2a5b8a]" />
              </>
            ) : (
              <span className="text-[clamp(2.2rem,6.5svh,3.5rem)] font-black leading-none tracking-[0.04em] text-[#2a5b8a]">{t.title}</span>
            )}
            {t.subtitle && <span className="mt-1 text-[clamp(1rem,2.6svh,1.4rem)] font-bold text-[#4f6b67]">{t.subtitle}</span>}
          </h1>
          <p className="text-sm font-bold leading-relaxed opacity-85 md:text-base">{t.tagline}</p>

          <a href={href('#daily')} onClick={(e) => { e.preventDefault(); onDaily(); }} className={`${card} hx-cobalt mt-1`}>
            <LuCalendarDays aria-hidden="true" className="shrink-0 text-3xl" />
            <span className="min-w-0 flex-1">
              <span className="block text-lg font-black leading-tight">{t.daily}</span>
              <span className="mt-0.5 block text-sm font-bold opacity-85">
                {done ? fill(t.dailyDone, { date, score: done.score }) : fill(t.dailyKicker, { date })}
              </span>
            </span>
            <LuChevronRight aria-hidden="true" className="shrink-0 text-xl opacity-70" />
          </a>
          <a href={href('#show')} onClick={(e) => { e.preventDefault(); onShow(); }} className={`${card} hx-tile`}>
            <GiStopwatch aria-hidden="true" className="shrink-0 text-3xl text-[#2a5b8a]" />
            <span className="min-w-0 flex-1">
              <span className="block text-lg font-black leading-tight">{t.show}</span>
              <span className="mt-0.5 block text-sm font-bold opacity-75">{t.showKicker}</span>
            </span>
            <LuChevronRight aria-hidden="true" className="shrink-0 text-xl opacity-60" />
          </a>
          <button type="button" onClick={() => setLevelOpen(true)} className={`${card} hx-tile`}>
            <GiHexes aria-hidden="true" className="shrink-0 text-3xl text-[#2a5b8a]" />
            <span className="min-w-0 flex-1">
              <span className="block text-lg font-black leading-tight">{t.practice}</span>
              <span className="mt-0.5 block text-sm font-bold opacity-75">{t.practiceKicker}</span>
            </span>
            <LuChevronRight aria-hidden="true" className="shrink-0 text-xl opacity-60" />
          </button>
          <button type="button" onClick={() => setHowOpen(true)} className="px-3 py-2 text-sm font-black underline decoration-1 underline-offset-4 opacity-80 hover:opacity-100">
            {t.howTo}
          </button>
        </div>
      </main>

      <Modal isOpen={levelOpen} onClose={() => setLevelOpen(false)} title={t.pickLevel} kicker={t.title} icon={GiHexes} band={BAND} panelClassName={MODAL_PANEL}>
        <div className="flex flex-col gap-2.5">
          {(['easy', 'normal', 'hard'] as const).map((lv) => (
            <a key={lv} href={href(`#practice-${lv}`)} onClick={(e) => { e.preventDefault(); setLevelOpen(false); onPractice(lv); }}
              className={`${card} ${lv === 'normal' ? 'hx-cobalt' : 'hx-tile'}`}>
              <span className="min-w-0 flex-1">
                <span className="block text-base font-black leading-tight">{t.levels[lv].name}</span>
                <span className="mt-0.5 block text-xs font-bold opacity-80">{t.levels[lv].note}</span>
              </span>
              <LuChevronRight aria-hidden="true" className="shrink-0 text-lg opacity-60" />
            </a>
          ))}
        </div>
      </Modal>
      <HowToPlay open={howOpen} onClose={() => setHowOpen(false)} />
    </HxFrame>
  );
}
