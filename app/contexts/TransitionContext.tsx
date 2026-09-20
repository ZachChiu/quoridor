'use client'
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import type { Wipe } from '@/components/WipeOverlay';
import WipeOverlay from '@/components/WipeOverlay';

/*
  靜態 import 而不是 next/dynamic。

  實測 dynamic 版本從按下去到覆蓋層進 DOM 要 308ms，而且預先把模組載好
  也不會變快（等 4 秒再按仍是 314ms）—— 慢的不是下載，是 dynamic 自己
  那一輪 lazy/Suspense 的解析。300ms 的空窗按起來就像沒按到。

  anime.js 仍然是動態載入（在元件的 effect 裡），所以真正大的那一包
  不會進首包；靜態進來的只有這個元件本身。第一格畫面因此可以立刻畫出
  「停在磁磚上的色塊」，動畫引擎晚一點到也不影響觀感。
*/

export type { Wipe } from '@/components/WipeOverlay';

interface NavOptions {
  /** 蓋滿時顯示的字，例如進入對局時的「遊戲開始」。省略則只掃場不停留。 */
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
  | { phase: 'cover'; pushed: boolean; target: string; wipe: Wipe }
  | { phase: 'uncover'; target: string; wipe: Wipe };

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

  /*
    閒置時先把動畫用的 chunk 載起來。

    WipeOverlay 與 anime.js 都是動態載入的（約 15 KB gzip，不該進首包）。
    但那表示第一次按下磁磚時要先下載才會動 —— 實測開頭約 330ms 畫面
    完全沒反應，按起來像沒按到。

    在閒置時先載掉就沒有這個空窗，而且仍然不佔首包。失敗不處理：
    真的要用的時候 dynamic import 會再試一次。
  */
  useEffect(() => {
    const warm = () => {
      void import('@/components/WipeOverlay').catch(() => {});
      void import('animejs').catch(() => {});
    };
    if (typeof window === 'undefined') return;
    // 必須用 window.requestIdleCallback(...) 而不是先取出函式再呼叫 ——
    // 拆出來呼叫時 this 不是 window，Chrome 會丟 Illegal invocation，
    // 於是預載整個沒跑掉（而且是安靜地沒跑掉）。
    const w = window as unknown as Window & { requestIdleCallback?: (cb: () => void) => number };
    if (typeof w.requestIdleCallback === 'function') { w.requestIdleCallback(warm); return; }
    const id = window.setTimeout(warm, 1200);
    return () => window.clearTimeout(id);
  }, []);

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

  /*
    cover 播完 → 切路由。

    router.push 必須在 updater **外面**。setState 的 updater 是純函式，
    React 可以重複呼叫、也可以在 render 期間呼叫（dev 的 StrictMode 一定會
    雙呼叫）—— 把導航放進去就等於在 render 中更新 Router：

      Cannot update a component (`Router`) while rendering a different
      component (`TransitionProvider`)

    後果是導航被吞掉，動畫照播但頁面沒換，使用者按了連線對戰卻回到原地。
    production build 沒有 StrictMode，所以只有 npm run dev 會出現 ——
    這也是為什麼只測 build 產物會漏掉它。

    改成直接讀 closure 裡的 state：這個 callback 只由動畫的 onComplete 呼叫，
    那時 render 早就結束了，不會有讀到舊值的問題（WipeOverlay 每次 render
    都把最新的 onDone 同步進 ref）。
  */
  const handleCovered = useCallback(() => {
    if (state.phase !== 'cover' || state.pushed) return;
    router.push(state.target);
    setState({ ...state, pushed: true });
  }, [state, router]);

  // 新頁面的 pathname 生效 → 掃走。在 render 期間比對而不是用 effect：
  // 後者會多一次 render，中間那一幀是「已經到新頁面但色帶還沒開始掃」。
  if (state.phase === 'cover' && state.pushed && pathOf(pathname) === pathOf(state.target)) {
    setState({ phase: 'uncover', target: state.target, wipe: state.wipe });
  }

  // 保險：路由若因任何原因沒生效，2 秒後仍要把畫面還給使用者 ——
  // 蓋住不動比動畫醜一百倍。
  useEffect(() => {
    if (state.phase !== 'cover') return;
    const timer = setTimeout(() => {
      setState((s) =>
        s.phase === 'cover' ? { phase: 'uncover', target: s.target, wipe: s.wipe } : s
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
