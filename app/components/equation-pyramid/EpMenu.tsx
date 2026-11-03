'use client';
import { useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { LuCalendarDays, LuChevronRight } from 'react-icons/lu';
import { GiMayanPyramid, GiStopwatch } from 'react-icons/gi';
import ContactButton from '@/components/ContactButton';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import Modal from '@/components/Modal';
import PlatformMark from '@/components/PlatformMark';
import { brandName } from '@/brand';
import { fill, useTextTable } from '@/i18n/gameText';
import { localePath, type Locale } from '@/i18n/locales';
import { EQUATION_PYRAMID } from '@/i18n/routes';
import { localDate, type CpuLevel } from '@/games/equation-pyramid/engine';
import { TEXT, type EpText } from '@/games/equation-pyramid/text';
import EpFrame from './EpFrame';
import HowToPlay from './HowToPlay';
import type { Mode } from './mode';
import { clock, useDaily } from './records';
import { BAND, EP_CORNER, MODAL_PANEL } from './styles';

const noop = () => () => {};

/**
 * 方程式金字塔的首頁（選模式）。整頁是彩陶牆（EpFrame），主視覺就是原件：卓瑟王階梯金字塔地下墓室的牆磚（Met 48.160.1，CC0；
 * public/games/equation-pyramid/tiles.webp 是那面牆裁掉展示底的一段）。
 *
 * 最上面一排是平台 logo（回平台）與聯絡我們、語言 —— 跟著版面排下來，不浮在畫面上（11/3 Zach：「跟時間拍賣一樣，不是浮著的」）。
 * 模式只有三個：節目規則（主要，深釉；點了先選電腦多快）、每日一題、大金字塔。怎麼玩是文字連結，打開一步一張圖的說明。
 * 每日一題、大金字塔是真的 `<a href="#…">`，點擊在當下交給上層 pushState（WebKit 的返回鍵規則，同騎士巡遊）。
 *
 * 桌機（lg）：左邊是整面牆的直圖（約 72svh 高），右邊一欄放名字與模式，字與按鈕都放大 —— 不讓東西縮在大片底色上（11/3 大話骰被點名）。
 */
export default function EpMenu({ locale, onEnter }: { locale: Locale; onEnter: (mode: Mode) => void }) {
  const t = useTextTable<EpText>(TEXT);
  const today = useSyncExternalStore(noop, () => localDate(new Date()), () => '');
  const done = useDaily(today);
  const [cpuOpen, setCpuOpen] = useState(false);
  const [howOpen, setHowOpen] = useState(false);
  const card = 'flex w-full items-center gap-3 px-4 py-3.5 text-left active:scale-[0.99] lg:gap-4 lg:px-6 lg:py-5';
  const href = (h: string) => `${localePath(locale, EQUATION_PYRAMID)}${h}`;
  const date = today.replace(/^\d{4}-0?(\d+)-0?(\d+)$/, '$1/$2');
  const levels: (CpuLevel | null)[] = ['easy', 'normal', 'hard', null];

  return (
    <EpFrame className="px-4 pb-6 pt-3 lg:px-8 lg:pt-5">
      <div className="flex w-full items-center justify-between">
        <Link href={localePath(locale, '/')} aria-label={brandName(locale)} title={brandName(locale)} className="transition active:scale-95">
          <PlatformMark mono />
        </Link>
        <div className="flex gap-1">
          <ContactButton theme={EP_CORNER} />
          <LanguageSwitcher theme={EP_CORNER} />
        </div>
      </div>

      <main className="mx-auto flex w-full max-w-[440px] flex-1 flex-col items-center justify-center gap-[max(0.9rem,2.2svh)] py-4 lg:max-w-[1180px] lg:flex-row lg:items-center lg:gap-[clamp(3rem,6vw,6rem)]">
        {/* eslint-disable-next-line @next/next/no-img-element -- 靜態匯出，next/image 沒有最佳化可做 */}
        <img src="/games/equation-pyramid/tiles.webp" alt="" width={720} height={1080}
          className="h-[min(24svh,13rem)] w-full rounded-[10px] object-cover object-[50%_40%] lg:aspect-[2/3] lg:h-[min(74svh,46rem)] lg:w-auto lg:max-w-[46%]" />

        <div className="flex w-full flex-col items-center gap-2.5 text-center lg:w-[480px] lg:items-start lg:gap-4 lg:text-left">
          <h1 className="flex flex-col items-center lg:items-start">
            <span className="text-[clamp(2.2rem,6.5svh,3.2rem)] font-black leading-none tracking-[0.04em] text-[#195153] lg:text-[4.2rem]">{t.title}</span>
            {t.subtitle && <span className="mt-1.5 text-[clamp(1rem,2.4svh,1.3rem)] font-bold text-[#327675] lg:text-2xl">{t.subtitle}</span>}
          </h1>
          <p className="text-sm font-bold leading-relaxed opacity-85 md:text-base lg:text-lg">{t.tagline}</p>

          <button type="button" onClick={() => setCpuOpen(true)} className={`${card} ep-deep mt-1`}>
            <GiStopwatch aria-hidden="true" className="shrink-0 text-3xl lg:text-4xl" />
            <span className="min-w-0 flex-1">
              <span className="block text-lg font-black leading-tight lg:text-2xl">{t.show}</span>
              <span className="mt-0.5 block text-sm font-bold opacity-85 lg:text-base">{t.showKicker}</span>
            </span>
            <LuChevronRight aria-hidden="true" className="shrink-0 text-xl opacity-70" />
          </button>
          <a href={href('#daily')} onClick={(e) => { e.preventDefault(); onEnter({ kind: 'daily' }); }} className={`${card} ep-soft`}>
            <LuCalendarDays aria-hidden="true" className="shrink-0 text-3xl text-[#195153] lg:text-4xl" />
            <span className="min-w-0 flex-1">
              <span className="block text-lg font-black leading-tight lg:text-2xl">{t.daily}</span>
              <span className="mt-0.5 block text-sm font-bold opacity-75 lg:text-base">
                {done ? fill(t.dailyDone, { date, k: done.found, n: done.answers, time: clock(done.ms) }) : fill(t.dailyKicker, { date })}
              </span>
            </span>
            <LuChevronRight aria-hidden="true" className="shrink-0 text-xl opacity-60" />
          </a>
          <a href={href('#big')} onClick={(e) => { e.preventDefault(); onEnter({ kind: 'big' }); }} className={`${card} ep-soft`}>
            <GiMayanPyramid aria-hidden="true" className="shrink-0 text-3xl text-[#195153] lg:text-4xl" />
            <span className="min-w-0 flex-1">
              <span className="block text-lg font-black leading-tight lg:text-2xl">{t.big}</span>
              <span className="mt-0.5 block text-sm font-bold opacity-75 lg:text-base">{t.bigKicker}</span>
            </span>
            <LuChevronRight aria-hidden="true" className="shrink-0 text-xl opacity-60" />
          </a>
          <button type="button" onClick={() => setHowOpen(true)} className="px-3 py-2 text-sm font-black underline decoration-1 underline-offset-4 opacity-80 hover:opacity-100 lg:px-0 lg:text-base">
            {t.howTo}
          </button>
        </div>
      </main>

      <Modal isOpen={cpuOpen} onClose={() => setCpuOpen(false)} title={t.pickCpu} kicker={t.title} icon={GiStopwatch} band={BAND} panelClassName={MODAL_PANEL}>
        <p className="mb-3 text-sm font-bold leading-relaxed opacity-80">{t.pickCpuNote}</p>
        <div className="flex flex-col gap-2.5">
          {levels.map((lv) => {
            const info = t.cpuLevels[lv ?? 'solo'];
            return (
              <a key={lv ?? 'solo'} href={href(`#show-${lv ?? 'solo'}`)} onClick={(e) => { e.preventDefault(); setCpuOpen(false); onEnter({ kind: 'show', cpu: lv }); }}
                className={`${card} !py-3 ${lv === 'normal' ? 'ep-deep' : 'ep-soft'}`}>
                <span className="min-w-0 flex-1">
                  <span className="block text-base font-black leading-tight">{info.name}</span>
                  <span className="mt-0.5 block text-xs font-bold opacity-80">{info.note}</span>
                </span>
                <LuChevronRight aria-hidden="true" className="shrink-0 text-lg opacity-60" />
              </a>
            );
          })}
        </div>
      </Modal>
      <HowToPlay open={howOpen} onClose={() => setHowOpen(false)} />
    </EpFrame>
  );
}
