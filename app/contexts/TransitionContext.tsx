'use client'
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { usePathname, useRouter } from 'next/navigation';
import type { Wipe } from '@/components/WipeOverlay';

// 動態載入，anime.js 才不會進首屏。實測只在元件內部 await import 不夠 ——
// Turbopack 仍會把約 11.7 KB gzip 提到首屏。
const WipeOverlay = dynamic(() => import('@/components/WipeOverlay'), { ssr: false });

export type { Wipe } from '@/components/WipeOverlay';

interface NavOptions {
  /** 蓋滿時顯示的字，例如進入對局時的「遊戲開始」。省略則只掃場不停留。 */
  title?: string;
  /** 轉場形式。省略時用色帶。 */
  wipe?: Wipe;
}

interface TransitionContextValue {
  navigate: (href: string, options?: NavOptions) => void;
  /** 動畫進行中。呼叫端可用來擋住重複點擊。 */
  busy: boolean;
}

const TransitionContext = createContext<TransitionContextValue | undefined>(undefined);

type State =
  | { phase: 'idle' }
  // pushed 放在 state 而不是 ref：ref 沒辦法在 render 期間讀（react-hooks/refs），
  // 而「路由生效就掃走」用 render 期間比對比用 effect 乾淨。
  | { phase: 'cover'; pushed: boolean; title?: string; target: string; wipe: Wipe }
  | { phase: 'uncover'; title?: string; target: string; wipe: Wipe };

/** 取出 href 的路徑部分 —— /match#roomId=… 的 pathname 是 /match。 */
const pathOf = (href: string) => href.split('#')[0].split('?')[0].replace(/\/$/, '') || '/';

/**
 * 換頁掃場。
 *
 * 流程：cover 蓋滿 → 切路由 → 等新頁面的 pathname 生效 → uncover 掃走。
 * 覆蓋層掛在 layout，換頁時不會被卸載，所以能橫跨整個過程。
 *
 * 刻意沒有「點一下跳過」：中途打斷會在色帶蓋到一半時露出舊頁面，
 * 比看完整段更難受。整段約 1.2 秒（無標題時 0.8 秒）。
 */
export const TransitionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [state, setState] = useState<State>({ phase: 'idle' });

  const navigate = useCallback(
    (href: string, options?: NavOptions) => {
      // 開了 prefers-reduced-motion 就直接換頁。不是把動畫放慢 ——
      // 對前庭系統敏感的人來說，慢的大位移比快的更難受。
      const reduce =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduce) {
        router.push(href);
        return;
      }
      setState({
        phase: 'cover', pushed: false, target: href,
        title: options?.title,
        // 沒指定起點就從畫面中心擴散 —— 任何未來的呼叫端都不會壞
        wipe: options?.wipe ?? {
          x: window.innerWidth / 2,
          y: window.innerHeight / 2,
          color: 'rgb(var(--tile-ink))',
        },
      });
    },
    [router]
  );

  // cover 播完 → 切路由
  const handleCovered = useCallback(() => {
    setState((s) => {
      if (s.phase !== 'cover' || s.pushed) return s;
      router.push(s.target);
      return { ...s, pushed: true };
    });
  }, [router]);

  // 新頁面的 pathname 生效 → 掃走。在 render 期間比對而不是用 effect：
  // 後者會多一次 render，中間那一幀是「已經到新頁面但色帶還沒開始掃」。
  if (state.phase === 'cover' && state.pushed && pathOf(pathname) === pathOf(state.target)) {
    setState({ phase: 'uncover', title: state.title, target: state.target, wipe: state.wipe });
  }

  // 保險：路由若因任何原因沒生效，2 秒後仍要把畫面還給使用者 ——
  // 蓋住不動比動畫醜一百倍。
  useEffect(() => {
    if (state.phase !== 'cover') return;
    const timer = setTimeout(() => {
      setState((s) =>
        s.phase === 'cover' ? { phase: 'uncover', title: s.title, target: s.target, wipe: s.wipe } : s
      );
    }, 2000);
    return () => clearTimeout(timer);
  }, [state.phase]);

  const handleUncovered = useCallback(() => setState({ phase: 'idle' }), []);

  return (
    <TransitionContext.Provider value={{ navigate, busy: state.phase !== 'idle' }}>
      {children}
      {state.phase !== 'idle' && (
        <WipeOverlay
          phase={state.phase}
          wipe={state.wipe}
          title={state.title}
          onDone={state.phase === 'cover' ? handleCovered : handleUncovered}
        />
      )}
    </TransitionContext.Provider>
  );
};

export const useTransition = () => {
  const context = useContext(TransitionContext);
  if (!context) {
    throw new Error('useTransition 必須在 TransitionProvider 內使用');
  }
  return context;
};
