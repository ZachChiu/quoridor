'use client'
import { useCallback, useEffect, useRef } from 'react';
import type { Difficulty } from '@/game/ai';
import type { AiMove, AiRequest, AiResponse } from '@/workers/ai.worker';

/**
 * 驅動 AI Worker。
 *
 * 每次請求帶一個遞增的 id，只接受最新一次的回覆 ——
 * 使用者中途重新開始或悔棋時，先前那次思考的結果必須丟棄，
 * 否則會把過期的走法套用到新盤面上。
 */
export function useAiOpponent(onMove: (move: AiMove) => void) {
  const workerRef = useRef<Worker | null>(null);
  const latestIdRef = useRef(0);
  const onMoveRef = useRef(onMove);

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
        console.error('[ai] worker 失敗：', data.error);
        return;
      }
      if (data.move) onMoveRef.current(data.move);
    };

    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  /** 請 AI 思考。呼叫此函式會讓先前尚未回覆的請求失效。 */
  const think = useCallback(
    (wgf: string, difficulty: Difficulty, options?: { maxDepth?: number; budgetMs?: number }) => {
      const id = ++latestIdRef.current;
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
  }, []);

  return { think, warmup, cancel };
}
