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
import MorrisFrame from './MorrisFrame';
import MorrisWordmark from './MorrisWordmark';
import { MorrisRulesModal } from './MorrisRules';
import type { MorrisMode } from './session';

/** 主視覺：阿方索十世《遊戲之書》（1283）裡擲骰子的九子棋那頁（公有領域，Wikimedia Commons） */
const ART = '/games/nine-mens-morris/libro.webp';
const LEVELS: Difficulty[] = ['easy', 'normal', 'hard'];

/**
 * 九子棋的開場：選模式。整頁就是《遊戲之書》那幅插圖（MorrisFrame：群青底、最外緣一圈朱紅框），
 * 上面是標題、哥德字標與插圖本身，下面是模式清單 —— 羊皮紙色的卡片、沒有框線；
 * 主要的「跟 AI 下」深墨、其餘羊皮紙（照 Wall Go：主要深墨、次要中性）。
 * 插圖是唯一會縮的東西（高度跟著 dvh），手機一個畫面放得下；桌機改成左右兩欄。
 *
 * 中日韓的標題是當地名字，英文名用哥德字標排在下面；英文、泰文的標題本來就是英文名，字標直接當標題。
 * 角落沿用遊戲首頁的 PlatformCorner：左上回平台首頁，右上聯絡我們與語言。
 */
export default function MorrisSetup({ locale, onStart }: { locale: Locale; onStart: (mode: MorrisMode, showRules: boolean) => void }) {
  const t = useTextTable(TEXT);
  const m = useMessages();
  const [showRules, setShowRules] = useState(false);
  const [side, setSide] = useState<Side | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const levels = [m.solo.level1, m.solo.level2, m.solo.level3];

  const row = 'flex w-full items-center gap-3 rounded-2xl bg-[#eee0c4] px-4 py-3 text-left text-[#1e120a] transition hover:bg-[#e3c99c]';
  // 標題本來就是英文名（英文、泰文）就讓字標當標題，不重複寫兩次
  const latinTitle = /^[ -~’]+$/.test(t.title);

  return (
    <MorrisFrame className="nmm-setup items-center px-4 pb-6 pt-[3.75rem] lg:justify-center lg:py-10">
      <PlatformCorner locale={locale} buttonClassName="bg-[#eee0c4] text-[#1e120a] hover:bg-[#e3c99c]" />
      <main className="flex w-full max-w-[440px] flex-col gap-4 lg:max-w-[980px] lg:flex-row lg:items-center lg:gap-12">
        <header className="flex flex-col items-center text-center lg:flex-1 lg:items-start lg:text-left">
          <p className="text-xs font-bold tracking-wide text-[#eee0c4]/80 [@media(max-height:700px)]:hidden">{t.tags}</p>
          {latinTitle ? (
            <h1 className="mt-1.5 w-full">
              <span className="sr-only">{t.title}</span>
              <MorrisWordmark className="mx-auto h-auto w-[min(100%,24rem,52dvh)] lg:mx-0" />
              <span className="mt-1.5 block text-base font-black text-[#eee0c4]/90">{t.subtitle}</span>
            </h1>
          ) : (
            <h1 className="mt-1 flex flex-col items-center lg:items-start">
              <span className="text-[clamp(2.2rem,6.5dvh,3.5rem)] font-black leading-none tracking-[0.06em]">{t.title}</span>
              <span className="sr-only">{t.subtitle}</span>
              <MorrisWordmark className="mt-2 h-[clamp(1.1rem,3.2dvh,1.75rem)] w-auto" />
            </h1>
          )}
          <p className="mt-2 text-sm font-bold text-[#eee0c4]/90 lg:text-base">{t.tagline}</p>
          {/* 主視覺：《遊戲之書》的插圖本身（插圖自己畫了框，不再另外加框）；只有它會跟著畫面高度縮 */}
          <figure className="mt-3 flex w-full flex-col items-center gap-1 lg:items-start">
            {/* eslint-disable-next-line @next/next/no-img-element -- 靜態匯出，不需要 next/image */}
            <img src={ART} alt="" aria-hidden="true" width={898} height={638}
              className="h-[min(15rem,26dvh)] w-auto max-w-full rounded-sm object-contain lg:h-auto lg:w-full" />
            <figcaption className="text-[11px] font-bold text-[#eee0c4]/70">{t.artCredit}</figcaption>
          </figure>
        </header>

        <div className="flex flex-col gap-3 lg:w-[400px] lg:justify-center">
          {/* 主要模式：深墨。先後手直接是兩顆按鈕，按下去再選難度 */}
          <div className="rounded-2xl bg-[#1e120a] p-4 text-[#eee0c4]">
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
                  className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#eee0c4] px-2 py-2.5 text-sm font-black text-[#1e120a] transition hover:bg-[#e3c99c] active:scale-[0.97]">
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
            <span aria-hidden="true" className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${showRules ? 'bg-[#4b4577]' : 'bg-[#1e120a]/20'}`}>
              <span className={`absolute top-1 size-5 rounded-full bg-[#eee0c4] transition-all ${showRules ? 'left-6' : 'left-1'}`} />
            </span>
          </button>

          <button type="button" onClick={() => setHelpOpen(true)} className="self-center rounded-full px-4 py-2 text-sm font-black text-[#eee0c4] underline decoration-2 underline-offset-4 transition hover:text-white">
            {t.howTo}
          </button>
        </div>
      </main>

      <Modal isOpen={!!side} onClose={() => setSide(null)} title={m.ui.pickLevel} kicker={side === 'white' ? t.second : t.first}
        icon={side === 'white' ? WhitePieceIcon : BlackPieceIcon} band={{ className: 'bg-[#4b4577]', fg: 'text-[#eee0c4]' }}
        panelClassName="!bg-[#eee0c4]">
        {/* 跟共用的 DifficultyButtons 同一個樣子，點數用插圖的群青（一個面板一個色相） */}
        <div className="grid w-full grid-cols-3 gap-3">
          {LEVELS.map((d, i) => (
            <button key={d} type="button"
              onClick={() => { if (side) onStart({ kind: 'ai', human: side, difficulty: d }, showRules); setSide(null); }}
              className="flex flex-col items-center gap-3 rounded-2xl bg-[#1e120a]/[0.07] py-5 text-xl font-black text-[#1e120a] transition hover:bg-[#1e120a]/[0.12] active:scale-[0.97]">
              <span className="flex gap-1.5" aria-hidden="true">
                {LEVELS.map((_, dot) => <span key={dot} className={`size-2.5 rounded-full ${dot <= i ? 'bg-[#4b4577]' : 'bg-[#1e120a]/15'}`} />)}
              </span>
              {levels[i]}
            </button>
          ))}
        </div>
      </Modal>

      <MorrisRulesModal t={t} open={helpOpen} onClose={() => setHelpOpen(false)} showRules={showRules} />
    </MorrisFrame>
  );
}
