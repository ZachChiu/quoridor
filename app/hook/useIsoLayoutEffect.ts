import { useEffect, useLayoutEffect } from 'react';

/**
 * 在畫面畫出來之前跑的 effect，伺服器端自動退回 useEffect。
 *
 * 用途是「hydration 之後、第一次 paint 之前」要修正的東西 ——
 * 例如從網址 hash 還原對局模式。放 useEffect 會慢一幀，
 * 使用者會先看到錯的版面再看它跳掉。
 *
 * 直接用 useLayoutEffect 的話，靜態匯出預先渲染這些 client component 時
 * React 會警告「useLayoutEffect does nothing on the server」。
 */
export const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;
