'use client';
import { useState } from 'react';
import { MiniBoard } from './BaghBoard';
import { BAGH_PRIMARY, BAGH_SECONDARY } from './BaghUi';
import type { Move, Point } from '@/games/bagh-chal/engine';

/**
 * Bagh Chal 規則的四個步驟，每步一張小棋盤。規則頁（全部攤開）與對局中的說明彈窗（一次一步）共用。
 * 文字取自 messages 的 baghChal.rules（五條；第一張圖講前兩條：棋盤與開局）。
 */
type Step = { rows: string[]; marks?: Partial<Record<Point, Move['kind']>>; victims?: Point[] };

const STEPS: Step[] = [
  // 開局：老虎在四角，羊在盤外
  { rows: ['T...T', '.....', '.....', '.....', 'T...T'] },
  // 放羊：每回合放一隻
  { rows: ['T...T', '.G...', '..G..', '.....', 'T...T'], marks: { 7: 'place', 8: 'place', 11: 'place', 13: 'place' } },
  // 老虎跳過羊吃掉牠：落點橘色、被吃的羊加框；也可以只走一步
  { rows: ['T....', '.G...', '.....', '.....', '....T'], marks: { 12: 'jump', 1: 'move', 5: 'move' }, victims: [6] },
  // 羊把老虎圍到動不了
  { rows: ['TGG..', 'GG...', 'G.G..', '.....', '.....'] },
];

function captions(rules: readonly string[]): string[] {
  return [`${rules[0]} ${rules[1]}`, rules[2], rules[3], rules[4]];
}

/** 全部攤開（規則頁） */
export function RulesStepsList({ rules }: { rules: readonly string[] }) {
  const text = captions(rules);
  return (
    <ol className="grid gap-5 sm:grid-cols-2">
      {STEPS.map((s, i) => (
        <li key={i} className="flex flex-col gap-3 rounded-2xl border-2 border-tile-ink bg-[#fbf4e1] p-4">
          <MiniBoard rows={s.rows} marks={s.marks} victims={s.victims} />
          <p className="text-sm font-bold leading-relaxed"><span className="mr-1.5 font-black">{i + 1}.</span>{text[i]}</p>
        </li>
      ))}
    </ol>
  );
}

/** 一次一步（說明彈窗） */
export function RulesStepsPaged({ rules, prev, next, done, onDone }: {
  rules: readonly string[]; prev: string; next: string; done: string; onDone: () => void;
}) {
  const [i, setI] = useState(0);
  const text = captions(rules);
  const s = STEPS[i];
  const last = i === STEPS.length - 1;
  return (
    <div className="flex flex-col gap-4">
      <div className="mx-auto w-full max-w-[280px]"><MiniBoard rows={s.rows} marks={s.marks} victims={s.victims} /></div>
      <p className="min-h-[4.5rem] text-sm font-bold leading-relaxed">{text[i]}</p>
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-black tabular-nums text-ink-soft">{i + 1} / {STEPS.length}</span>
        <div className="flex gap-2">
          {i > 0 && (
            <button type="button" onClick={() => setI(i - 1)} className={`${BAGH_SECONDARY} px-4 py-2 text-sm`}>{prev}</button>
          )}
          <button type="button" onClick={() => (last ? onDone() : setI(i + 1))} className={`${BAGH_PRIMARY} px-4 py-2 text-sm`}>
            {last ? done : next}
          </button>
        </div>
      </div>
    </div>
  );
}
