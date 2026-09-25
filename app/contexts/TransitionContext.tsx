'use client'
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
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
  /**
   * 原地播一次掃場（蓋滿再掃走），不換頁。
   *
   * 給「畫面沒換、但發生了一件該被看見的事」用 —— 目前是連線房間坐滿、
   * 對局正式開始。沒有這一下的話，等待畫面會直接被棋盤取代，
   * 而正在看分享連結的人根本不會注意到自己已經在局裡了。
   *
   * `holdMs` 是蓋滿之後停留多久再掃走。換頁的轉場不需要停（停的時間
   * 本來就花在載入新頁面上），原地閃的沒有那段空檔 —— 不停的話
   * 蓋上去和掃下來是連在一起的，字根本來不及讀。
   *
   * `onCovered` 在**蓋滿的那一刻**呼叫，用來換掉底下的畫面（關 Modal、
   * 切換到棋盤）—— 在色塊底下換，使用者才不會看到 Modal 先消失一下
   * 再被蓋住。保證只會被呼叫一次，而且連 2 秒保險那條路徑也會呼叫，
   * 不會因為動畫出事就永遠卡在舊畫面。
   */
  flash: (wipe: Wipe, options?: { holdMs?: number; onCovered?: () => void }) => void;
  /** 動畫進行中。呼叫端可用來擋住重複點擊。 */
  busy: boolean;
}

const TransitionContext = createContext<TransitionContextValue | undefined>(undefined);

type State =
  | { phase: 'idle' }
  // pushed 放在 state 而不是 ref：ref 沒辦法在 render 期間讀（react-hooks/refs），
  // 而「路由生效就掃走」用 render 期間比對比用 effect 乾淨。
  // flash：原地播完就掃走，不切路由
  | { phase: 'cover'; pushed: boolean; target: string; wipe: Wipe; flash?: boolean }
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
  // flash 專用：蓋滿時要做的事、以及蓋滿後停留多久
  const coveredRef = useRef<(() => void) | null>(null);
  const holdRef = useRef(0);
  /** 保證只跑一次 —— 正常路徑與 2 秒保險都會走到這裡 */
  const fireCovered = useCallback(() => {
    const fn = coveredRef.current;
    coveredRef.current = null;
    fn?.();
  }, []);

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
  const flash = useCallback((wipe: Wipe, options?: { holdMs?: number; onCovered?: () => void }) => {
    // 與 navigate 一致：開了 prefers-reduced-motion 就不播動畫 ——
    // 但底下該換的畫面還是要換，否則會永遠停在舊畫面上
    if (typeof window !== 'undefined'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      options?.onCovered?.();
      return;
    }
    coveredRef.current = options?.onCovered ?? null;
    holdRef.current = options?.holdMs ?? 0;
    setState({ phase: 'cover', pushed: true, target: '', wipe, flash: true });
  }, []);

  const handleCovered = useCallback(() => {
    if (state.phase !== 'cover') return;
    // 原地閃一下：蓋滿之後直接掃走，沒有路由可等
    if (state.flash) {
      fireCovered();
      const go = () => setState((s) =>
        s.phase === 'cover' ? { phase: 'uncover', target: s.target, wipe: s.wipe } : s);
      if (holdRef.current > 0) setTimeout(go, holdRef.current); else go();
      return;
    }
    if (state.pushed) return;
    router.push(state.target);
    setState({ ...state, pushed: true });
  }, [state, router, fireCovered]);

  // 新頁面的 pathname 生效 → 掃走。在 render 期間比對而不是用 effect：
  // 後者會多一次 render，中間那一幀是「已經到新頁面但色帶還沒開始掃」。
  if (state.phase === 'cover' && state.pushed && !state.flash && pathOf(pathname) === pathOf(state.target)) {
    setState({ phase: 'uncover', target: state.target, wipe: state.wipe });
  }

  // 保險：路由若因任何原因沒生效，2 秒後仍要把畫面還給使用者 ——
  // 蓋住不動比動畫醜一百倍。
  useEffect(() => {
    if (state.phase !== 'cover') return;
    const timer = setTimeout(() => {
      fireCovered();
      setState((s) =>
        s.phase === 'cover' ? { phase: 'uncover', target: s.target, wipe: s.wipe } : s
      );
    }, 2000 + holdRef.current);
    return () => clearTimeout(timer);
  }, [state.phase, fireCovered]);

  const handleUncovered = useCallback(() => setState({ phase: 'idle' }), []);

  return (
    <TransitionContext.Provider value={{ navigate, flash, busy: state.phase !== 'idle' }}>
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
