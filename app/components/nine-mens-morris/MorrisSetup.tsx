'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { GiBrain, GiScrollUnfurled, GiTabletopPlayers } from 'react-icons/gi';
import { LuChevronRight } from 'react-icons/lu';
import LocalName, { letteringOf } from '@/components/LocalName';
import Modal from '@/components/Modal';
import PlatformCorner from '@/components/PlatformCorner';
import { useMessages } from '@/i18n/LocaleProvider';
import { useTextTable } from '@/i18n/gameText';
import { localePath, type Locale } from '@/i18n/locales';
import { NINE_MENS_MORRIS, trialOnline, trialRules } from '@/i18n/routes';
import type { Side } from '@/games/nine-mens-morris/engine';
import type { Difficulty } from '@/games/nine-mens-morris/ai';
import { NAME_LETTERING } from '@/games/nine-mens-morris/nameLettering';
import { newRoomHash } from '@/games/nine-mens-morris/online';
import { TEXT } from '@/games/nine-mens-morris/text';
import { BlackPieceIcon, PieceGlyph, WhitePieceIcon } from './MorrisBoard';
import MorrisFrame from './MorrisFrame';
import { MORRIS_BAND, MORRIS_CORNER, MORRIS_PANEL } from './ui';
import MorrisWordmark from './MorrisWordmark';
import type { MorrisMode } from './session';

/** 主視覺：阿方索十世《遊戲之書》（1283）裡擲骰子的九子棋那頁（公有領域，Wikimedia Commons） */
const ART = '/games/nine-mens-morris/libro.webp';
const LEVELS: Difficulty[] = ['easy', 'normal', 'hard'];

/** 骰子面：難度用一、二、三點（《遊戲之書》有一半在講骰子遊戲）。朱紅點、墨線框 */
function DiePips({ n }: { n: 1 | 2 | 3 }) {
  const pips = n === 1 ? [[12, 12]] : n === 2 ? [[7, 7], [17, 17]] : [[6, 6], [12, 12], [18, 18]];
  return (
    <svg viewBox="0 0 24 24" className="size-7" aria-hidden="true">
      <rect x="1.5" y="1.5" width="21" height="21" rx="4" fill="#eee0c4" stroke="#1e120a" strokeWidth="1.6" />
      {pips.map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="2.4" fill="#c54915" />)}
    </svg>
  );
}


/**
 * 九子棋的開場：選模式。整頁就是《遊戲之書》那幅插圖（MorrisFrame：群青底、最外緣一圈朱紅框），
 * 上面是標題、哥德字標與插圖本身，下面是模式清單。
 *
 * 介面照手抄本做（globals.css 的 .nmm-*，Zach 10/22：每款的按鈕要有自己的樣子）：卡片是拱頂的羊皮紙、
 * 內側一道朱紅細線；模式前面一格上色首字（朱紅、群青交替）；先後手是朱紅的小拱；節目規則的開關是一顆蠟封；
 * 難度用骰子點數；說明與連結前面是朱紅的段落符 ¶。
 * 「怎麼玩？」連到規則頁（/nine-mens-morris/rules，一步一張圖；2026-10-25 起不再開彈窗），一般的 Link、不播轉場。
 * 插圖是唯一會縮的東西（高度跟著 svh：工具列收起時不會跟著變大），手機一個畫面放得下；桌機改成左右兩欄。
 *
 * 邀請朋友（連線對戰）跟本機對戰一樣是一列，按下去在彈窗裡選自己下先手還是後手（兩個朱紅小拱，跟「跟 AI 下」那張卡一樣），
 * 再到 /nine-mens-morris/online 開房。不做成跟「跟 AI 下」一樣的整張卡：手機一個畫面會放不下。
 * 節目規則的開關也管連線：開房的人決定，寫進房間的 setup，進房的人照著下。
 *
 * 中日韓的標題是當地名字，英文名用哥德字標排在下面；英文、泰文的標題本來就是英文名，字標直接當標題。
 * 角落沿用遊戲首頁的 PlatformCorner：左上回平台首頁，右上聯絡我們與語言。
 */
