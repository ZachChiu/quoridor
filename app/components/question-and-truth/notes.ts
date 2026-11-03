import { HAND_SIZE } from '@/games/question-and-truth/engine';

/**
 * 推理筆記：對方 8 個位置 × 13 個點數，每格三種狀態 —— 0 沒寫、1 劃掉（不可能）、2 圈起來（就是它）。
 * 只是自己記的，程式不幫忙推（不然就不用推理了）；說真相時拿來預先填好。
 */
export type Notes = number[][];
export const emptyNotes = (): Notes => Array.from({ length: HAND_SIZE }, () => new Array(13).fill(0));

export function cycle(notes: Notes, pos: number, rank: number): Notes {
  return notes.map((row, p) => (p === pos ? row.map((v, r) => (r === rank - 1 ? (v + 1) % 3 : v)) : row));
}

/** 一個位置的摘要：圈起來的那個點數；沒圈的話，沒劃掉的只剩一個就是它；都不是就回傳還剩幾個 */
export function summary(row: number[]): { rank: number | null; left: number } {
  const circled = row.flatMap((v, i) => (v === 2 ? [i + 1] : []));
  const open = row.flatMap((v, i) => (v !== 1 ? [i + 1] : []));
  if (circled.length === 1) return { rank: circled[0], left: 1 };
  if (open.length === 1) return { rank: open[0], left: 1 };
  return { rank: null, left: open.length };
}

/** 說真相時先填好的那 8 個（不確定的留空） */
export const prefill = (notes: Notes) => notes.map((row) => summary(row).rank);
