'use client'
import React from 'react';
import { LuShare2 } from 'react-icons/lu';
import { playerVar, type PlayerKey } from '@/config/players';
import { useGameText } from '@/i18n/LocaleProvider';

interface Props {
  joinedCount: number;
  totalCount: number;
  onShare: () => void;
}

const SEATS: PlayerKey[] = ['A', 'B', 'C'];

/**
 * 連線模式的等待畫面。
 *
 * 座位與邀請 Modal 是同一套語彙：已入座染該玩家的顏色，空位是虛線圈。
 * 原本只有一行「1 / 2 玩家已加入」配一顆轉圈圈 —— 轉圈圈只說明「在等」，
 * 沒說等的是誰、還差幾個，而顏色順便先讓人記住待會兒自己是哪一色。
 *
 * ── 配色 ──────────────────────────────────────────────────────────
 * 整塊是紙色面板，不是浮在頁面底色上的一堆文字 —— 後者沒有邊界，
 * 看起來像還沒載完。小字用紫色，跟「邀請朋友加入」的 Modal 同色（Zach 指定）；
 * 按鈕用深墨。
 *
 * 按鈕原本是琥珀，那是首頁「本機」磁磚的顏色 —— 擺在連線的畫面上是
 * 第二個不相干的色相，而且座位圓點本來就已經帶著玩家色了。
 * 深墨不屬於任何色相，放在哪裡都不會跟誰打架。
 *
 * ── 等待感 ────────────────────────────────────────────────────────
 * 空位的虛線圈慢慢轉、**依序**呼吸（每個晚 0.35 秒），而不是一起閃。
 * 一起閃是「這裡有東西在動」，依序才讀得出「下一個是這個位子」。
 * 已入座的球：朋友坐下那一刻彈一下，之後輕輕浮動（動畫見 globals.css）。
 */
const WaitingRoom: React.FC<Props> = ({ joinedCount, totalCount, onShare }) => {
  const g = useGameText();
  /*
    面板給固定寬度：不給的話它會縮到剛好包住那顆按鈕，左右各只剩一點點，
    看起來像被夾住的。標題與座位需要呼吸的空間。
  */
  return (
    <div className="flex w-[min(22rem,90vw)] flex-col items-center gap-7 rounded-3xl bg-primary-50 px-8 py-10 text-center">
      <div>
        <p className="text-xs font-bold tracking-widest text-tile-purple">{g.waiting.kicker}</p>
        <h2 className="mt-1 text-3xl font-black">{g.waiting.heading}</h2>
      </div>

      <div className="flex items-start gap-5">
        {SEATS.slice(0, totalCount).map((p, i) => {
          const joined = i < joinedCount;
          return (
            <div key={p} className="flex w-16 flex-col items-center gap-2">
              {joined ? (
                // 外層浮動、內層彈跳：兩個都動 transform，分開才不會互相蓋掉
                <div className="animate-seat-idle" style={{ animationDelay: `${i * 0.3}s` }}>
                  <div className="animate-seat-join size-12 rounded-full" style={{ backgroundColor: playerVar(p) }} />
                </div>
              ) : (
                <div
                  className="animate-seat-wait size-12 rounded-full border-[3px] border-dashed border-tile-ink/35"
                  // 依座位順序錯開，讀起來是「一個一個在等」
                  style={{ animationDelay: `${i * 0.35}s` }}
                />
              )}
              <span className={`text-xs font-bold ${joined ? '' : 'text-ink-soft'}`}>
                {joined ? g.players[p] : g.share.waiting}
              </span>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={onShare}
        className="flex items-center gap-2 rounded-2xl bg-tile-ink px-6 py-4 text-lg font-black text-tile-cream transition hover:brightness-125 active:scale-[0.98]"
      >
        <LuShare2 className="text-xl" aria-hidden="true" />
        {g.waiting.invite}
      </button>
    </div>
  );
};

export default WaitingRoom;
