'use client';
import { useState } from 'react';
import { COLORS, SHAPE_OF, type Side, type StoneColor } from '@/games/blind-gomoku/engine';
import type { BlindGomokuText } from '@/games/blind-gomoku/text';
import { ColorFace, KEY_HEX, SideFace } from './Stone';

/**
 * 遊玩方式（說明彈窗），一次一步、每步一張小圖 —— 跟 Bagh Chal 的 RulesStepsPaged 同一個樣子。
 * 小圖是同一盤 7×7 的局面：黑斜著連成五子，四步分別畫成黑白、顏色、跟色、翻開。
 */
type Demo = { r: number; c: number; side: Side; color: StoneColor };
const N = 7;
// 下子順序：黑白兩兩同色（白跟黑上一手的顏色），最後黑在 (5,5) 連成五子
const DEMO: Demo[] = [
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
const cell = (n: number) => `${((n + 0.5) / N) * 100}%`;

function MiniBoard({ view, line = false, ring = [] }: { view: 'side' | 'color'; line?: boolean; ring?: [number, number][] }) {
  return (
    <div className="mx-auto w-full max-w-[220px] rounded-2xl bg-primary-50 p-[4%]" aria-hidden="true">
      <div className="relative aspect-square w-full">
        <svg viewBox={`0 0 ${N} ${N}`} className="absolute inset-0 size-full">
          <g stroke="rgb(var(--board-line))" strokeOpacity={0.55} strokeWidth={0.045}>
            {Array.from({ length: N }, (_, i) => (
              <g key={i}>
                <line x1={0} y1={i + 0.5} x2={N} y2={i + 0.5} />
                <line x1={i + 0.5} y1={0} x2={i + 0.5} y2={N} />
              </g>
            ))}
          </g>
        </svg>
        {DEMO.map((d) => (
          <div key={`${d.r}-${d.c}`} className="absolute" style={{ left: cell(d.c), top: cell(d.r), width: `${(0.84 / N) * 100}%`, height: `${(0.84 / N) * 100}%`, transform: 'translate(-50%, -50%)' }}>
            {view === 'color' ? <ColorFace color={d.color} /> : <SideFace side={d.side} />}
          </div>
        ))}
        {ring.map(([r, c]) => (
          <div key={`ring-${r}-${c}`} className="absolute rounded-full border-[3px] border-tile-ink"
            style={{ left: cell(c), top: cell(r), width: `${(1.3 / N) * 100}%`, height: `${(1.3 / N) * 100}%`, transform: 'translate(-50%, -50%)' }} />
        ))}
        {line && (
          <svg viewBox={`0 0 ${N} ${N}`} className="absolute inset-0 size-full">
            <line x1={1.5} y1={1.5} x2={5.5} y2={5.5} stroke={KEY_HEX} strokeWidth={0.22} strokeLinecap="round" opacity={0.9} />
          </svg>
        )}
      </div>
    </div>
  );
}

function ColorStrip({ t }: { t: BlindGomokuText }) {
  return (
    <ul className="mx-auto grid w-full max-w-[320px] grid-cols-7 gap-1.5" aria-hidden="true">
      {COLORS.map((c) => (
        <li key={c} className="flex flex-col items-center gap-1">
          <ColorFace color={c} className="aspect-square w-full" />
          <span className="text-[10px] font-bold leading-tight text-ink-soft">{t.colors[c]}</span>
        </li>
      ))}
    </ul>
  );
}

export function HowToPlay({ t, prev, next, done, onDone }: { t: BlindGomokuText; prev: string; next: string; done: string; onDone: () => void }) {
  const [i, setI] = useState(0);
  const pictures = [
    <MiniBoard key="0" view="side" line />,
    <MiniBoard key="1" view="color" />,
    // 跟色：藍色那一對，一顆黑一顆白
    <MiniBoard key="2" view="color" ring={[[2, 2], [3, 2]]} />,
    <ColorStrip key="3" t={t} />,
    <MiniBoard key="4" view="side" line />,
  ];
  const steps = t.steps.slice(0, pictures.length);
  const last = i === steps.length - 1;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex min-h-[150px] items-center">{pictures[i]}</div>
      <p className="min-h-[5.5rem] text-sm font-bold leading-relaxed">{steps[i]}</p>
      {last && <p className="text-xs font-bold leading-relaxed text-ink-soft">{t.showNote}</p>}
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-black tabular-nums text-ink-soft">{i + 1} / {steps.length}</span>
        <div className="flex gap-2">
          {i > 0 && (
            <button type="button" onClick={() => setI(i - 1)} className="rounded-xl bg-tile-ink/[0.07] px-4 py-2.5 text-sm font-black text-tile-ink">{prev}</button>
          )}
          <button type="button" onClick={() => (last ? onDone() : setI(i + 1))} className="rounded-xl bg-tile-ink px-4 py-2.5 text-sm font-black text-tile-cream">
            {last ? done : next}
          </button>
        </div>
      </div>
    </div>
  );
}

/** 讀屏與 title 用的顏色名：「紅 圓形」 */
export function colorName(t: BlindGomokuText, c: StoneColor): string {
  return `${t.colors[c]} ${t.shapes[SHAPE_OF[c]]}`;
}
