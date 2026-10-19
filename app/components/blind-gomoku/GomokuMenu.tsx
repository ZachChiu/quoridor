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
import { MENU_CLASS, type GomokuMode } from './modeHash';

/**
 * 選模式的畫面（/blind-gomoku 沒帶 hash 時）。版型照 docs/game-first-screen.md 的 B「海報頭＋單色清單」：
 * 上面是遊戲主色（平台卡片同一個粉紅）的色塊＋主視覺，下面的清單只有深墨（推薦：盲棋對電腦）與中性灰。
 * 一個畫面放得下，不捲動；桌機改成左右兩欄。
 *
 * 主視覺 /games/blind-gomoku/key-art.webp 是平台卡片那張（由平台那邊放進 public/）。
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
  const chip = 'rounded-xl bg-tile-cream px-3 py-2 text-sm font-black text-tile-ink transition active:scale-95 fine:hover:brightness-95';

  return (
    // 手機：整頁固定一個畫面高，文字多的語系（英文、泰文會多折一行）由主視覺那格自己縮
    <div className={`${MENU_CLASS} flex h-dvh flex-col items-center px-4 pb-5 pt-[3.75rem] font-[family-name:var(--font-app)] lg:h-auto lg:min-h-dvh lg:flex-row lg:items-center lg:justify-center lg:gap-10 lg:px-10 lg:py-16`}>
      <PlatformCorner locale={locale} />

      {/*
        主色色塊分成上下兩塊（文字、主視覺），手機上用 display: contents 讓兩塊直接當整頁 flex 的子元素：
        這樣只有主視覺那塊會縮（260px 縮到 116px），文字與下面的清單不動；再不夠才讓整頁捲動。
        包成一個 section 的話，色塊的最小高度會被主視覺的 flex-basis 撐住，縮不下去。桌機恢復成一塊、主視覺照原圖 3:2。
      */}
      <div className="contents lg:flex lg:w-full lg:max-w-[520px] lg:flex-col">
        <header className="w-full max-w-[440px] shrink-0 rounded-t-3xl px-5 pt-5 text-tile-ink lg:max-w-none lg:px-8 lg:pt-8" style={{ background: KEY_HEX }}>
          <p className="text-xs font-black tracking-wide opacity-80">{t.tags}</p>
          <h1 className="mt-1.5 text-[clamp(2rem,6dvh,3.5rem)] font-black leading-[1.02] tracking-tight">{t.title}</h1>
          <p className="mt-1 text-base font-black opacity-80 lg:text-lg">{t.subtitle}</p>
          <p className="mt-2 text-sm font-bold lg:text-base">{t.tagline}</p>
        </header>
        <div className="flex max-h-[260px] min-h-[116px] w-full max-w-[440px] flex-[0_1_260px] rounded-b-3xl px-5 pb-5 pt-4 lg:max-h-none lg:max-w-none lg:flex-none lg:px-8 lg:pb-8" style={{ background: KEY_HEX }}>
          <div className="relative w-full overflow-hidden rounded-2xl bg-tile-ink/10 lg:aspect-[3/2]">
            {/* eslint-disable-next-line @next/next/no-img-element -- 靜態匯出，圖已經是 webp，不需要 next/image */}
            <img src="/games/blind-gomoku/key-art.webp" alt="" width={720} height={480} className="absolute inset-0 size-full object-cover"
              onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }} />
          </div>
        </div>
      </div>

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
        band={{ style: { background: KEY_HEX }, fg: 'text-tile-ink' }}>
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
        icon={GiRuleBook} band={{ className: 'bg-tile-forest', fg: 'text-tile-cream' }}>
        <HowToPlay t={t} prev={ui.prev} next={ui.next} done={ui.close} onDone={() => setHelpOpen(false)} />
      </Modal>
    </div>
  );
}
