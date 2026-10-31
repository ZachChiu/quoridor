'use client';
import { useCallback, useEffect, useRef } from 'react';
import { chooseMove, type Level } from '@/games/blind-gomoku/ai';
import { encodeMoves, type GomokuState, type Move } from '@/games/blind-gomoku/engine';
import type { GomokuAiRequest, GomokuAiResponse } from '@/workers/blind-gomoku.worker';

/**
 * 電腦對手：問 Worker，最慢也壓到 MIN_THINK_MS 才落子 ——
 * 算完就立刻下的話，玩家的子跟電腦的子幾乎同時出現，看不出電腦下在哪（盲棋更需要看清楚）。
 *
 * 每次 ask 都帶遞增的 id，只收最新一次的回覆：中途重來、換模式時，舊的答案要丟掉。
 * Worker 載不起來（chunk 下載失敗之類）就改在主執行緒算，困難級縮短思考時間，對局不會卡住。
 */
const MIN_THINK_MS = 450;

type Job = { id: number; state: GomokuState; level: Level; askedAt: number; onMove: (m: Move) => void };
type TimerRef = { current: ReturnType<typeof setTimeout> | null };

function clearTimer(ref: TimerRef) {
  if (ref.current) { clearTimeout(ref.current); ref.current = null; }
}

export function useGomokuAi(enabled: boolean) {
  const workerRef = useRef<Worker | null>(null);
  const deadRef = useRef(false);
  const latestRef = useRef(0);
  const jobRef = useRef<Job | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const deliver = useCallback((id: number, move: Move | null) => {
    const job = jobRef.current;
    if (!job || job.id !== id || id !== latestRef.current) return;
    jobRef.current = null;
    if (!move) return;
    const wait = Math.max(0, MIN_THINK_MS - (performance.now() - job.askedAt));
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      if (id === latestRef.current) job.onMove(move);
    }, wait);
  }, []);

  const fallback = useCallback((id: number) => {
    const job = jobRef.current;
    if (!job || job.id !== id) return;
    deliver(id, chooseMove(job.state, job.level, { budgetMs: 150 }));
  }, [deliver]);

  useEffect(() => {
    if (!enabled) return;
    let worker: Worker;
    try {
      worker = new Worker(new URL('../../workers/blind-gomoku.worker.ts', import.meta.url));
    } catch {
      deadRef.current = true;
      return;
    }
    workerRef.current = worker;
    worker.onmessage = (event: MessageEvent<GomokuAiResponse>) => {
      const data = event.data;
      if (data.ok) deliver(data.id, data.move);
      else { console.error('[blind-gomoku ai]', data.error); fallback(data.id); }
    };
    worker.onerror = (event) => {
      console.error('[blind-gomoku ai] worker 無法執行，改在主執行緒算：', event.message);
      deadRef.current = true;
      if (jobRef.current) fallback(jobRef.current.id);
    };
    return () => {
      worker.terminate();
      workerRef.current = null;
      clearTimer(timerRef);
    };
  }, [enabled, deliver, fallback]);

  /** 請電腦下一手。會讓先前還沒回來的那次失效 */
  const ask = useCallback((state: GomokuState, level: Level, onMove: (m: Move) => void) => {
    const id = ++latestRef.current;
    clearTimer(timerRef);
    jobRef.current = { id, state, level, askedAt: performance.now(), onMove };
    const worker = workerRef.current;
    if (!worker || deadRef.current) {
      // 讓出一格畫面再算，玩家剛下的子先畫出來
      timerRef.current = setTimeout(() => { timerRef.current = null; fallback(id); }, 30);
      return;
    }
    const request: GomokuAiRequest = { id, moves: encodeMoves(state.moves), level };
    worker.postMessage(request);
  }, [fallback]);

  /** 讓進行中的思考失效（重來、離開） */
  const cancel = useCallback(() => {
    latestRef.current++;
    jobRef.current = null;
    clearTimer(timerRef);
  }, []);

  return { ask, cancel };
}
