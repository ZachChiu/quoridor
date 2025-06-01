/**
 * Google Analytics 事件追蹤工具函數
 */

// 定義 window.gtag 類型
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
 * 追蹤按鈕點擊事件
 * @param buttonName - 按鈕名稱
 * @param category - 事件類別 (可選)
 * @param label - 事件標籤 (可選)
 * @param value - 事件值 (可選)
 * @param additionalParams - 額外參數 (可選)
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
 * 追蹤頁面瀏覽事件
 * @param pagePath - 頁面路徑
 * @param pageTitle - 頁面標題 (可選)
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
 * 追蹤自定義事件
 * @param eventName - 事件名稱
 * @param params - 事件參數
 */
export const trackEvent = (eventName: string, params: Record<string, unknown> = {}) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, params);
  }
};
