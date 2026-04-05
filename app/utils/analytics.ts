/**
 * Google Analytics 事件追蹤工具。
 *
 * 這個模組封裝常用的 `gtag` 呼叫，避免元件層重複處理
 * `window` 存在判斷與事件參數格式。
 */

/**
 * 擴充全域 `window` 型別，描述由 Google Analytics 注入的 `gtag` 函式。
 */
declare global {
  interface Window {
    gtag: (
      command: 'event',
      action: string,
      params: {
        event_category?: string;
        event_label?: string;
        value?: number;
        [key: string]: unknown;
      }
    ) => void;
  }
}

/**
 * 送出一筆按鈕點擊事件到 Google Analytics。
 *
 * @param buttonName - 事件名稱，通常使用按鈕或操作的識別字串。
 * @param category - 事件分類，預設為 `按鈕點擊`。
 * @param label - 事件標籤，用於補充操作上下文。
 * @param value - 可選的數值型事件資料。
 * @param additionalParams - 其他要一併送出的自訂參數。
 */
export const trackButtonClick = (
  buttonName: string,
  category: string = '按鈕點擊',
  label: string = '',
  value?: number,
  additionalParams: Record<string, unknown> = {}
) => {
  // 確保 gtag 函數存在
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', buttonName, {
      event_category: category,
      event_label: label,
      value,
      ...additionalParams
    });
  }
};

/**
 * 送出一筆頁面瀏覽事件。
 *
 * @param pagePath - 要回報的頁面路徑。
 * @param pageTitle - 頁面標題；若未提供則使用目前文件標題。
 */
export const trackPageView = (pagePath: string, pageTitle: string = '') => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'page_view', {
      page_path: pagePath,
      page_title: pageTitle || document.title
    });
  }
};

/**
 * 送出一筆自訂事件。
 *
 * @param eventName - 自訂事件名稱。
 * @param params - 事件參數物件。
 */
export const trackEvent = (eventName: string, params: Record<string, unknown> = {}) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, params);
  }
};
