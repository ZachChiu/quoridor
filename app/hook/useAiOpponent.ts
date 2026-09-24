'use client'
import { useCallback, useEffect, useRef } from 'react';
import { fallbackMove, type Difficulty } from '@/game/ai';
import { replay } from '@/game/engine';
import type { AiMove, AiRequest, AiResponse } from '@/workers/ai.worker';

/**
 * 驅動 AI Worker。
 *
 * 每次請求帶一個遞增的 id，只接受最新一次的回覆 ——
 * 使用者中途重新開始或悔棋時，先前那次思考的結果必須丟棄，
 * 否則會把過期的走法套用到新盤面上。
 *
 * ── 最短思考時間 ─────────────────────────────────────────────────
 * 算完就立刻落子在畫面上是「啪啪啪」三下同時發生 —— 開局擺子與簡單
 * 難度尤其明顯，快到看不出對手做了什麼，也就看不出自己的盤面變了哪裡。
 * 所以不論實際算多久，都壓到至少 MIN_THINK_MS 才回報。
 *
 * 壓在這裡而不是在 PlayClient：那邊一個回合是單一 reducer 轉換，
 * 中間插延遲就得把中間狀態放進 React，而驅動 AI 的 effect 依賴 state，
 * 會在同一回合內重複去問 Worker（CLAUDE.md 有記這件事）。
 * 這裡只是把「回覆」晚一點交出去，狀態機完全不知情。
 *
 * 困難難度本來每手就要一秒多，這個下限對它幾乎不會生效。
 */
const MIN_THINK_MS = 550;
export function useAiOpponent(onMove: (move: AiMove) => void) {
  const workerRef = useRef<Worker | null>(null);
  const latestIdRef = useRef(0);
  const onMoveRef = useRef(onMove);
  const askedAtRef = useRef(0);
  const holdRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // 最新一次請求的棋譜 —— Worker 失敗時拿它算保底的一手
  const pendingWgfRef = useRef('');
  // Worker 本身死掉了（onerror）。之後每一手都直接走保底，不再問它 ——
  // 問一個載不起來的 Worker 永遠不會有回覆，AI 會在下一手卡住。
  const deadRef = useRef(false);
  const playFallbackRef = useRef<() => void>(() => {});

  // 在 effect 中同步而非 render 期間寫入 —— render 期間讀寫 ref
  // 會讓 React Compiler 無法正確推導，並在 concurrent 渲染下產生非預期結果。
  useEffect(() => {
    onMoveRef.current = onMove;
  }, [onMove]);

  useEffect(() => {
    const worker = new Worker(new URL('../workers/ai.worker.ts', import.meta.url));
    workerRef.current = worker;

    worker.onmessage = (event: MessageEvent<AiResponse>) => {
      const data = event.data;
      if (data.id !== latestIdRef.current) return; // 過期結果，丟棄
      if (!data.ok) {
        console.error('[ai] worker 失敗，改下保底的一手：', data.error);
        playFallback();
        return;
      }
      pendingWgfRef.current = ''; // 這一手有答案了，之後的錯誤與它無關
      const move = data.move;
      if (!move) return;
      const wait = Math.max(0, MIN_THINK_MS - (performance.now() - askedAtRef.current));
      if (wait === 0) { onMoveRef.current(move); return; }
      // 等待中使用者仍可能重新開始 —— 落子前再確認一次這步還是最新的
      const id = data.id;
      holdRef.current = setTimeout(() => {
        holdRef.current = null;
        if (id === latestIdRef.current) onMoveRef.current(move);
      }, wait);
    };

    /*
      Worker 失敗時，不能只記 log 就算了 —— AI 會永遠停在「輪到它」，
      玩家只能重新整理。改在主執行緒下一手確定性的保底棋，對局繼續。
      onerror 管的是 Worker 本身載不起來（chunk 下載失敗之類），
      那種情況 onmessage 永遠不會來。
    */
    playFallbackRef.current = playFallback;
    function playFallback() {
      const wgf = pendingWgfRef.current;
      if (!wgf) return;
      pendingWgfRef.current = '';
      const move = fallbackMove(replay(wgf));
      if (move) onMoveRef.current(move);
    }
    worker.onerror = (event) => {
      console.error('[ai] worker 無法執行，改下保底的一手：', event.message);
      deadRef.current = true;
      playFallback();
    };

    return () => {
      if (holdRef.current) clearTimeout(holdRef.current);
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  /** 請 AI 思考。呼叫此函式會讓先前尚未回覆的請求失效。 */
  const think = useCallback(
    (wgf: string, difficulty: Difficulty, options?: { maxDepth?: number; budgetMs?: number }) => {
      const id = ++latestIdRef.current;
      if (holdRef.current) { clearTimeout(holdRef.current); holdRef.current = null; }
      askedAtRef.current = performance.now();
      pendingWgfRef.current = wgf;
      if (deadRef.current) {
        // 一樣壓到最短思考時間，不然 AI 那一手會跟你的同時落下
        holdRef.current = setTimeout(() => {
          holdRef.current = null;
          if (id === latestIdRef.current) playFallbackRef.current();
        }, MIN_THINK_MS);
        return;
      }
      const request: AiRequest = { id, wgf, difficulty, ...options };
      workerRef.current?.postMessage(request);
    },
    []
  );

  /**
   * 預熱 Worker：載入模組並讓 JIT 暖身，結果丟棄。
   *
   * 在玩家還在思考第一手時呼叫，可把首次思考的一次性成本移出關鍵路徑。
   */
  const warmup = useCallback((wgf: string, difficulty: Difficulty) => {
    // 用 id 0 送出，永遠不會等於 latestIdRef 的下一個值，回覆會被丟棄
    workerRef.current?.postMessage({ id: -1, wgf, difficulty, warmup: true } as AiRequest);
  }, []);

  /** 讓目前進行中的思考結果失效（例如重新開始）。 */
  const cancel = useCallback(() => {
    latestIdRef.current++;
    pendingWgfRef.current = '';
    if (holdRef.current) { clearTimeout(holdRef.current); holdRef.current = null; }
  }, []);

  return { think, warmup, cancel };
}
