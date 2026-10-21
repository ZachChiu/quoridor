'use client';
import { useState } from 'react';
import type { IconType } from 'react-icons';
import { GiBlindfold, GiRobotGolem, GiRuleBook, GiTabletopPlayers } from 'react-icons/gi';
import { LuChevronRight } from 'react-icons/lu';
import Modal from '@/components/Modal';
import PlatformCorner from '@/components/PlatformCorner';
import { useMessages } from '@/i18n/LocaleProvider';
import { useTextTable } from '@/i18n/gameText';
import type { Locale } from '@/i18n/locales';
import { LEVELS } from '@/games/blind-gomoku/ai';
import { TEXT } from '@/games/blind-gomoku/text';
import { HowToPlay } from './HowToPlay';
import { KEY_HEX } from './Stone';
import GomokuFrame from './GomokuFrame';
import { MENU_CLASS, type GomokuMode } from './modeHash';

/**
 * 選模式的畫面（/blind-gomoku 沒帶 hash 時）。整頁包在拼布畫框裡（GomokuFrame：最外緣一圈包袱巾的布條），
 * 上面是標題與主視覺 —— 主視覺就是那塊 19 世紀的朝鮮包袱巾本身（公有領域，附出處）；
 * 下面的清單只有深墨（推薦：盲棋）與中性灰，彩色的只有外框、包袱巾與棋子。桌機改成左右兩欄。
 */
function ModeRow({ icon: Icon, title, desc, primary, onClick }: { icon: IconType; title: string; desc: string; primary?: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className={`flex min-h-[60px] w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition active:scale-[0.99] ${
        primary ? 'bg-tile-ink text-tile-cream' : 'bg-tile-ink/[0.07] text-tile-ink fine:hover:bg-tile-ink/[0.12]'
      }`}>
      <Icon aria-hidden="true" className="shrink-0 text-3xl" />
      <span className="min-w-0 flex-1">
        <span className="block text-base font-black leading-tight">{title}</span>
        <span className={`mt-0.5 block text-xs font-bold leading-snug ${primary ? 'opacity-75' : 'text-ink-soft'}`}>{desc}</span>
      </span>
      <LuChevronRight aria-hidden="true" className="shrink-0 text-xl opacity-60" />
    </button>
  );
}

