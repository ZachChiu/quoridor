import type { OnlineFailReason, OnlineStep } from '@/types/online';
import { TimeoutError, withTimeout } from './withTimeout';

/**
 * 連線對戰失敗的分類與回報。
 *
 * 為什麼需要：2026-10-03 一天有 17 次 connectFail、6 次 createFail，
 * 但錯誤只被 catch 起來 console.error ＋ GA，沒有送 Sentry，也不知道卡在哪一步，
 * 事後完全查不到原因（見 docs/online-error-reporting.md）。
 *
 * 做法：每一個會碰 Firebase 的 await 都包一層 atStep —— 失敗時把原本的錯
 * 包成 OnlineStepError，帶上「哪一步」；逾時由 withTimeout 丟 TimeoutError。
 * catch 那邊再用 describeOnlineError 拆回 step 與 timeout。
 */
export class OnlineStepError extends Error {
  readonly step: OnlineStep;
  constructor(step: OnlineStep, cause: unknown) {
    super(`${step} 失敗`, { cause });
    this.name = 'OnlineStepError';
    this.step = step;
  }
}

/** 等一步 Firebase 操作（最多 15 秒），失敗就標上是哪一步 */
export async function atStep<T>(step: OnlineStep, promise: Promise<T>, ms?: number): Promise<T> {
  try {
    return await withTimeout(promise, ms);
  } catch (err) {
    throw new OnlineStepError(step, err);
  }
}

export type OnlineErrorInfo = {
  /** 沒經過 atStep 的錯（程式本身的 bug）是 undefined */
  step?: OnlineStep;
  timeout: boolean;
  /** 真正的原因：Firebase 的錯或 TimeoutError */
  cause: unknown;
};

export function describeOnlineError(err: unknown): OnlineErrorInfo {
  if (err instanceof OnlineStepError) {
    return { step: err.step, timeout: err.cause instanceof TimeoutError, cause: err.cause };
  }
  return { timeout: err instanceof TimeoutError, cause: err };
}

/**
 * 送 Sentry。SDK 照專案慣例動態載入，連線頁不會因此多載整包。
 *
 * SDK 是在瀏覽器閒置後才 init（instrumentation-client.ts），
 * 很快就失敗的情況（例如規則擋下、1 秒內就回錯）可能發生在 init 之前 ——
 * 那時 captureException 什麼都不會做，所以先等 client 就緒（最多約 10 秒）。
 *
 * 只帶 reason／step／timeout，**不帶 roomId、uid** 這類可識別資訊。
 */
export function reportOnlineError(reason: OnlineFailReason, info: OnlineErrorInfo): void {
  const step = info.step ?? 'unknown';
  void import('@sentry/nextjs')
    .then(async (Sentry) => {
      for (let i = 0; i < 20 && !Sentry.getClient(); i++) {
        await new Promise((r) => setTimeout(r, 500));
      }
      // 送原本的錯（Firebase 的錯或 TimeoutError），不是外面那層包裝 ——
      // Sentry 的標題才會是真正的原因。分組則按 reason／step／timeout，
      // 同一種失敗不管原因字串長怎樣都歸在一起，數量才看得出來。
      Sentry.withScope((scope) => {
        // 房號在網址的 hash 裡（#roomId=…），Sentry 會自動附上頁面網址與換頁紀錄 ——
        // 這筆事件把 hash 全部剝掉，不讓房號跟著送出去
        scope.addEventProcessor((event) => {
          if (event.request?.url) event.request.url = stripHash(event.request.url);
          for (const crumb of event.breadcrumbs ?? []) {
            for (const key of ['from', 'to', 'url'] as const) {
              const v = crumb.data?.[key];
              if (typeof v === 'string') crumb.data![key] = stripHash(v);
            }
          }
          return event;
        });
        Sentry.captureException(info.cause, {
          tags: { reason, step, timeout: info.timeout },
          fingerprint: ['online-error', reason, step, info.timeout ? 'timeout' : 'error'],
        });
      });
    })
    .catch(() => {});
}

/** 網址去掉 # 之後的部分（房號、開房參數都放在 hash） */
export function stripHash(url: string): string {
  const i = url.indexOf('#');
  return i === -1 ? url : url.slice(0, i);
}
