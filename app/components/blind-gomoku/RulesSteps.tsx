'use client';
import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { COLORS, type Side, type StoneColor } from '@/games/blind-gomoku/engine';
import type { BlindGomokuText } from '@/games/blind-gomoku/text';
import { useStep, useSwipePager } from '@/hook/useSwipePager';
import { ColorFace, INK, KEY_HEX, SideFace } from './Stone';

/**
 * 盲五子棋規則的五個步驟，每步一張小圖。規則頁（全部攤開，RulesPage）與對局中的說明彈窗（一次一步、可以左右滑）共用 ——
 * 跟 Bagh Chal 的 BaghRulesSteps 同一個做法。文字是 text.ts 的 steps（標題＋說明），順序跟這裡的 PICTURES 對得上。
 *
 * 圖是對局畫面的一小角，用的是遊戲自己的零件：棋盤是白絲 #f2e4c9＋黑絲線（同 GomokuBoard 的線寬、透明度、星位），
 * 子是 Stone.tsx 的 ColorFace／SideFace（大小同棋盤上的 0.9 格），連成五子的線、剛落子的那圈、瞄準的十字線也照棋盤上的畫法；
 * 底下墊一塊頁面的奶油白絲 #e4d6bb —— 彈窗與規則頁的卡片都是白絲，不墊的話棋盤就跟面板糊在一起。
 * 盤面是 15×15 中間的 7×7（線畫到邊上，看得出是從大棋盤切下來的）。
 *
 * 盲棋那幾張是同一盤：黑斜著下，白每一手都用黑上一手的顏色回應（節目裡 AI 的規矩）。
 * 只有最後一張（講翻開）畫黑白；前面幾張只畫顏色，第一張講一般五子棋用的是**另一盤** ——
 * 同一盤先畫黑白的話，後面的彩色圖就等於明牌、最後翻開也沒有驚喜了。
 */
type Step = BlindGomokuText['steps'][number];
type Demo = { r: number; c: number; side: Side; color: StoneColor };
const N = 7;

/** 盲棋那一盤：黑白兩兩同色（白跟黑上一手的顏色），最後黑在 (5,5) 下粉紅，斜著連成五子 */
const BLIND: Demo[] = [
  { r: 3, c: 3, side: 'black', color: 'red' },
  { r: 2, c: 3, side: 'white', color: 'red' },
  { r: 2, c: 2, side: 'black', color: 'blue' },
  { r: 3, c: 2, side: 'white', color: 'blue' },
  { r: 4, c: 4, side: 'black', color: 'yellow' },
  { r: 4, c: 2, side: 'white', color: 'yellow' },
  { r: 1, c: 1, side: 'black', color: 'green' },
  { r: 1, c: 4, side: 'white', color: 'green' },
  { r: 5, c: 5, side: 'black', color: 'pink' },
];
/** 還沒下最後那一手（還沒連成，所以還沒翻開） */
const BEFORE_LAST = BLIND.slice(0, -1);
/** 一般五子棋那一盤（跟盲棋那盤不同）：黑橫著連成五子；顏色用不到 */
const CLASSIC: Demo[] = [
  [3, 1, 'black'], [3, 2, 'black'], [3, 3, 'black'], [3, 4, 'black'], [3, 5, 'black'],
  [2, 2, 'white'], [2, 4, 'white'], [4, 3, 'white'], [4, 5, 'white'],
].map(([r, c, side]) => ({ r: r as number, c: c as number, side: side as Side, color: 'red' }));

/**
 * 一小塊棋盤。`rows` 只畫其中幾列（選色那張要在下面放選色盤，盤面切成 7×5）。
 * `face`：盲棋畫顏色那面、一般與翻開畫黑白那面。
 */
