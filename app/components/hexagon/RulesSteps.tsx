'use client';
import { lineOf } from '@/games/hexagon/engine';
import HexBoard, { type BoardLine } from './HexBoard';

/**
 * 規則的每一步一張小圖：都用對局那塊盤面畫靜態的局面。題目是節目第 9 回合那一盤（目標 11，答案 EFG、FJN、GKO、HIJ、INR）。
 */
const BOARD = [4, 7, 1, 4, 3, 3, 5, 6, 3, 2, 5, 2, 2, 6, 1, 1, 1, 2, 5];
const at = (s: string) => [...s].map((ch) => 'ABCDEFGHIJKLMNOPQRS'.indexOf(ch));
const line = (s: string, kind: BoardLine['kind']): BoardLine => ({ line: lineOf(at(s)), kind });

export const FIGS: { face: 'numbers' | 'letters'; selected?: number[]; lines?: BoardLine[] }[] = [
  { face: 'numbers' },
  { face: 'letters' },
  { face: 'letters', selected: at('FJN') },
  { face: 'letters', lines: [line('EFG', 'found'), line('FJN', 'found')] },
  { face: 'numbers', lines: [line('EFG', 'found'), line('FJN', 'found'), line('GKO', 'missed'), line('HIJ', 'missed'), line('INR', 'missed')] },
];

export function RuleFigure({ index, className = '' }: { index: number; className?: string }) {
  const f = FIGS[index];
  return (
    <div className={className}>
      <HexBoard board={BOARD} face={f.face} selected={f.selected} lines={f.lines} />
    </div>
  );
}
