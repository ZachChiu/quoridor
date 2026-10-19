'use client';
import { useState } from 'react';
import { GiBrain, GiTabletopPlayers } from 'react-icons/gi';
import { LuChevronRight } from 'react-icons/lu';
import Modal from '@/components/Modal';
import PlatformCorner from '@/components/PlatformCorner';
import { useMessages } from '@/i18n/LocaleProvider';
import { useTextTable } from '@/i18n/gameText';
import type { Locale } from '@/i18n/locales';
import type { Side } from '@/games/nine-mens-morris/engine';
import type { Difficulty } from '@/games/nine-mens-morris/ai';
import { TEXT } from '@/games/nine-mens-morris/text';
import { BlackPieceIcon, PieceGlyph, WhitePieceIcon } from './MorrisBoard';
import { MorrisRulesModal } from './MorrisRules';
import type { MorrisMode } from './session';

/** 平台卡片同一張 AI 主視覺（彩繪手抄本風） */
const KEY_ART = '/games/nine-mens-morris/key-art.webp';
const LEVELS: Difficulty[] = ['easy', 'normal', 'hard'];

/**
 * 九子棋的開場：選模式。版型照 docs/game-first-screen.md 推薦的 B「海報頭＋單色清單」——
 * 上面是遊戲主色（青金石藍）的海報頭：標題、一句話、主視覺；下面是模式清單，
 * 主要的「跟電腦下」深墨、其餘中性灰，整頁只有主色一個色相。
 * 主視覺是唯一會縮的東西（高度跟著 dvh），手機一個畫面放得下；桌機改成左右兩欄。
 *
 * 角落沿用遊戲首頁的 PlatformCorner：左上回平台首頁，右上聯絡我們與語言。
 */