function MiniBoard({ stones, face, rows = [0, N - 1], line, rings = [], aim }: {
  stones: Demo[];
  face: 'color' | 'side';
  rows?: [number, number];
  /** 連成的那一排，頭尾兩點 */
  line?: [[number, number], [number, number]];
  /** 圈起來的子（同 GomokuBoard 剛落子那一圈） */
  rings?: [number, number][];
  /** 瞄準的點：十字線＋半透明的子（同 GomokuBoard 的瞄準） */
  aim?: { r: number; c: number; color: StoneColor };
}) {
  const [r0, r1] = rows;
  const H = r1 - r0 + 1;
  // 位置與大小都用百分比：寬照 7 格、高照 H 格算，格子才是正方形
  const at = (r: number, c: number, cells: number): CSSProperties => ({
    left: `${((c + 0.5) / N) * 100}%`, top: `${((r - r0 + 0.5) / H) * 100}%`,
    width: `${(cells / N) * 100}%`, height: `${(cells / H) * 100}%`, transform: 'translate(-50%, -50%)',
  });
  const y = (r: number) => r - r0 + 0.5;
  return (
    <div className="rounded-[3px] bg-[#f2e4c9]">
      <div className="relative w-full" style={{ aspectRatio: `${N} / ${H}` }}>
        <svg viewBox={`0 0 ${N} ${H}`} className="absolute inset-0 size-full">
          <g stroke={INK} strokeOpacity={0.5} strokeWidth={0.04}>
            {Array.from({ length: H }, (_, i) => <line key={`h${i}`} x1={0} y1={i + 0.5} x2={N} y2={i + 0.5} />)}
            {Array.from({ length: N }, (_, i) => <line key={`v${i}`} x1={i + 0.5} y1={0} x2={i + 0.5} y2={H} />)}
          </g>
          {/* 天元的星位（這塊是棋盤正中間的 7×7） */}
          {r0 <= 3 && r1 >= 3 && <circle cx={3.5} cy={y(3)} r={0.12} fill={INK} />}
          {aim && (
            <g stroke={KEY_HEX} strokeWidth={0.08} strokeLinecap="round">
              <line x1={0} y1={y(aim.r)} x2={N} y2={y(aim.r)} />
              <line x1={aim.c + 0.5} y1={0} x2={aim.c + 0.5} y2={H} />
            </g>
          )}
        </svg>
        {stones.map((d) => (
          <div key={`${d.r}-${d.c}`} className="absolute" style={at(d.r, d.c, 0.9)}>
            {face === 'color' ? <ColorFace color={d.color} /> : <SideFace side={d.side} />}
          </div>
        ))}
        {aim && <div className="absolute opacity-60" style={at(aim.r, aim.c, 0.9)}><ColorFace color={aim.color} /></div>}
        {rings.map(([r, c]) => (
          <div key={`ring-${r}-${c}`} className="absolute rounded-full border-[3px] border-[#2a2525]" style={at(r, c, 1.45)} />
        ))}
        {line && (
          <svg viewBox={`0 0 ${N} ${H}`} className="absolute inset-0 size-full">
            <line x1={line[0][1] + 0.5} y1={y(line[0][0])} x2={line[1][1] + 0.5} y2={y(line[1][0])}
              stroke={KEY_HEX} strokeWidth={0.26} strokeLinecap="round" opacity={0.9} />
          </svg>
        )}
      </div>
    </div>
  );
}

/** 選色盤（同 ColorPicker 的樣子，只是畫出來、不能按）：選中的那塊縫線是實線的黑絲 */
function PickerRow({ value }: { value: StoneColor }) {
  return (
    <div className="grid w-full grid-cols-7 gap-1">
      {COLORS.map((c) => (
        <span key={c} className={`gmk-patch grid aspect-square place-items-center ![outline-offset:-3px] ${
          c === value ? '![outline-color:#2a2525] ![outline-style:solid] ![outline-width:2px]' : 'is-ramie'
        }`}>
          <ColorFace color={c} className={`size-[72%] ${c === value ? 'scale-110' : ''}`} />
        </span>
      ))}
    </div>
  );
}

/** 每張圖一樣大（正方形，墊一塊頁面的奶油白絲）：彈窗左右滑時字才會停在同一個高度 */
function Picture({ children }: { children: ReactNode }) {
  return (
    <div className="flex aspect-square w-full flex-col justify-center gap-2 rounded-[3px] bg-[#e4d6bb] p-[6%]" aria-hidden="true">
      {children}
    </div>
  );
}

const PICTURES: ReactNode[] = [
  // 1 連成五子：一般五子棋，黑橫著連成五子
  <Picture key="five"><MiniBoard stones={CLASSIC} face="side" line={[[3, 1], [3, 5]]} /></Picture>,
  // 2 只看得到顏色：盲棋那一盤（最後一手之前）
  <Picture key="colors"><MiniBoard stones={BEFORE_LAST} face="color" /></Picture>,
  // 3 每一手先選顏色：選了粉紅、瞄準 (5,5)；盤面切成 7×5，下面放選色盤
  <Picture key="pick">
    <MiniBoard stones={BEFORE_LAST} face="color" rows={[1, 5]} aim={{ r: 5, c: 5, color: 'pink' }} />
    <PickerRow value="pink" />
  </Picture>,
  // 4 AI 跟著同色：最近的那一對（青綠），一顆黑一顆白 —— 圈起來的兩顆看不出誰是誰
  <Picture key="copy"><MiniBoard stones={BEFORE_LAST} face="color" rings={[[1, 1], [1, 4]]} /></Picture>,
  // 5 一起翻開：最後一手連成五子，全部翻到黑白 —— 只有這一張畫黑白
  <Picture key="reveal"><MiniBoard stones={BLIND} face="side" line={[[1, 1], [5, 5]]} /></Picture>,
];
export const STEP_COUNT = PICTURES.length;