export default function GomokuMenu({ locale, onStart }: { locale: Locale; onStart: (m: GomokuMode) => void }) {
  const t = useTextTable(TEXT);
  const ui = useMessages().ui;
  /** 選難度的對象：true 盲棋、false 一般五子棋、null 沒開 */
  const [levelFor, setLevelFor] = useState<boolean | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const chip = 'rounded-xl bg-[#f2e4c9] px-3 py-2 text-sm font-black text-tile-ink transition active:scale-95 fine:hover:brightness-95';

  return (
    <GomokuFrame className={`${MENU_CLASS} items-center px-4 pb-5 pt-14 lg:flex-row lg:items-center lg:justify-center lg:gap-12 lg:px-10 lg:py-16`}>
      <PlatformCorner locale={locale} offset="calc(var(--gmk-frame, 26px) + 6px)" />

      <header className="flex w-full max-w-[440px] flex-col items-center text-center lg:max-w-[520px] lg:items-start lg:text-left">
        <p className="text-xs font-black tracking-wide text-ink-soft">{t.tags}</p>
        <h1 className="mt-1.5 text-[clamp(2rem,6dvh,3.5rem)] font-black leading-[1.02] tracking-tight">{t.title}</h1>
        <p className="mt-1 text-base font-black text-ink-soft lg:text-lg">{t.subtitle}</p>
        <p className="mt-2 text-sm font-bold lg:text-base">{t.tagline}</p>
        {/* 主視覺：那塊包袱巾本身；只有它跟著畫面高度縮 */}
        <figure className="mt-3 flex flex-col items-center gap-1 lg:items-start">
          {/* eslint-disable-next-line @next/next/no-img-element -- 靜態匯出，不需要 next/image */}
          <img src="/games/blind-gomoku/pojagi.webp" alt="" aria-hidden="true" width={750} height={746}
            className="h-[min(14rem,24dvh)] w-auto rounded-sm lg:h-auto lg:w-[min(100%,26rem)]" />
          <figcaption className="text-[11px] font-bold text-ink-soft">{t.artCredit}</figcaption>
        </figure>
      </header>

      <nav aria-label={t.title} className="mt-4 flex w-full max-w-[440px] shrink-0 flex-col gap-2.5 lg:mt-0 lg:w-[400px]">
        <ModeRow primary icon={GiBlindfold} title={t.blindAi} desc={t.blindAiDesc} onClick={() => setLevelFor(true)} />
        <ModeRow icon={GiRobotGolem} title={t.classicAi} desc={t.classicAiDesc} onClick={() => setLevelFor(false)} />
        <div className="flex min-h-[60px] w-full items-center gap-3 rounded-2xl bg-tile-ink/[0.07] py-2.5 pl-4 pr-2.5">
          <GiTabletopPlayers aria-hidden="true" className="shrink-0 text-3xl" />
          <span className="min-w-0 flex-1">
            <span className="block text-base font-black leading-tight">{t.local}</span>
            <span className="mt-0.5 block text-xs font-bold leading-snug text-ink-soft">{t.localDesc}</span>
          </span>
          <span className="flex shrink-0 gap-1.5">
            <button type="button" className={chip} onClick={() => onStart({ opponent: 'local', blind: true })}>{t.blind}</button>
            <button type="button" className={chip} onClick={() => onStart({ opponent: 'local', blind: false })}>{t.classic}</button>
          </span>
        </div>
        <button type="button" onClick={() => setHelpOpen(true)} className="self-center px-3 py-2 text-sm font-black text-ink-soft underline underline-offset-4">
          {t.howTo}
        </button>
      </nav>

      <Modal isOpen={levelFor !== null} onClose={() => setLevelFor(null)} title={t.pickLevel}
        kicker={levelFor ? t.blindAi : t.classicAi} icon={levelFor ? GiBlindfold : GiRobotGolem}
        band={{ style: { background: KEY_HEX }, fg: 'text-[#f2e4c9]' }} panelClassName="!bg-[#f2e4c9]">
        <div className="flex flex-col gap-2.5">
          {LEVELS.map((lv, i) => (
            <button key={lv} type="button"
              onClick={() => { const blind = !!levelFor; setLevelFor(null); onStart({ opponent: 'ai', blind, level: lv }); }}
              className="flex items-center gap-4 rounded-2xl bg-tile-ink/[0.07] px-4 py-3.5 text-left transition active:scale-[0.99] fine:hover:bg-tile-ink/[0.12]">
              {/* 強度用點數講，不另外帶色相（CLAUDE.md：並列的選項不各帶一個顏色） */}
              <span className="flex shrink-0 gap-1" aria-hidden="true">
                {LEVELS.map((_, d) => (
                  <span key={d} className="size-2.5 rounded-full" style={{ background: d <= i ? KEY_HEX : 'rgb(var(--tile-ink) / 0.15)' }} />
                ))}
              </span>
              <span className="min-w-0">
                <span className="block text-lg font-black leading-tight">{t.levels[lv].name}</span>
                <span className="mt-0.5 block text-xs font-bold leading-snug text-ink-soft">{t.levels[lv].desc}</span>
              </span>
            </button>
          ))}
        </div>
      </Modal>

      <Modal isOpen={helpOpen} onClose={() => setHelpOpen(false)} title={t.rules} kicker={t.title}
        icon={GiRuleBook} band={{ style: { background: KEY_HEX }, fg: 'text-[#f2e4c9]' }} panelClassName="!bg-[#f2e4c9]">
        <HowToPlay t={t} prev={ui.prev} next={ui.next} done={ui.close} onDone={() => setHelpOpen(false)} />
      </Modal>
    </GomokuFrame>
  );
}
