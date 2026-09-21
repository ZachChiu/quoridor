'use client';
import React from 'react';
import { useGameText } from '@/i18n/LocaleProvider';
import { fmt } from '@/i18n/content/game';

/**
 * 回合指引：「① 移動 › ② 築牆」兩顆步驟標。
 *
 * ── 位置 ──────────────────────────────────────────────────────────
 * 直式浮在控制盤上緣線的**外面**，橫式收進控制盤內部的頂端。
 *
 * 原本兩邊都用 `-translate-x/y-1/2` 騎在分隔線上。直式沒問題（線的上方
 * 是留白），橫式的線在左邊 —— 那一側是棋盤，於是有一半直接蓋在盤面上。
 * 線兩側的東西不一樣，就不能用同一種擺法。
 *
 * ── 開局是自己的一步 ─────────────────────────────────────────────
 * 擺棋子的時候不顯示「① 移動 › ② 築牆」—— 那兩步當下一步都做不了，
 * 擺在那裡只是兩顆灰掉的標籤，讀者還得自己推敲現在到底該幹嘛。
 * 換成單獨一顆「放棋子」，步驟標就從頭到尾都在講「現在這一步是什麼」。
 *
 * ── 只在講不出來的時候才補一句話 ──────────────────────────────────
 * ①／② 的高亮本身已經說了「現在在哪一步」，還可走幾格也寫在 ① 裡面，
 * 所以移動與築牆這兩步不再另外配一行字。開局也不用 —— 那顆標籤本身
 * 就寫著「放棋子」了。「還沒選棋子」也不用：①移動 亮著的時候要做什麼
 * 本來就只有一件事，補一句「點棋盤選一顆自己的棋子」只是把同一件事
 * 用長一點的句子再講一次。
 *
 * 只剩兩種處境是步驟標真的表達不了的：還沒輪到你、正在挑要打破的牆。
 *
 * 那句話排在步驟標的**上面**，而整塊是貼著控制盤上緣往上長的。
 * 反過來寫（話在下面）的話，多出來的那一行會把步驟標往上頂 ——
 * 步驟標是每一步都在看的東西，不該因為旁邊多一行字就換位置。
 * 這樣一來需要預留的高度也只有一個值（兩行的高度），棋盤照它讓位即可。
 */
type Props = {
  placing: boolean;
  /** 現在是不是我的回合（對手回合、AI 思考中都是 false） */
  myTurn: boolean;
  selected: boolean;
  onWallStep: boolean;
  breakMode: boolean;
  remainSteps: number;
  color: string;
  /** 由掛載點決定定位與顯示條件 —— 直式排在文件流裡，橫式收在控制盤內 */
  className?: string;
};

export default function TurnGuide({ placing, myTurn, selected, onWallStep, breakMode, remainSteps, color, className = '' }: Props) {
  const g = useGameText();

  const aside = !myTurn ? g.pad.hintWait
    : breakMode ? g.pad.breakPick
    : null;

  const chip = (label: string, on: boolean, extra?: React.ReactNode) => (
    <span
      className={`rounded-full px-3 py-[5px] landscape:px-2.5 landscape:py-1 ${
        on ? 'text-tile-cream' : 'bg-tile-ink/[0.07] text-ink-soft'
      }`}
      style={on ? { backgroundColor: color } : undefined}
    >
      {label}
      {extra}
    </span>
  );

  return (
    <div
      /*
        ── 直式：排在文件流裡 ──────────────────────────────────────
        由 PlayClient 夾在棋盤與控制盤之間，距離就是那一層的 gap（16px），
        不用任何定位、也不用算。先前是絕對定位在控制盤上緣往外掛，
        上下距離得自己推算 —— 而 `bottom-full` 量的是 padding box、
        那條看得見的線卻是 2px 的邊框，光這一點就錯了 2px。

        ── 橫式：收在控制盤內部的頂端 ──────────────────────────────
        那一欄是直的，提示是它的標籤，放在裡面才對。這時才需要絕對定位。

        提示句一律絕對定位浮在步驟標外側（直式上方、橫式下方）——
        它有時候在、有時候不在，排進流裡會把步驟標推來推去。
      */
      className={`pointer-events-none relative z-10 flex flex-col items-center ${className}`}
    >
      {aside && (
        <span className="absolute bottom-full mb-1 whitespace-nowrap text-[11px] font-bold text-ink-soft
                         landscape:bottom-auto landscape:top-full landscape:mb-0 landscape:mt-1">
          {aside}
        </span>
      )}
      <div className="flex items-center gap-2 text-xs font-black landscape:gap-1.5 landscape:text-[11px]">
        {placing ? chip(g.pad.stepPlace, myTurn) : (
          <>
            {chip(g.pad.step1, !onWallStep && !breakMode,
              remainSteps > 0 && !onWallStep && !breakMode && selected ? (
                <span className="ml-1 font-bold opacity-80">{fmt(g.pad.remain, { n: remainSteps })}</span>
              ) : null)}
            <span className="text-ink-soft/40">›</span>
            {chip(g.pad.step2, onWallStep || breakMode)}
          </>
        )}
      </div>
    </div>
  );
}
