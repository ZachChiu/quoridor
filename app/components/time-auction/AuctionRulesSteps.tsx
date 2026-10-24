'use client';
import { useEffect, useState } from 'react';
import { useMessages } from '@/i18n/LocaleProvider';
import { fill, useTextTable } from '@/i18n/gameText';
import { MODES, formatTenths, type Mode, type ModeConfig } from '@/games/time-auction/engine';
import { PRESS_WAIT_MS } from '@/games/time-auction/online';
import { TEXT } from '@/games/time-auction/text';
import { useStep, useSwipePager } from '@/hook/useSwipePager';
import { BigTime } from './AuctionParts';
import { KEY_BG } from './theme';

/**
 * 時間拍賣的「怎麼玩」：七條規則一條一張圖（2026-10-25 Zach：「怎麼玩都沒有換新頁，最好跟 Wall Go 一樣圖配字」）。
 * 規則頁（全部攤開，RulesStepsList）與對局中的說明彈窗（一次一步、可以左右滑，RulesStepsPaged）共用同一份。
 *
 * 圖是這款自己的介面零件擺出來的靜態畫面，不是另外畫的插圖：大螢幕的 Didone 數字（BigTime）、
 * 競買人名片（.tau-bidder，自己那張紅框）、成交章（.tau-stamp）、按住中的大按鈕（.tau-press.is-holding）、排名表（第一名紅色版塊）。
 * 顏色只有紙、墨、紅（theme.ts）。名片一律寫「競買人」（號碼看 No.），連線、單人都說得通。
 *
 * **圖上看不出誰還按著**（這款的核心是看不到）：按住、計時的圖只畫自己的按鈕；「看不到別人」那張畫自己放手後在等，
 * 大螢幕照跑、別人的名片什麼記號都沒有。「每個人都要付」只畫自己（沒得標）與得標者 —— 得標秒數本來就會公布，
 * 兩個數字都是玩家真的會知道的事，不會讓人以為別人的出價看得到。
 *
 * 時間與倒數照模式帶進去：規則頁用節目局（每人 10 分鐘、倒數 5 秒，頁首寫明）、彈窗用這一局的模式。
 */
type T = (typeof TEXT)['zh-TW'];
export const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];

type Step = { title: string; body: string; notes: string[] };

/**
 * 每一步的字：小標、規則本文（rules 那七條，照模式帶入時間）、底下的小字。
 * 小字：第二步（按住）放操作方式、連線再加等人的規則；彈窗的第六步（看不到）放這一局的模式差別 ——
 * 規則頁另有一段「模式」，就不重複。
 */
export function auctionSteps(t: T, cfg: ModeConfig, { online = false, modal = false } = {}): Step[] {
  const vars = { budget: fill(t.minutes, { n: cfg.budget / 600 }), countdown: cfg.countdownMs / 1000 };
  return t.rules.map((rule, i) => ({
    title: t.stepTitles[i],
    body: fill(rule, vars),
    notes: i === 1 ? [t.controls, ...(online ? [fill(t.rulesOnline, { wait: PRESS_WAIT_MS / 1000 })] : [])]
      : i === 5 && modal ? [cfg.showRemaining ? t.rulesQuick : t.rulesShow]
      : [],
  }));
}

/** 競買人名片（同 AuctionParts 的 BidderCards 一張）：No.、「競買人」、標記數、底下一行小字；得標的蓋紅色成交章 */
function Card({ t, no, tokens, me = false, note, stamp = false }: { t: T; no: number; tokens: number; me?: boolean; note?: string; stamp?: boolean }) {
  return (
    <div className={`tau-bidder px-3 py-2 text-left text-[#35331c] ${me ? 'is-me' : ''}`}>
      <div className="flex items-baseline justify-between gap-2">
        <span className="flex min-w-0 items-baseline gap-1.5">
          <span className="tau-display shrink-0 text-[11px] italic text-ink-soft">No.{no}</span>
          <span className="truncate text-xs font-black">{t.bidder}</span>
        </span>
        <span className="text-2xl font-black leading-none">{tokens}</span>
      </div>
      {note && <p className="mt-0.5 truncate text-[11px] font-bold text-ink-soft">{note}</p>}
      {stamp && <span className="tau-stamp absolute -bottom-2.5 -right-1 z-10 text-xs">{t.stampWon}</span>}
    </div>
  );
}