/** 全部攤開（規則頁）：一步一張卡片，手機上圖在上、桌機圖在左 */
export function RulesStepsList({ steps }: { steps: readonly Step[] }) {
  return (
    <ol className="space-y-4">
      {PICTURES.map((picture, k) => (
        <li key={k} className="gmk-patch p-4 md:p-5">
          <div className="grid gap-4 md:grid-cols-[240px_1fr] md:items-start">
            <div className="mx-auto w-full max-w-[280px] md:mx-0">{picture}</div>
            <div className="md:pt-1">
              <h2 className="flex items-start gap-2.5 text-lg font-black leading-snug md:text-xl">
                {/* 編號是一小塊青綠布 */}
                <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-[2px] bg-[#046161] text-xs text-[#f2e4c9]">{k + 1}</span>
                <span>{steps[k].title}</span>
              </h2>
              <p className="mt-2 text-base leading-relaxed">{steps[k].body}</p>
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}

/**
 * 一次一步（對局中的說明彈窗）：五張並排在一條軌道上，手指左右拖（hook/useSwipePager.ts，同 Wall Go 的遊玩方式、虎棋的說明），
 * 也可以按下面的按鈕、點頁碼，或用左右方向鍵。
 * 彈窗關著時內容仍掛在頁面上（Modal 只加 inert），所以要 `open`：開著才聽方向鍵、每次打開從第一步開始。
 * 彈窗裡只有步驟：出處、名字的由來、署名放在規則頁；也不放規則頁的連結（不在對局中放會離開對局的東西）。
 */
export function RulesStepsPaged({ open, steps, prev, next, done, onDone }: {
  open: boolean; steps: readonly Step[]; prev: string; next: string; done: string; onDone: () => void;
}) {
  const [i, goTo] = useStep(STEP_COUNT);
  const pager = useSwipePager(STEP_COUNT, i, goTo);
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
  const last = i === STEP_COUNT - 1;
  return (
    <div className="flex flex-col gap-4">
      {/* 每一頁左右各留 12px、外框往外撐回去：拖到一半時相鄰兩頁的字中間隔一道縫，不會黏在一起 */}
      <div {...pager.viewport} className={`${pager.viewport.className} -mx-3`}>
        <div className="flex items-start" style={pager.trackStyle}>
          {PICTURES.map((picture, k) => (
            <div key={k} className="w-full shrink-0 px-3" aria-hidden={k !== i}>
              <div className="mx-auto w-full max-w-[240px]">{picture}</div>
              <h3 className="mt-4 text-base font-black leading-snug">{steps[k].title}</h3>
              <p className="mt-1 text-sm font-bold leading-relaxed">{steps[k].body}</p>
            </div>
          ))}
        </div>
      </div>
      {/* 頁碼：一步一小塊布，這一步是青綠布（同選難度那排強度的小布塊）；點了直接跳過去，觸控範圍撐到 24px */}
      <div className="-mt-1 flex justify-center" role="group" aria-label={`${i + 1} / ${STEP_COUNT}`}>
        {PICTURES.map((_, k) => (
          <button key={k} type="button" onClick={() => goTo(k)} aria-label={`${k + 1}`} aria-current={k === i ? 'step' : undefined}
            className="grid size-6 place-items-center">
            <span className={`block h-3 w-4 rounded-[1px] transition-colors ${k === i ? 'bg-[#046161]' : 'bg-[#2a2525]/15'}`} />
          </button>
        ))}
      </div>
      {/* 按鈕是這款自己的布（globals.css 的 .gmk-*）：主要是拼起來的青綠布、次要是苧麻布 */}
      <div className="flex justify-end gap-2">
        {i > 0 && (
          <button type="button" onClick={() => goTo(i - 1)} className="gmk-patch is-ramie whitespace-nowrap px-4 py-2.5 text-sm font-black active:scale-[0.98]">{prev}</button>
        )}
        <button type="button" onClick={() => (last ? onDone() : goTo(i + 1))}
          className="gmk-patch is-pieced whitespace-nowrap py-2.5 pl-7 pr-4 text-sm font-black ![--corner:14px] active:scale-[0.98]">
          {last ? done : next}
        </button>
      </div>
    </div>
  );
}
