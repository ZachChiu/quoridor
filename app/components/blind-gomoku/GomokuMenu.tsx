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
import { GMK_BAND, GMK_CORNER, GMK_PANEL } from './palette';

/**
 * 選模式的畫面（/blind-gomoku 沒帶 hash 時）。整頁包在拼布畫框裡（GomokuFrame：最外緣一圈包袱巾的布條），
 * 上面是標題與主視覺 —— 主視覺就是那塊 19 世紀的朝鮮包袱巾本身（公有領域，附出處）；
 * 下面的清單照包袱巾的做法（globals.css 的 .gmk-*，Zach 10/22：每款的按鈕要有自己的樣子）：
 * 推薦的盲棋是一塊拼起來的青綠布（左上角桃紅三角、白絲縫線），其他是一塊塊白絲或半透明的苧麻布，邊上一圈平針縫；
 * 難度是縫在一起的小布塊（幾塊青綠就是幾級）；「怎麼玩」底下一道縫線。桌機改成左右兩欄。
 */
function ModeRow({ icon: Icon, title, desc, primary, onClick }: { icon: IconType; title: string; desc: string; primary?: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className={`gmk-patch flex min-h-[60px] w-full items-center gap-3 py-3 pr-4 text-left active:scale-[0.99] ${primary ? 'is-pieced pl-8' : 'pl-4'}`}>
      <Icon aria-hidden="true" className="shrink-0 text-3xl" />
      <span className="min-w-0 flex-1">
        <span className="block text-base font-black leading-tight">{title}</span>
        <span className={`mt-0.5 block text-xs font-bold leading-snug ${primary ? 'opacity-80' : 'text-ink-soft'}`}>{desc}</span>
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
  const chip = 'gmk-patch px-3 py-2 text-sm font-black active:scale-95';

  return (
    <GomokuFrame className={`${MENU_CLASS} items-center px-4 pb-5 pt-14 lg:flex-row lg:items-center lg:justify-center lg:gap-12 lg:px-10 lg:py-16`}>
      {/* 右上角的聯絡、語言：圓鈕與打開的彈窗都是這款自己的布（GMK_CORNER），不是 Wall Go 的奶油底＋深墨 */}
      <PlatformCorner locale={locale} theme={GMK_CORNER} offset="calc(var(--gmk-frame, 26px) + 6px)" />

      <header className="flex w-full max-w-[440px] flex-col items-center text-center lg:max-w-[520px] lg:items-start lg:text-left">
        <p className="text-xs font-black tracking-wide text-ink-soft">{t.tags}</p>
        <h1 className="mt-1.5 text-[clamp(2rem,6dvh,3.5rem)] font-black leading-[1.02] tracking-tight">{t.title}</h1>
        <p className="mt-1 text-base font-black text-ink-soft lg:text-lg">{t.subtitle}</p>
        <p className="mt-2 text-sm font-bold lg:text-base">{t.tagline}</p>
        {/* 主視覺：那塊包袱巾本身；只有它跟著畫面高度縮 */}
        {/* 出處：19 世紀朝鮮拼布包袱巾（조각보），芝加哥藝術博物館，公有領域。畫面上不寫出處（Zach 10/24：插圖不要說明） */}
        <div className="mt-3 flex flex-col items-center gap-1 lg:items-start">
          {/* eslint-disable-next-line @next/next/no-img-element -- 靜態匯出，不需要 next/image */}
          <img src="/games/blind-gomoku/pojagi.webp" alt="" aria-hidden="true" width={750} height={746}
            className="h-[min(14rem,24dvh)] w-auto rounded-sm lg:h-auto lg:w-[min(100%,26rem)]" />
        </div>
      </header>

      <nav aria-label={t.title} className="mt-4 flex w-full max-w-[440px] shrink-0 flex-col gap-2.5 lg:mt-0 lg:w-[400px]">
        <ModeRow primary icon={GiBlindfold} title={t.blindAi} desc={t.blindAiDesc} onClick={() => setLevelFor(true)} />
        <ModeRow icon={GiRobotGolem} title={t.classicAi} desc={t.classicAiDesc} onClick={() => setLevelFor(false)} />
        <div className="gmk-patch is-ramie flex min-h-[60px] w-full items-center gap-3 py-2.5 pl-4 pr-2.5">
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
        <button type="button" onClick={() => setHelpOpen(true)} className="gmk-thread self-center px-3 py-2 text-sm text-ink-soft">
          {t.howTo}
        </button>
      </nav>

      <Modal isOpen={levelFor !== null} onClose={() => setLevelFor(null)} title={t.pickLevel}
        kicker={levelFor ? t.blindAi : t.classicAi} icon={levelFor ? GiBlindfold : GiRobotGolem}
        band={GMK_BAND} panelClassName={GMK_PANEL}>
        <div className="flex flex-col gap-2.5">
          {LEVELS.map((lv, i) => (
            <button key={lv} type="button"
              onClick={() => { const blind = !!levelFor; setLevelFor(null); onStart({ opponent: 'ai', blind, level: lv }); }}
              className="gmk-patch flex items-center gap-4 px-4 py-3.5 text-left active:scale-[0.99]">
              {/* 強度是縫在一起的三小塊布：幾塊青綠就是幾級（布塊之間一道白絲縫） */}
              <span className="flex shrink-0 gap-px bg-[#f2e4c9] p-px shadow-[inset_0_0_0_1px_rgb(42_37_37/0.25)]" aria-hidden="true">
                {LEVELS.map((_, d) => (
                  <span key={d} className="h-4 w-3" style={{ background: d <= i ? KEY_HEX : 'rgb(42 37 37 / 0.12)' }} />
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
        icon={GiRuleBook} band={GMK_BAND} panelClassName={GMK_PANEL}>
        <HowToPlay t={t} prev={ui.prev} next={ui.next} done={ui.close} onDone={() => setHelpOpen(false)} />
      </Modal>
    </GomokuFrame>
  );
}
