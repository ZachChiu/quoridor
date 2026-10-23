import React, { useEffect, useState } from "react";
import { PLAYER_ON, playerVar, type PlayerKey } from "@/config/players";
import type { Player } from "@/types/chessboard";
import { useGameText } from '@/i18n/LocaleProvider';
import { GiUnplugged } from 'react-icons/gi';
import { clockOf, fmtClock, type LiveClock } from '@/utils/clock';

interface Props {
  /** 這台裝置上的人坐哪一方（連線、跟 AI 下）。本機對戰沒有 */
  me?: PlayerKey;
  isLock: boolean;
  currentPlayer: Player;
  uniqTerritories: { A: string[]; B: string[], C?: string[] };
  playersNum: number;
  /** 連線時斷線的對手（已經等過幾秒、確定不是重新整理） */
  away?: PlayerKey[];
  /** 各方累計的思考時間，輪到的人在走秒。還沒開始（沒擺下第一顆）時沒有 */
  clock?: LiveClock;
}

/**
 * 比分。每位玩家一塊自己顏色的磚，顏色本身就是資訊。
 *
 * 都維持滿色，不做淡化 —— 試過兩種淡法都不行：
 *   opacity-55 會讓米白字疊在淡紅／淡藍上只剩 2.4:1（門檻 4.5）；
 *   改用各自的 -100 淡色底，亮度又和頁面底幾乎相同（1.01:1），轉灰階整塊消失。
 * 分數是要讀的文字，退後感不值得用可讀性換。
 *
 * 當前玩家那一塊比較大。刻意不只靠呼吸動畫 ——
 * 動畫在截圖裡不存在，對開了 prefers-reduced-motion 的人也等於沒有。
 *
 * ── 數字要往上推 0.08em ───────────────────────────────────────────
 * `line-height: 1` 配 flex 置中，置中的是**行框**不是字。Noto Sans TC 的
 * ascent/descent 不對稱（基線落在行框 0.8 的位置），所以數字的墨跡中心
 * 比容器中心低 —— 實測 88px 字級低 7px，也就是 0.0795em，不論字級都一樣。
 * 只在手機那種「格子裡只有一個數字」的情況補；桌機的長條是「已佔領 9」，
 * 兩段文字一起偏，彼此反而是對齊的，補了才會歪。
 *
 * ── 三種形狀，全部由斷點決定 ──────────────────────────────────────
 * 桌機（pointer: fine）—— 右上直排，長條寫著「已佔領 9」。
 * 手指直式 —— 右上橫排，只留數字：幾塊膠囊並排寫同一個詞，重複的部分
 *             佔掉的正是數字要用的寬度，而顏色已經說明了那是誰的。
 * 手指橫式 —— **左下**直排。右側整條被控制盤佔住、棋盤又貼著控制盤，
 *             左下那塊是唯一剩下的空地；擺回右上就會夾在兩者中間。
 *
 * 用 CSS 斷點而不是 prop，是因為這站是靜態匯出：JS 判斷裝置要等
 * hydration 之後才成立，手機重整會先畫一次桌機版再跳。
 *
 * ── 自己那塊多一圈框 ──────────────────────────────────────────────
 * 連線時兩邊原本都看不出自己是紅是藍（Zach 10/22 回報）。試過在磚底下寫「你」，太直白；
 * Zach 從六種做法裡選了這個：自己那塊外面一圈自己的顏色，中間留一道縫（outline＋offset，縫透出頁面底色）。
 * 輪到誰照舊是「那塊變大」—— 框講「哪塊是你」、大小講「輪到誰」，各講一件事。
 * 塊與塊之間的距離加到 12px，框才不會貼到隔壁那塊。讀屏另外念「你」。
 *
 * ── 斷線的對手掛一顆拔掉插頭的小圓 ────────────────────────────────
 * 釘在那塊的右上角，深墨底、外面一圈頁面底色把它跟磚分開。不淡化整塊（理由見上）、
 * 也不在磚上寫字 —— 手機上那塊只放得下一個數字。輪到他的時候，提示句另外會寫「藍方暫時離線」。
 *
 * ── 思考時間（Zach 10/23：「桌機版沒看到下棋時間的計時」）──────────────
 * 不限時，只記錄。桌機寫在「已佔領」底下，整局時長（各方加起來）在整排的最下面；
 * 手機直式一小行掛在每塊下方，橫式掛在右邊；手機不寫整局（沒地方，結算的圖上有）。
 * 只有這一塊每秒重畫，PlayClient 與棋盤不跟著動。
 */