export default function MorrisSetup({ locale, onStart }: { locale: Locale; onStart: (mode: MorrisMode, showRules: boolean) => void }) {
  const t = useTextTable(TEXT);
  const m = useMessages();
  const router = useRouter();
  const [showRules, setShowRules] = useState(false);
  const [side, setSide] = useState<Side | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  // 九子棋裡面換頁不播轉場（直接 router.push），開好房間後網址會換成 #roomId=…
  const invite = (s: Side) => { setInviteOpen(false); router.push(localePath(locale, trialOnline(NINE_MENS_MORRIS)) + newRoomHash(s, showRules)); };
  const levels = [m.solo.level1, m.solo.level2, m.solo.level3];

  const row = 'nmm-arch is-small flex w-full items-center gap-3 px-4 pb-3 pt-4 text-left';
  // 標題本來就是英文名（英文、泰文）就讓字標當標題，不重複寫兩次
  const latinTitle = /^[ -~’]+$/.test(t.title);
  // 中日韓的標題用同一種風格的字（毛筆、古風明朝、宋體）寫成的字標，平台卡片用的是同一份
  const lettering = letteringOf(NAME_LETTERING, locale, t.title);

  return (
    <MorrisFrame className="nmm-setup items-center px-4 pb-6 pt-[3.75rem] lg:justify-center lg:py-10">
      <PlatformCorner locale={locale} theme={MORRIS_CORNER} offset="calc(var(--nmm-frame, 12px) + 6px)" />
      <main className="flex w-full max-w-[440px] flex-col gap-4 lg:max-w-[980px] lg:flex-row lg:items-center lg:gap-12">
        <header className="flex flex-col items-center text-center lg:flex-1 lg:items-start lg:text-left">
          <p className="text-xs font-bold tracking-wide text-[#eee0c4]/80 [@media(max-height:700px)]:hidden">{t.tags}</p>
          {latinTitle ? (
            <h1 className="mt-1.5 w-full">
              <span className="sr-only">{t.title}</span>
              <MorrisWordmark className="mx-auto h-auto w-[min(100%,24rem,52svh)] lg:mx-0" />
              <span className="mt-1.5 block text-base font-black text-[#eee0c4]/90">{t.subtitle}</span>
            </h1>
          ) : (
            <h1 className="mt-1 flex w-full flex-col items-center lg:items-start">
              {lettering ? (
                <>
                  <span className="sr-only">{t.title}</span>
                  <LocalName data={lettering} className="justify-center text-[clamp(2.2rem,6.5svh,3.5rem)] lg:justify-start" />
                </>
              ) : (
                <span className="text-[clamp(2.2rem,6.5svh,3.5rem)] font-black leading-none tracking-[0.06em]">{t.title}</span>
              )}
              <span className="sr-only">{t.subtitle}</span>
              <MorrisWordmark className="mt-2 h-[clamp(1.1rem,3.2svh,1.75rem)] w-auto" />
            </h1>
          )}
          <p className="mt-2 text-sm font-bold text-[#eee0c4]/90 lg:text-base">{t.tagline}</p>
          {/* 主視覺：《遊戲之書》的插圖本身（插圖自己畫了框，不再另外加框）；只有它會跟著畫面高度縮 */}
          {/* 出處：阿方索十世《遊戲之書》（1283），公有領域。畫面上不寫出處（Zach 10/24：插圖不要說明） */}
          <div className="mt-3 flex w-full flex-col items-center gap-1 lg:items-start">
            {/* eslint-disable-next-line @next/next/no-img-element -- 靜態匯出，不需要 next/image */}
            <img src={ART} alt="" aria-hidden="true" width={898} height={638}
              className="h-[clamp(7.5rem,calc(100svh-44.5rem),min(15rem,26svh))] w-auto max-w-full rounded-sm object-contain lg:h-auto lg:w-full" />
          </div>
        </header>

        <div className="flex flex-col gap-3 lg:w-[400px] lg:justify-center">
          {/* 主要模式：一塊拱頂的羊皮紙，前面朱紅的首字；先後手直接是兩個朱紅的小拱，按下去再選難度 */}
          <div className="nmm-arch px-4 pb-4 pt-7">
            <div className="flex items-center gap-3">
              <span className="nmm-initial" aria-hidden="true"><GiBrain /></span>
              <div className="min-w-0">
                <p className="text-lg font-black leading-tight">{t.vsAi}</p>
                <p className="text-xs font-bold text-ink-soft">{t.vsAiNote}</p>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {(['black', 'white'] as const).map((s) => (
                <button key={s} type="button" onClick={() => setSide(s)}
                  className="nmm-arch is-small is-red flex min-h-12 items-center justify-center gap-2 px-2 pb-2.5 pt-3.5 text-sm font-black active:scale-[0.97]">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[#eee0c4]"><PieceGlyph side={s} className="size-[1.1rem]" /></span>
                  {s === 'black' ? t.first : t.second}
                </button>
              ))}
            </div>
          </div>

          <button type="button" onClick={() => onStart({ kind: 'local' }, showRules)} className={`${row} active:scale-[0.99]`}>
            <span className="nmm-initial is-blue" aria-hidden="true"><GiTabletopPlayers /></span>
            <span className="min-w-0 flex-1">
              <span className="block text-base font-black">{t.local}</span>
              <span className="block text-xs font-bold text-ink-soft">{t.localNote}</span>
            </span>
            <LuChevronRight aria-hidden="true" className="shrink-0 text-xl text-ink-soft" />
          </button>

          <button type="button" onClick={() => setInviteOpen(true)} className={`${row} active:scale-[0.99]`}>
            <span className="nmm-initial" aria-hidden="true"><GiScrollUnfurled /></span>
            <span className="min-w-0 flex-1">
              <span className="block text-base font-black">{t.invite}</span>
              <span className="block text-xs font-bold text-ink-soft">{t.inviteNote}</span>
            </span>
            <LuChevronRight aria-hidden="true" className="shrink-0 text-xl text-ink-soft" />
          </button>

          <button type="button" role="switch" aria-checked={showRules} onClick={() => setShowRules(!showRules)} className={row}>
            <span className="min-w-0 flex-1">
              <span className="block text-base font-black">{t.showRules}</span>
              <span className="block text-xs font-bold text-ink-soft">{t.showRulesNote}</span>
            </span>
            {/* 開關是一顆蠟封：關＝空印，開＝朱紅封蠟 */}
            <span aria-hidden="true" className={`nmm-seal ${showRules ? 'is-on' : ''}`}>✓</span>
          </button>

          <Link href={localePath(locale, trialRules(NINE_MENS_MORRIS))} className="nmm-pilcrow self-center px-4 py-2 text-sm font-black text-[#eee0c4] underline decoration-2 underline-offset-4 transition [--nmm-rubric:#eee0c4] hover:text-white">
            {t.howTo}
          </Link>
        </div>
      </main>

      <Modal isOpen={!!side} onClose={() => setSide(null)} title={m.ui.pickLevel} kicker={side === 'white' ? t.second : t.first}
        icon={side === 'white' ? WhitePieceIcon : BlackPieceIcon} band={MORRIS_BAND} panelClassName={MORRIS_PANEL}>
        {/* 三個拱，各畫一面骰子：一點、二點、三點 */}
        <div className="grid w-full grid-cols-3 gap-3">
          {LEVELS.map((d, i) => (
            <button key={d} type="button"
              onClick={() => { if (side) onStart({ kind: 'ai', human: side, difficulty: d }, showRules); setSide(null); }}
              className="nmm-arch is-small flex flex-col items-center gap-2.5 pb-4 pt-6 text-xl font-black active:scale-[0.97]">
              <DiePips n={(i + 1) as 1 | 2 | 3} />
              {levels[i]}
            </button>
          ))}
        </div>
      </Modal>

      {/* 邀請朋友：選自己下哪一邊，跟「跟 AI 下」那張卡同一對朱紅小拱。開了節目規則的話寫在小標，進房的人也照節目規則下 */}
      <Modal isOpen={inviteOpen} onClose={() => setInviteOpen(false)} title={t.pickSide} kicker={showRules ? `${t.invite} · ${t.showRules}` : t.invite}
        icon={GiScrollUnfurled} band={MORRIS_BAND} panelClassName={MORRIS_PANEL}>
        <div className="grid w-full grid-cols-2 gap-3">
          {(['black', 'white'] as const).map((s) => (
            <button key={s} type="button" onClick={() => invite(s)}
              className="nmm-arch is-small is-red flex flex-col items-center gap-2.5 px-2 pb-4 pt-6 text-base font-black active:scale-[0.97]">
              <span className="grid size-11 place-items-center rounded-full bg-[#eee0c4]"><PieceGlyph side={s} className="size-8" /></span>
              {s === 'black' ? t.first : t.second}
            </button>
          ))}
        </div>
      </Modal>
    </MorrisFrame>
  );
}
