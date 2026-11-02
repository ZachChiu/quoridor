'use client';
import { useState } from 'react';

/**
 * 記住最後一個不是 null 的值。
 *
 * 用一個可以是 null 的 state 同時管「開不開」與「開的是哪個」的彈窗（例如選了右邊那方才跳出來的難度彈窗），
 * 一關就變回 null，淡出的那幾百毫秒內容會退回預設那一邊 —— 選右邊、關掉時閃一下左邊的樣子（11/1 Zach）。
 * 彈窗的內容改讀這個值，開關照舊看原本的 state。
 */
export function useLatched<T>(value: T | null): T | null {
  const [last, setLast] = useState(value);
  if (value !== null && value !== last) setLast(value);
  return value ?? last;
}