export default React.memo(function GameStatus({ me, isLock, currentPlayer, uniqTerritories, playersNum, away, clock }: Props) {
  const g = useGameText();
  const players: PlayerKey[] = playersNum === 3 ? ['A', 'B', 'C'] : ['A', 'B'];

  // 現在幾點，每秒更新一次；沒有人在走秒時停掉
  const [now, setNow] = useState(0);
  useEffect(() => {
    if (!clock) return;
    const tick = () => setNow(clock.now());
    const first = setTimeout(tick, 0);
    const id = clock.running ? setInterval(tick, 1000) : undefined;
    return () => { clearTimeout(first); clearInterval(id); };
  }, [clock]);
  const ms = (p: PlayerKey) => (clock ? clockOf(clock, p, now) : 0);
  const total = clock ? players.reduce((a, p) => a + ms(p), 0) : 0;

  return (
    <div
      className="fixed right-5 top-5 z-40 flex flex-col items-end gap-3
                 coarse:flex-row coarse:items-center
                 coarse-land:bottom-5 coarse-land:left-5 coarse-land:right-auto coarse-land:top-auto
                 coarse-land:flex-col coarse-land:items-start coarse-land:gap-3"
    >
      {players.map((p) => {
        const active = !isLock && currentPlayer === p;
        return (
          <div
            key={p}
            className={`relative flex items-center justify-between gap-4 rounded-2xl px-[18px] py-3 text-[15px]
                        font-black tabular-nums transition-all
                        coarse:justify-center coarse:gap-0 coarse:rounded-[14px] coarse:p-0
                        coarse-land:h-12 coarse-land:w-[52px]
                        ${PLAYER_ON[p]} ${active ? 'animate-active-bar' : ''} ${
              active ? 'w-40 coarse:h-12 coarse:w-14' : 'w-[8.75rem] coarse:h-11 coarse:w-12'
            }`}
            style={{
              backgroundColor: playerVar(p),
              ...(p === me ? { outline: `3px solid ${playerVar(p)}`, outlineOffset: '3px' } : null),
            }}
          >
            <span className="flex flex-col coarse:hidden">
              {g.status.claimed}
              {clock && <span className="text-xs font-bold opacity-80" aria-label={`${g.clock.label} ${fmtClock(ms(p))}`}>{fmtClock(ms(p))}</span>}
            </span>
            {/* 手機：一小行掛在磚外面（直式在下方、橫式在右邊） */}
            {clock && (
              <span aria-hidden="true"
                className="pointer-events-none absolute hidden whitespace-nowrap text-[11px] font-bold text-ink-soft coarse:left-1/2
                           coarse:top-full coarse:mt-1 coarse:block coarse:-translate-x-1/2
                           coarse-land:left-full coarse-land:top-1/2 coarse-land:ml-2 coarse-land:mt-0 coarse-land:-translate-y-1/2 coarse-land:translate-x-0">
                {fmtClock(ms(p))}
              </span>
            )}
            {p === me && <span className="sr-only">{g.status.you}</span>}
            {away?.includes(p) && (
              <span className="absolute -right-2 -top-2 grid size-6 place-items-center rounded-full bg-tile-ink text-[13px] text-tile-cream ring ring-primary-50">
                <GiUnplugged aria-hidden="true" />
                <span className="sr-only">{g.status.away}</span>
              </span>
            )}
            <span className={`leading-none coarse:m-auto coarse:translate-y-[-0.08em]
                              coarse-land:text-[22px] ${active ? 'text-[22px]' : 'text-xl'}`}>
              {uniqTerritories[p]?.length || 0}
            </span>
          </div>
        );
      })}
      {clock && (
        <p className="pr-1 text-xs font-black tabular-nums text-ink-soft coarse:hidden">
          {g.clock.total} {fmtClock(total)}
        </p>
      )}
    </div>
  )
})