/** 大螢幕下面那一行狀態（對局裡的 status／sub） */
function Status({ text, sub, small = false }: { text: string; sub?: string; small?: boolean }) {
  return (
    <div className="text-balance text-center">
      <p className={`${small ? 'text-xs' : 'text-sm'} font-black leading-snug`}>{text}</p>
      {sub && <p className="mt-0.5 text-xs font-bold text-ink-soft">{sub}</p>}
    </div>
  );
}

/** 按住中的大按鈕：墨色版塊、金色內線（.tau-press.is-holding），只是畫面，不能按 */
function Holding({ t }: { t: T }) {
  return <div className="tau-press is-holding mt-1 flex h-14 w-full items-center justify-center text-base font-black">{t.holdingBtn}</div>;
}

/** 一步一張圖。全部 aria-hidden（字已經講了一次） */
function Figure({ n, t, cfg, online }: { n: number; t: T; cfg: ModeConfig; online: boolean }) {
  const fmt = formatTenths;
  const player = (no: number) => fill(t.player, { n: no });
  switch (n) {
    // 每人一筆時間：對局最上面那行（第 1 / 19 回合）＋ 四張名片都是同一筆時間、0 枚標記
    case 0:
      return (
        <div className="flex flex-col gap-3">
          <div className="text-center">
            <p className="text-base font-black leading-tight">{t.title}</p>
            <p className="text-[11px] font-bold text-ink-soft">{fill(t.roundOf, { n: 1, total: cfg.rounds })}</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[1, 2, 3, 4].map((no) => <Card key={no} t={t} no={no} tokens={0} me={no === 1} note={fill(t.left, { t: fmt(cfg.budget) })} />)}
          </div>
        </div>
      );
    // 先按住、倒數：倒數的數字＋「現在放手＝不參加」＋ 按住中的按鈕
    case 1:
      return (
        <div className="flex flex-col items-center gap-2">
          <span className="tau-display text-[4rem] font-bold leading-none">{cfg.countdownMs / 1000}</span>
          <Status text={t.countdown} />
          <Holding t={t} />
        </div>
      );
    // 計時：大螢幕跑秒＋「放手的那一刻就是出價」＋ 按住中的按鈕
    case 2:
      return (
        <div className="flex flex-col items-center gap-2">
          <div className="flex h-16 items-center text-[3.25rem]"><BigTime text={fmt(124)} /></div>
          <Status text={online ? t.holdingOnline : t.holding} />
          <Holding t={t} />
        </div>
      );
    // 最後放手的人得標（左）／最高出價同秒流標（右，大螢幕右上蓋墨色的章，同對局）
    case 3:
      return (
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-10 items-center text-[2rem]"><BigTime text={fmt(317)} /></div>
            <Status small text={fill(t.winOther, { name: player(3) })} />
            <div className="mt-1 w-full"><Card t={t} no={3} tokens={1} stamp /></div>
          </div>
          <div className="flex flex-col items-center gap-2 border-l border-dotted border-[#35331c]/30 pl-3">
            <div className="relative flex h-10 items-center text-[2rem]">
              <BigTime text={fmt(200)} />
              <span className="tau-stamp absolute -right-2 -top-3 z-10 text-[11px] !text-[#35331c]">{t.historyTie}</span>
            </div>
            <Status small text={t.tie} />
          </div>
        </div>
      );
    // 每個人都要付：自己（沒得標）與得標者，各自付掉自己按住的秒數
    case 4:
      return (
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-10 items-center text-[2rem]"><BigTime text={fmt(317)} /></div>
          <div className="grid w-full grid-cols-2 gap-3">
            {[{ no: 1, bid: 290, me: true }, { no: 3, bid: 317, won: true }].map((c) => (
              <div key={c.no} className="flex flex-col gap-2">
                <Card t={t} no={c.no} tokens={c.won ? 1 : 0} me={c.me} note={fill(t.bidLocked, { t: fmt(c.bid) })} stamp={c.won} />
                <span className="tau-display text-center text-2xl font-bold text-[#92383a]">−{fmt(c.bid)}</span>
              </div>
            ))}
          </div>
        </div>
      );
    // 看不到別人：自己放手了、在等；大螢幕照跑，別人的名片什麼記號都沒有
    case 5:
      return (
        <div className="flex flex-col items-center gap-2">
          <div className="flex h-12 items-center text-[2.5rem]"><BigTime text={fmt(186)} /></div>
          <Status text={online ? t.letGo : t.released} sub={t.waiting} />
          <div className="mt-1 grid w-full grid-cols-2 gap-2">
            {[2, 1, 3, 1].map((tokens, i) => <Card key={i} t={t} no={i + 1} tokens={tokens} me={i === 0} />)}
          </div>
        </div>
      );
    // 19 回合後比標記：排名表（第一名紅色版塊）；前兩名標記一樣多，剩餘時間多的排前面。自己那行一顆紅點
    default: {
      const rows = [
        { rank: 1, no: 3, tokens: 6, left: Math.round(cfg.budget * 0.104) },
        { rank: 2, no: 1, tokens: 6, left: Math.round(cfg.budget * 0.071), me: true },
        { rank: 3, no: 4, tokens: 4, left: Math.round(cfg.budget * 0.236) },
        { rank: 4, no: 2, tokens: 3, left: 0 },
      ];
      return (
        <div className="flex flex-col gap-1.5">
          <p className="tau-head text-ink-soft">{t.standingsTitle}</p>
          <div className="flex items-baseline gap-2 px-2 text-[10px] font-black text-ink-soft">
            <span className="flex-1" />
            <span className="w-12 text-right">{t.tokensCol}</span>
            <span className="w-16 text-right">{t.leftCol}</span>
          </div>
          <ol className="flex flex-col">
            {rows.map((r) => (
              <li key={r.no} className={`flex items-center gap-2 rounded-[2px] px-2 py-1.5 ${r.rank === 1 ? `${KEY_BG} text-[#ebe1b8]` : 'border-b border-dotted border-[#35331c]/30 last:border-b-0'}`}>
                <span className="tau-display w-4 shrink-0 text-lg font-bold italic leading-none">{r.rank}</span>
                <span className="flex min-w-0 flex-1 items-baseline gap-1.5">
                  <span className={`tau-display shrink-0 text-[11px] italic ${r.rank === 1 ? 'text-[#ebe1b8]/80' : 'text-ink-soft'}`}>No.{r.no}</span>
                  <span className="truncate text-xs font-black">{t.bidder}</span>
                  {r.me && <span className={`size-2 shrink-0 self-center rounded-full ${KEY_BG}`} />}
                </span>
                <span className="w-12 shrink-0 text-right text-lg font-black leading-none">{r.tokens}</span>
                <span className="tau-display w-16 shrink-0 text-right text-sm font-bold">{fmt(r.left)}</span>
              </li>
            ))}
          </ol>
        </div>
      );
    }
  }
}

/** 全部攤開（規則頁）：一條一張圖配字，桌機圖在左、字在右；條與條之間一道雙線（拍賣目錄分拍品的方式） */
export function RulesStepsList({ mode = 'show' }: { mode?: Mode }) {
  const t = useTextTable(TEXT);
  const cfg = MODES[mode];
  const steps = auctionSteps(t, cfg);
  return (
    <ol className="flex flex-col">
      {steps.map((s, i) => (
        <li key={i} className="grid gap-4 border-t-[3px] border-double border-[#35331c]/55 py-6 md:grid-cols-[300px_1fr] md:items-start md:gap-8">
          <div aria-hidden="true" className="tau-box mx-auto w-full max-w-[320px] px-4 py-5 md:mx-0">
            <Figure n={i} t={t} cfg={cfg} online={false} />
          </div>
          <div>
            <h2 className="flex items-baseline gap-2.5 text-xl font-black leading-snug">
              <span aria-hidden="true" className="tau-display shrink-0 text-2xl font-bold italic">{ROMAN[i]}.</span>
              <span>{s.title}</span>
            </h2>
            <p className="mt-2 text-base font-bold leading-relaxed">{s.body}</p>
            {s.notes.map((note) => <p key={note} className="mt-2 text-sm font-bold leading-relaxed text-ink-soft">{note}</p>)}
          </div>
        </li>
      ))}
    </ol>
  );
}

/**
 * 一次一步（對局中的說明彈窗）：七張並排在一條軌道上，手指左右拖（hook/useSwipePager.ts，同 Wall Go、虎棋），
 * 也可以按下面的鈕、點羅馬數字的頁碼，或用左右方向鍵。時間照這一局的模式帶入；不放會離開對局的連結。
 * 彈窗關著時內容仍掛在頁面上（Modal 只加 inert），所以要 `open`：開著才聽方向鍵、每次打開從第一步開始。
 * 頁碼是目錄的羅馬數字（目前這一頁紅字＋底線）；上一步是墨色雙線的票（.tau-lot）、下一步是紅色鉛字版塊（.tau-press），最後一步換成「繼續玩」。
 */
export function RulesStepsPaged({ open, mode, online = false, onDone }: { open: boolean; mode: Mode; online?: boolean; onDone: () => void }) {
  const t = useTextTable(TEXT);
  const m = useMessages();
  const cfg = MODES[mode];
  const steps = auctionSteps(t, cfg, { online, modal: true });
  const [i, goTo] = useStep(steps.length);
  const pager = useSwipePager(steps.length, i, goTo);
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) goTo(0);
  }
  const { onKeyDown } = pager;
  useEffect(() => {
    if (!open) return;
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onKeyDown]);
  const last = i === steps.length - 1;
  return (
    <div className="flex flex-col gap-4 text-[#35331c]">
      <div {...pager.viewport}>
        <div className="flex items-start" style={pager.trackStyle}>
          {steps.map((s, n) => (
            <div key={n} className="w-full shrink-0 px-0.5" aria-hidden={n !== i}>
              <div aria-hidden="true" className="tau-box mx-auto w-full max-w-[300px] p-4">
                <Figure n={n} t={t} cfg={cfg} online={online} />
              </div>
              <h3 className="mt-4 flex items-baseline gap-2 text-base font-black leading-snug">
                <span aria-hidden="true" className="tau-display shrink-0 text-lg font-bold italic">{ROMAN[n]}.</span>
                <span>{s.title}</span>
              </h3>
              <p className="mt-1 text-sm font-bold leading-relaxed">{s.body}</p>
              {s.notes.map((note) => <p key={note} className="mt-1.5 text-xs font-bold leading-relaxed text-ink-soft">{note}</p>)}
            </div>
          ))}
        </div>
      </div>
      {/* 頁碼：羅馬數字，點了直接跳過去（觸控範圍撐到 28px） */}
      <div className="-mt-1 flex justify-center" role="group" aria-label={`${i + 1} / ${steps.length}`}>
        {steps.map((s, n) => (
          <button key={n} type="button" onClick={() => goTo(n)} aria-label={`${n + 1}. ${s.title}`} aria-current={n === i ? 'step' : undefined}
            className={`tau-display grid h-7 min-w-7 place-items-center px-1 text-sm font-bold italic underline-offset-4 transition ${
              n === i ? 'text-[#92383a] underline decoration-2' : 'text-[#35331c]/45 fine:hover:text-[#35331c]'
            }`}>
            {ROMAN[n]}
          </button>
        ))}
      </div>
      <div className="flex gap-2.5">
        {i > 0 && (
          <button type="button" onClick={() => goTo(i - 1)} className="tau-lot h-12 flex-1 whitespace-nowrap px-3 text-base font-black">{m.ui.prev}</button>
        )}
        <button type="button" onClick={() => (last ? onDone() : goTo(i + 1))} className="tau-press h-12 flex-1 whitespace-nowrap px-3 text-base font-black tracking-normal">
          {last ? t.stay : m.ui.next}
        </button>
      </div>
    </div>
  );
}
