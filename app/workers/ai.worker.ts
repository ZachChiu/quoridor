/// <reference lib="webworker" />
import { chooseOpeningPlacement, chooseTurn, type Difficulty } from '@/game/ai';
import { isPlacingPhase, replay, type Turn } from '@/game/engine';

/**
 * AI 思考 Worker。
 *
 * 跑在獨立執行緒，讓困難難度的深層搜尋不會凍住 UI。
 *
 * 訊息傳的是 WGF 棋譜字串而非整個 GameState —— 棋譜小得多，
 * 且 Worker 端用同一份 engine 重播即可得到完全一致的盤面，
 * 不必為了跨執行緒傳輸而另外序列化狀態。
 */

export type AiRequest = {
  /** 對應回覆用的識別碼，避免使用者快速重開新局時收到過期結果。 */
  id: number;
  wgf: string;
  difficulty: Difficulty;
  /**
   * 預熱請求：只為了把模組載入並讓 JIT 先跑過一遍，結果會被丟棄。
   *
   * 首次思考實測約 5 秒，其中大半是 Worker 模組載入與 JIT 暖身的一次性成本。
   * 在玩家思考第一手時先預熱，就能把這段時間移出關鍵路徑。
   */
  warmup?: boolean;
  /** 覆寫搜尋深度；用於需要確定性結果的場合（例如測試）。 */
  maxDepth?: number;
  budgetMs?: number;
};

/** AI 的決策：開局階段是落子位置，對弈階段是一個完整回合。 */
export type AiMove =
  | { kind: 'opening'; cell: { row: number; col: number } }
  | { kind: 'turn'; turn: Turn };

export type AiResponse =
  | { id: number; ok: true; move: AiMove | null; elapsedMs: number }
  | { id: number; ok: false; error: string };

self.onmessage = (event: MessageEvent<AiRequest>) => {
  const { id, wgf, difficulty, maxDepth, budgetMs, warmup } = event.data;
  const started = Date.now();

  try {
    const state = replay(wgf);

    if (warmup) {
      // 跑一次最淺的搜尋讓程式碼路徑都被執行過，結果不回傳
      chooseTurn(state, { difficulty, maxDepth: 1, budgetMs: 1000 });
      self.postMessage({ id, ok: true, move: null, elapsedMs: Date.now() - started } as AiResponse);
      return;
    }

    let move: AiMove | null = null;
    if (isPlacingPhase(state)) {
      const cell = chooseOpeningPlacement(state, { difficulty });
      if (cell) move = { kind: 'opening', cell };
    } else {
      const { turn } = chooseTurn(state, { difficulty, maxDepth, budgetMs });
      if (turn) move = { kind: 'turn', turn };
    }

    const response: AiResponse = { id, ok: true, move, elapsedMs: Date.now() - started };
    self.postMessage(response);
  } catch (error) {
    const response: AiResponse = {
      id,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
    self.postMessage(response);
  }
};