export default function MorrisSetup({ locale, onStart }: { locale: Locale; onStart: (mode: MorrisMode, showRules: boolean) => void }) {
  const t = useTextTable(TEXT);
  const m = useMessages();
  const [showRules, setShowRules] = useState(false);
  const [side, setSide] = useState<Side | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const levels = [m.solo.level1, m.solo.level2, m.solo.level3];

  const row = 'flex w-full items-center gap-3 rounded-2xl bg-tile-ink/[0.07] px-4 py-3 text-left text-tile-ink transition hover:bg-tile-ink/[0.12]';

  return (
    <div className="nmm-setup flex min-h-dvh flex-col items-center px-4 pb-6 pt-[3.75rem] font-[family-name:var(--font-app)] lg:justify-center lg:py-10">
      <PlatformCorner locale={locale} />
      <main className="flex w-full max-w-[440px] flex-col gap-4 lg:max-w-[980px] lg:flex-row lg:items-stretch lg:gap-10">
        <header className="flex flex-col overflow-hidden rounded-3xl bg-[#1d3b8a] text-tile-cream lg:flex-1">
          <div className="px-5 pb-4 pt-5 lg:px-8 lg:pt-8">
            <p className="text-xs font-bold tracking-wide opacity-80 [@media(max-height:700px)]:hidden">{t.tags}</p>
            <h1 className="mt-1 text-[clamp(2rem,6dvh,3.25rem)] font-black leading-none tracking-tight">{t.title}</h1>
            <p className="mt-1.5 text-base font-black opacity-85 lg:text-lg">{t.subtitle}</p>
            <p className="mt-2 text-sm font-bold lg:text-base">{t.tagline}</p>
          </div>
          {/* 主視覺：只有它會跟著畫面高度縮 */}
          <div className="relative mx-3 mb-3 h-[min(13rem,22dvh)] overflow-hidden rounded-2xl bg-[#e9dcc0] lg:mx-5 lg:mb-5 lg:h-auto lg:min-h-72 lg:flex-1">
            {/* eslint-disable-next-line @next/next/no-img-element -- 靜態匯出，不需要 next/image */}
            <img src={KEY_ART} alt="" aria-hidden="true" className="absolute inset-0 size-full object-cover" />
          </div>
        </header>

        <div className="flex flex-col gap-3 lg:w-[400px] lg:justify-center">
          {/* 主要模式：深墨。先後手直接是兩顆按鈕，按下去再選難度 */}
          <div className="rounded-2xl bg-tile-ink p-4 text-tile-cream">
            <div className="flex items-center gap-3">
              <GiBrain aria-hidden="true" className="shrink-0 text-3xl" />
              <div className="min-w-0">
                <p className="text-lg font-black leading-tight">{t.vsAi}</p>
                <p className="text-xs font-bold opacity-75">{t.vsAiNote}</p>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {(['black', 'white'] as const).map((s) => (
                <button key={s} type="button" onClick={() => setSide(s)}
                  className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-tile-cream px-2 py-2.5 text-sm font-black text-tile-ink transition hover:brightness-95 active:scale-[0.97]">
                  <PieceGlyph side={s} className="size-5 shrink-0" />{s === 'black' ? t.first : t.second}
                </button>
              ))}
            </div>
          </div>

          <button type="button" onClick={() => onStart({ kind: 'local' }, showRules)} className={`${row} active:scale-[0.99]`}>
            <GiTabletopPlayers aria-hidden="true" className="shrink-0 text-3xl" />
            <span className="min-w-0 flex-1">
              <span className="block text-base font-black">{t.local}</span>
              <span className="block text-xs font-bold text-ink-soft">{t.localNote}</span>
            </span>
            <LuChevronRight aria-hidden="true" className="shrink-0 text-xl text-ink-soft" />
          </button>

          <button type="button" role="switch" aria-checked={showRules} onClick={() => setShowRules(!showRules)} className={row}>
            <span className="min-w-0 flex-1">
              <span className="block text-base font-black">{t.showRules}</span>
              <span className="block text-xs font-bold text-ink-soft">{t.showRulesNote}</span>
            </span>
            <span aria-hidden="true" className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${showRules ? 'bg-[#1d3b8a]' : 'bg-tile-ink/20'}`}>
              <span className={`absolute top-1 size-5 rounded-full bg-tile-cream transition-all ${showRules ? 'left-6' : 'left-1'}`} />
            </span>
          </button>

          <button type="button" onClick={() => setHelpOpen(true)} className="self-center rounded-full px-4 py-2 text-sm font-black text-ink-soft underline decoration-2 underline-offset-4 transition hover:text-tile-ink">
            {t.howTo}
          </button>
        </div>
      </main>

      <Modal isOpen={!!side} onClose={() => setSide(null)} title={m.ui.pickLevel} kicker={side === 'white' ? t.second : t.first}
        icon={side === 'white' ? WhitePieceIcon : BlackPieceIcon} band={{ className: 'bg-[#1d3b8a]', fg: 'text-tile-cream' }}>
        {/* 跟共用的 DifficultyButtons 同一個樣子，點數改用這款的主色（一個面板一個色相） */}
        <div className="grid w-full grid-cols-3 gap-3">
          {LEVELS.map((d, i) => (
            <button key={d} type="button"
              onClick={() => { if (side) onStart({ kind: 'ai', human: side, difficulty: d }, showRules); setSide(null); }}
              className="flex flex-col items-center gap-3 rounded-2xl bg-tile-ink/[0.07] py-5 text-xl font-black text-tile-ink transition hover:bg-tile-ink/[0.12] active:scale-[0.97]">
              <span className="flex gap-1.5" aria-hidden="true">
                {LEVELS.map((_, dot) => <span key={dot} className={`size-2.5 rounded-full ${dot <= i ? 'bg-[#1d3b8a]' : 'bg-tile-ink/15'}`} />)}
              </span>
              {levels[i]}
            </button>
          ))}
        </div>
      </Modal>

      <MorrisRulesModal t={t} open={helpOpen} onClose={() => setHelpOpen(false)} showRules={showRules} />
    </div>
  );
}
