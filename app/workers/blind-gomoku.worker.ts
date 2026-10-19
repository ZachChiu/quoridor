/// <reference lib="webworker" />
import { chooseMove, type Level } from '@/games/blind-gomoku/ai';
import { decodeMoves, replay, type Move } from '@/games/blind-gomoku/engine';

/**
 * 盲眼五子棋的電腦對手 Worker。
 *
 * 困難級每手最多搜約 0.3 秒，手機上可能更久；放在主執行緒的話，那段時間裡
 * 棋子發光、翻子這些動畫會卡住。訊息傳的是棋譜字串（encodeMoves），
 * Worker 用同一份 engine 重播 —— 跟 Wall Go 的 ai.worker 同一個做法。
 */
export type GomokuAiRequest = { id: number; moves: string; level: Level };
export type GomokuAiResponse =
  | { id: number; ok: true; move: Move | null }
  | { id: number; ok: false; error: string };

self.onmessage = (event: MessageEvent<GomokuAiRequest>) => {
  const { id, moves, level } = event.data;
  let response: GomokuAiResponse;
  try {
    response = { id, ok: true, move: chooseMove(replay(decodeMoves(moves)), level) };
  } catch (error) {
    response = { id, ok: false, error: error instanceof Error ? error.message : String(error) };
  }
  self.postMessage(response);
};
