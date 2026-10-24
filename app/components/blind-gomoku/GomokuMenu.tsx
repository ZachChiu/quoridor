'use client';
import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { IconType } from 'react-icons';
import { GiBlindfold, GiPaperPlane, GiRobotGolem, GiTabletopPlayers } from 'react-icons/gi';
import { LuChevronRight } from 'react-icons/lu';
import Modal from '@/components/Modal';
import PlatformCorner from '@/components/PlatformCorner';
import { useTextTable } from '@/i18n/gameText';
import { localePath, type Locale } from '@/i18n/locales';
import { BLIND_GOMOKU, trialOnline, trialRules } from '@/i18n/routes';
import { LEVELS } from '@/games/blind-gomoku/ai';
import type { Side } from '@/games/blind-gomoku/engine';
import { newRoomHash } from '@/games/blind-gomoku/online';
import { TEXT } from '@/games/blind-gomoku/text';
import { ColorFace, KEY_HEX, SideFace } from './Stone';
import GomokuFrame from './GomokuFrame';
import { MENU_CLASS, type GomokuMode } from './modeHash';
import { GMK_BAND, GMK_CORNER, GMK_PANEL } from './palette';

/**
 * 選模式的畫面（/blind-gomoku 沒帶 hash 時）。整頁包在拼布畫框裡（GomokuFrame：最外緣一圈包袱巾的布條），
 * 上面是標題與主視覺 —— 主視覺就是那塊 19 世紀的朝鮮包袱巾本身（公有領域，附出處）；
 * 下面的清單照包袱巾的做法（globals.css 的 .gmk-*，Zach 10/22：每款的按鈕要有自己的樣子）：
 * 推薦的盲棋是一塊拼起來的青綠布（左上角桃紅三角、白絲縫線），其他是一塊塊白絲或半透明的苧麻布，邊上一圈平針縫；
 * 難度是縫在一起的小布塊（幾塊青綠就是幾級）；「怎麼玩」底下一道縫線，連到規則頁（/blind-gomoku/rules，原本開說明彈窗）。桌機改成左右兩欄。
 * 邀請朋友：彈窗裡選盲棋或一般、自己執黑或執白，按下去直接換到 /blind-gomoku/online 開房（不播轉場，這款裡面換頁都是直接換）。
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

/** 彈窗裡的一組選項：選中的那塊縫線變成實線的黑絲（同選色盤），沒選的是半透明的苧麻布 */
function Choice({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" role="radio" aria-checked={on} onClick={onClick}
      className={`gmk-patch flex min-h-12 items-center justify-center gap-2 px-3 py-2.5 text-sm font-black active:scale-[0.98] ${
        on ? '![outline-color:#2a2525] ![outline-offset:-4px] ![outline-style:solid] ![outline-width:2px]' : 'is-ramie'
      }`}>
      {children}
    </button>
  );
}

