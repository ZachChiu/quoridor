'use client';
import { useEffect, useState } from 'react';
import { MiniBoard } from './BaghBoard';
import { BAGH_PRIMARY, BAGH_SECONDARY } from './styles';
import type { Move, Point } from '@/games/bagh-chal/engine';
import { useStep, useSwipePager } from '@/hook/useSwipePager';

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
        <li key={i} className="bagh-line flex flex-col gap-3 bg-[#f2e4c4] p-4">
          <MiniBoard rows={s.rows} marks={s.marks} victims={s.victims} />
          <p className="text-sm font-bold leading-relaxed"><span className="mr-1.5 font-black">{i + 1}.</span>{text[i]}</p>
        </li>
      ))}
    </ol>
  );
}

/**
 * 一次一步（說明彈窗）：四張並排在一條軌道上，手指左右拖（同 Wall Go 的遊玩方式，hook/useSwipePager.ts），
 * 也可以按下面的按鈕、點頁碼的小圓點，或用左右方向鍵。
 * 彈窗關著時內容仍掛在頁面上（Modal 只加 inert），所以要 `open`：開著才聽方向鍵、每次打開從第一步開始（同 Wall Go）。
 */
export function RulesStepsPaged({ open, rules, prev, next, done, onDone }: {
  open: boolean; rules: readonly string[]; prev: string; next: string; done: string; onDone: () => void;
}) {
  const [i, goTo] = useStep(STEPS.length);
  const pager = useSwipePager(STEPS.length, i, goTo);
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
  const text = captions(rules);
  const last = i === STEPS.length - 1;
  return (
    <div className="flex flex-col gap-4">
      <div {...pager.viewport}>
        <div className="flex items-start" style={pager.trackStyle}>
          {STEPS.map((s, n) => (
            <div key={n} className="w-full shrink-0 px-0.5" aria-hidden={n !== i}>
              <div className="mx-auto w-full max-w-[280px]"><MiniBoard rows={s.rows} marks={s.marks} victims={s.victims} /></div>
              <p className="mt-4 min-h-[4.5rem] text-sm font-bold leading-relaxed">{text[n]}</p>
            </div>
          ))}
        </div>
      </div>
      {/* 頁碼：每一步一顆小圓點，點了直接跳過去（觸控範圍撐到 24px）。放在圖文下面置中（同 Wall Go），按鈕另起一排才不會擠到折行 */}
      <div className="-mt-2 flex justify-center gap-1" role="group" aria-label={`${i + 1} / ${STEPS.length}`}>
        {STEPS.map((_, n) => (
          <button key={n} type="button" onClick={() => goTo(n)} aria-label={`${n + 1}`} aria-current={n === i ? 'step' : undefined}
            className="grid size-6 place-items-center">
            <span className={`block size-2 rounded-full transition ${n === i ? 'scale-125 bg-[#5b6620]' : 'bg-[#5b6620]/30'}`} />
          </button>
        ))}
      </div>
      <div className="flex justify-end gap-2">
        {i > 0 && (
          <button type="button" onClick={() => goTo(i - 1)} className={`${BAGH_SECONDARY} whitespace-nowrap px-4 py-2 text-sm`}>{prev}</button>
        )}
        <button type="button" onClick={() => (last ? onDone() : goTo(i + 1))} className={`${BAGH_PRIMARY} whitespace-nowrap px-4 py-2 text-sm`}>
          {last ? done : next}
        </button>
      </div>
    </div>
  );
}
