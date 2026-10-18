/**
 * 等一件事，但最多等 ms 毫秒；逾時就 reject。
 *
 * 給 Firebase 用：資料庫連不上時（網路斷掉、Spark 方案 100 條同時連線用滿），
 * SDK 會在背景一直重試，`set()`、`get()` 的 promise 可能**永遠不會結束** ——
 * 畫面就一直停在「連線中…」，使用者不知道該等還是該走。
 * 有了上限，逾時就走「連不上房間」的畫面，至少給他重新整理與回首頁兩條路。
 */
export const CONNECT_TIMEOUT_MS = 15_000;

/**
 * 逾時專用的錯誤型別：回報連線失敗時要分得出「等太久」與「Firebase 回了錯誤」，
 * 兩者的原因完全不同（前者多半是網路或連線數用滿，後者是規則或驗證）。
 */
export class TimeoutError extends Error {
  readonly ms: number;
  constructor(ms: number) {
    super(`逾時（${ms}ms）`);
    this.name = 'TimeoutError';
    this.ms = ms;
  }
}

export function withTimeout<T>(promise: Promise<T>, ms: number = CONNECT_TIMEOUT_MS): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new TimeoutError(ms)), ms);
    promise.then(
      (value) => { clearTimeout(timer); resolve(value); },
      (error) => { clearTimeout(timer); reject(error); },
    );
  });
}
