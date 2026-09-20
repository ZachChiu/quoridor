/// <reference lib="webworker" />
import { chooseOpeningCell, chooseTurn, type AiTurn, type Difficulty } from '@/game/ai';
import type { GameState, Move, PlayerKey } from '@/game/types';

/**
 * AI 對手跑在 Worker 裡。
 *
 * 困難難度每手要想 1.2 秒 —— 放在主執行緒會整整凍住畫面一秒多，
 * 連「AI 思考中」的動畫都不會動。GameState 是純資料（陣列與物件），
 * 可以直接走 structured clone，不需要自己序列化。
 */
/** 請求本體。id 另外交集上去 —— Omit<聯集, 'id'> 不會逐支分配，會把欄位取成交集。 */
export type AiRequestBody =
  | { kind: 'turn'; state: GameState; me: PlayerKey; difficulty: Difficulty }
  | { kind: 'opening'; state: GameState; me: PlayerKey };

export type AiRequest = AiRequestBody & { id: number };

export type AiResponse =
  | { id: number; kind: 'turn'; turn: AiTurn | null }
  | { id: number; kind: 'opening'; cell: Move | null };

self.onmessage = (event: MessageEvent<AiRequest>) => {
  const req = event.data;
  if (req.kind === 'turn') {
    const turn = chooseTurn(req.state, req.me, req.difficulty);
    self.postMessage({ id: req.id, kind: 'turn', turn } satisfies AiResponse);
  } else {
    const cell = chooseOpeningCell(req.state, req.me);
    self.postMessage({ id: req.id, kind: 'opening', cell } satisfies AiResponse);
  }
};
