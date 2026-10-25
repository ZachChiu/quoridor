import type { ReactNode } from 'react';
import { baghViewport } from '@/viewport';

/** 虎羊棋的每一頁畫到狀態列底下（見 viewport.ts 的 baghViewport） */
export const viewport = baghViewport;

export default function BaghChalLayout({ children }: { children: ReactNode }) {
  return children;
}
