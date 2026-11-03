'use client';
import { cellsOf, evaluate, expression, parseBoard } from '@/games/equation-pyramid/engine';
import PyramidBoard from './PyramidBoard';

/**
 * 規則的每一步一張小圖：都用對局那塊盤面畫靜態的局面。題目是節目第 1 回合那一盤（目標 10，答案 ACH、BJD、CEI、DBC、IGC、JHC）。
 */
export const RULE_BOARD = parseBoard('×7 ÷5 +9 −5 ×2 +2 ÷8 ÷3 −8 ×3');
export const RULE_TARGET = 10;

export const FIGS: { selected?: number[] }[] = [
  {},
  { selected: cellsOf('ACH') },
  { selected: cellsOf('ACH') },
  { selected: cellsOf('AHC') },
  { selected: cellsOf('BJD') },
];

/** 圖底下那一行：選了三格就寫算式（對的寫「= 10」、不對的寫「≠ 10」），沒選就只寫目標數 */
export function figureCaption(index: number): string | null {
  const sel = FIGS[index].selected;
  if (!sel) return null;
  const v = evaluate(RULE_BOARD, sel);
  const ok = v && v.q === 1 && v.p === RULE_TARGET;
  return `${expression(RULE_BOARD, sel)} ${ok ? '=' : '≠'} ${RULE_TARGET}`;
}

export function RuleFigure({ index, className = '' }: { index: number; className?: string }) {
  const f = FIGS[index];
  return (
    <div className={className}>
      <PyramidBoard blocks={RULE_BOARD} selected={f.selected} />
    </div>
  );
}
