'use client';
import { COLOURS, END_SCORE, finalScore, type Colour, type Scores, type Seat } from '@/games/balance-mancala/engine';
import { fill } from '@/i18n/gameText';
import type { BalanceMancalaText } from '@/games/balance-mancala/text';
import { BRASS_DEEP, DISH_BG } from './palette';
import PieceDisc from './PieceDisc';

/** 最高那柱的高度（px）。刻度跟著分數放大：開局幾分也看得出高低，最多到 30 */
const H = 72;

/**
 * 三色的天平（Zach 11/1：「要想辦法讓大家好懂」）：最終分數＝2×最低−最高，光看公式很難知道「現在該往哪一色加」。
 * 這裡把一個人的紅藍綠畫成三柱疊起來的砝碼（一分一塊，分數多了就連成一柱），最低那柱的頂端拉一條黃銅虛線（＝基準），
 * 柱子底下標「最低 ×2」「最高 −」，右邊把公式代進真的數字，最後一行直接說下一分該記到哪一色。
 * 預覽一手時，加上去的那段畫成半透明（跟分數面板一樣）。
 *
 * 只畫一個人：跟 AI 玩、連線是自己，本機對戰是輪到的人。顏色只有盤子的紅藍綠與砝碼的黃銅，不加新色。
 */
export default function BalanceCard({ t, seat, name, mine = false, scores, gain }: {
  t: BalanceMancalaText;
  seat: Seat;
  name: string;
  /** 這是自己（跟 AI 玩、連線）：子多一圈座位色的框，讀屏念「你」 */
  mine?: boolean;
  scores: Scores;
  /** 預覽：這一手讓這個人哪一色 +幾分 */
  gain: { colour: Colour; points: number } | null;
}) {
  const after = gain ? (scores.map((v, k) => (k === gain.colour ? v + gain.points : v)) as Scores) : scores;
  const sc = after;
  const lo = Math.min(...sc);
  const hi = Math.max(...sc);
  const even = lo === hi;
  const lowCs = COLOURS.filter((c) => sc[c] === lo);
  const highCs = COLOURS.filter((c) => sc[c] === hi);
  const near = COLOURS.filter((c) => sc[c] >= END_SCORE - 5 && sc[c] < END_SCORE);
  const f = finalScore(sc);
  const f0 = finalScore(scores);
  const lowC = lowCs[0];
  // 一分多高：最高的那柱（至少當成 10 分）剛好 H；一分夠高時每一分是一塊砝碼（中間一道布色的縫）
  const unit = H / Math.min(END_SCORE + 3, Math.max(10, hi));
  const px = (v: number) => Math.min(v, END_SCORE + 3) * unit;
  const blocks = unit >= 4 ? `repeating-linear-gradient(to top, transparent 0 ${unit - 1}px, rgb(235 210 203 / 0.75) ${unit - 1}px ${unit}px)` : undefined;
  const highC = highCs[0];
  return (
    <div className="mcl-cloth flex w-full flex-col gap-2 p-3" aria-live="polite">
      <div className="flex items-center gap-2">
        <PieceDisc seat={seat} size="1.4rem" mine={mine} />
        <p className="text-xs font-black">{fill(t.balanceTitle, { name })}{mine && <span className="sr-only">（{t.you}）</span>}</p>
      </div>
      <div className="flex items-end gap-4">
        {/* 三柱砝碼：底對齊，最低那柱的頂端一條黃銅虛線 */}
        <div className="relative flex shrink-0 items-end gap-2" style={{ height: H + 44 }} aria-hidden="true">
          {!even && (
            <span className="pointer-events-none absolute -inset-x-1 border-t-2 border-dashed" style={{ bottom: 27 + px(lo), borderColor: BRASS_DEEP }} />
          )}
          {COLOURS.map((c) => {
            const add = gain && gain.colour === c ? gain.points : 0;
            const base = scores[c];
            const isLow = !even && sc[c] === lo;
            const isHigh = !even && sc[c] === hi;
            return (
              <div key={c} className="flex w-10 flex-col items-center">
                <span className="text-[11px] font-black tabular-nums leading-none">{sc[c]}</span>
                <div className="relative mt-1 w-8" style={{ height: px(sc[c]) || 2 }}>
                  <div className="absolute inset-x-0 bottom-0 rounded-t-[3px]"
                    style={{ height: px(base) || 2, backgroundColor: DISH_BG[c], backgroundImage: blocks }} />
                  {add > 0 && (
                    <div className="absolute inset-x-0 rounded-t-[3px] opacity-45" style={{ bottom: px(base), height: px(sc[c]) - px(base), background: DISH_BG[c] }} />
                  )}
                </div>
                <span className="mt-1 text-[10px] font-black leading-none">{t.colourShort[c]}</span>
                <span className={`mt-0.5 h-3 whitespace-nowrap text-[9px] font-black leading-none ${isLow ? '' : 'text-ink-soft'}`}
                  style={isLow ? { color: BRASS_DEEP } : undefined}>
                  {isLow ? '×2' : isHigh ? '−' : ''}
                </span>
              </div>
            );
          })}
        </div>
        {/* 公式代進真的數字 */}
        <div className="flex min-w-0 flex-1 flex-col gap-1 pb-1">
          {even ? (
            <p className="text-xs font-bold leading-snug">{t.balanceEven}</p>
          ) : (
            <>
              <p className="text-xs font-bold leading-tight"><span className="text-ink-soft">{t.low}</span>　{t.colourShort[lowC]} {lo} × 2 = {2 * lo}</p>
              <p className="text-xs font-bold leading-tight"><span className="text-ink-soft">{t.high}</span>　{t.colourShort[highC]} {hi} → −{hi}</p>
            </>
          )}
          <p className="flex items-baseline gap-2 font-black leading-none">
            <span className="text-[10px] text-ink-soft">{t.final}</span>
            <span className="text-2xl tabular-nums">{f}</span>
            {gain && f !== f0 && <span className="text-xs text-ink-soft">({f0} → {f})</span>}
          </p>
          {!even && (
            <p className="text-xs font-black leading-snug" style={{ color: BRASS_DEEP }}>
              {fill(t.balanceNeed, { colours: lowCs.map((c) => t.colourNames[c]).join(' / ') })}
            </p>
          )}
          {near.length > 0 && <p className="text-[11px] font-bold leading-snug text-ink-soft">{fill(t.balanceNear, { colour: t.colourNames[near[0]] })}</p>}
        </div>
      </div>
    </div>
  );
}