export default function GomokuMenu({ locale, onStart }: { locale: Locale; onStart: (m: GomokuMode) => void }) {
  const t = useTextTable(TEXT);
  const router = useRouter();
  /** 選難度的對象：true 盲棋、false 一般五子棋、null 沒開 */
  const [levelFor, setLevelFor] = useState<boolean | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteBlind, setInviteBlind] = useState(true);
  const [inviteSide, setInviteSide] = useState<Side>('black');
  const chip = 'gmk-patch px-3 py-2 text-sm font-black active:scale-95';
  const openRoom = () => {
    setInviteOpen(false);
    router.push(localePath(locale, trialOnline(BLIND_GOMOKU)) + newRoomHash(inviteBlind, inviteSide));
  };

  return (
    <GomokuFrame className={`${MENU_CLASS} items-center px-4 pb-5 pt-14 lg:flex-row lg:items-center lg:justify-center lg:gap-12 lg:px-10 lg:py-16`}>
      {/* 右上角的聯絡、語言：圓鈕與打開的彈窗都是這款自己的布（GMK_CORNER），不是 Wall Go 的奶油底＋深墨 */}
      <PlatformCorner locale={locale} theme={GMK_CORNER} offset="calc(var(--gmk-frame, 26px) + 6px)" />

      <header className="flex w-full max-w-[440px] flex-col items-center text-center lg:max-w-[520px] lg:items-start lg:text-left">
        <p className="text-xs font-black tracking-wide text-ink-soft">{t.tags}</p>
        <h1 className="mt-1.5 text-[clamp(2rem,6svh,3.5rem)] font-black leading-[1.02] tracking-tight">{t.title}</h1>
        <p className="mt-1 text-base font-black text-ink-soft lg:text-lg">{t.subtitle}</p>
        <p className="mt-2 text-sm font-bold lg:text-base">{t.tagline}</p>
        {/* 主視覺：那塊包袱巾本身；只有它跟著畫面高度縮 */}
        {/* 出處：19 世紀朝鮮拼布包袱巾（조각보），芝加哥藝術博物館，公有領域。畫面上不寫出處（Zach 10/24：插圖不要說明） */}
        <div className="mt-3 flex flex-col items-center gap-1 lg:items-start">
          {/* eslint-disable-next-line @next/next/no-img-element -- 靜態匯出，不需要 next/image */}
          <img src="/games/blind-gomoku/pojagi.webp" alt="" aria-hidden="true" width={750} height={746}
            className="h-[min(14rem,24svh)] w-auto rounded-sm lg:h-auto lg:w-[min(100%,26rem)]" />
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
        <ModeRow icon={GiPaperPlane} title={t.online} desc={t.onlineDesc} onClick={() => setInviteOpen(true)} />
        {/* 怎麼玩：規則頁（一步一張圖配字，10/25 Zach：怎麼玩要換成新頁）；這款裡面換頁不播轉場，用一般的 Link */}
        <Link href={localePath(locale, trialRules(BLIND_GOMOKU))} className="gmk-thread self-center px-3 py-2 text-sm text-ink-soft">
          {t.howTo}
        </Link>
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

      <Modal isOpen={inviteOpen} onClose={() => setInviteOpen(false)} title={t.onlineSetup} kicker={t.online}
        icon={GiPaperPlane} band={GMK_BAND} panelClassName={GMK_PANEL}>
        <div className="flex flex-col gap-4">
          <div>
            <p id="gmk-invite-look" className="text-xs font-black text-ink-soft">{t.look}</p>
            <div role="radiogroup" aria-labelledby="gmk-invite-look" className="mt-1.5 grid grid-cols-2 gap-2">
              {/* 盲棋是兩塊彩色的布、一般是黑白兩顆：看得到的就是那個樣子 */}
              <Choice on={inviteBlind} onClick={() => setInviteBlind(true)}>
                <span aria-hidden="true" className="flex shrink-0 -space-x-1.5"><ColorFace color="pink" className="size-5" /><ColorFace color="green" className="size-5" /></span>{t.blind}
              </Choice>
              <Choice on={!inviteBlind} onClick={() => setInviteBlind(false)}>
                <span aria-hidden="true" className="flex shrink-0 -space-x-1.5"><SideFace side="black" className="size-5" /><SideFace side="white" className="size-5" /></span>{t.classic}
              </Choice>
            </div>
          </div>
          <div>
            <p id="gmk-invite-side" className="text-xs font-black text-ink-soft">{t.sideLabel}</p>
            <div role="radiogroup" aria-labelledby="gmk-invite-side" className="mt-1.5 grid grid-cols-2 gap-2">
              {(['black', 'white'] as const).map((s) => (
                <Choice key={s} on={inviteSide === s} onClick={() => setInviteSide(s)}>
                  <SideFace side={s} className="size-5 shrink-0" />
                  <span className="text-left leading-tight">
                    <span className="block">{s === 'black' ? t.black : t.white}</span>
                    <span className="block text-xs font-bold text-ink-soft">{s === 'black' ? t.movesFirst : t.movesSecond}</span>
                  </span>
                </Choice>
              ))}
            </div>
          </div>
          <button type="button" onClick={openRoom}
            className="gmk-patch is-pieced flex h-12 items-center justify-center gap-2 text-base font-black active:scale-[0.98]">
            {t.createRoom}
          </button>
        </div>
      </Modal>
    </GomokuFrame>
  );
}
