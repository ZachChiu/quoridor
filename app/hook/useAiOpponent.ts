'use client'
import { useCallback, useEffect, useRef, useState } from 'react';
import type { AiRequestBody, AiResponse } from '@/workers/ai.worker';
import type { AiTurn, Difficulty } from '@/game/ai';
import type { GameState, Move, PlayerKey } from '@/game/types';

/**
 * 把 AI 包成「問一手、等回覆」的介面。
 *
 * Worker 以動態的 new URL(...) 建立，Turbopack 會把它切成獨立的 chunk ——
 * 不玩單人對戰的人不會下載 AI 的搜尋程式碼。
 */
export function useAiOpponent() {
  const workerRef = useRef<Worker | null>(null);
  const seq = useRef(0);
  const pending = useRef(new Map<number, (value: AiResponse) => void>());
  const [thinking, setThinking] = useState(false);

  useEffect(() => {
    const worker = new Worker(new URL('../workers/ai.worker.ts', import.meta.url));
    worker.onmessage = (event: MessageEvent<AiResponse>) => {
      pending.current.get(event.data.id)?.(event.data);
      pending.current.delete(event.data.id);
    };
    workerRef.current = worker;
    // 把 Map 複製到區域變數再給 cleanup 用：ref.current 在 cleanup 執行時
    // 可能已經指向別的東西（react-hooks/exhaustive-deps 擋的就是這個）
    const inflight = pending.current;
    return () => {
      worker.terminate();
      workerRef.current = null;
      inflight.clear();
    };
  }, []);

  const ask = useCallback((req: AiRequestBody): Promise<AiResponse | null> => {
    const worker = workerRef.current;
    if (!worker) return Promise.resolve(null);
    const id = ++seq.current;
    setThinking(true);
    return new Promise<AiResponse | null>((resolve) => {
      pending.current.set(id, (value) => {
        setThinking(false);
        resolve(value);
      });
      worker.postMessage({ ...req, id });
    });
  }, []);

  const requestTurn = useCallback(
    async (state: GameState, me: PlayerKey, difficulty: Difficulty): Promise<AiTurn | null> => {
      const res = await ask({ kind: 'turn', state, me, difficulty });
      return res?.kind === 'turn' ? res.turn : null;
    },
    [ask]
  );

  const requestOpening = useCallback(
    async (state: GameState, me: PlayerKey): Promise<Move | null> => {
      const res = await ask({ kind: 'opening', state, me });
      return res?.kind === 'opening' ? res.cell : null;
    },
    [ask]
  );

  return { requestTurn, requestOpening, thinking };
}
