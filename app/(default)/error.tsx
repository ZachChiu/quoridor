'use client';
import { useEffect } from 'react';
import ErrorScreen from '@/components/ErrorScreen';
import { useMessages } from '@/i18n/LocaleProvider';

/** zh-TW 的執行期錯誤畫面。layout（字型、Provider）還在，只換掉頁面本體。 */
export default function Error({ error }: { error: Error & { digest?: string } }) {
  const t = useMessages();
  useEffect(() => {
    // 跟 global-error 一樣動態載 Sentry：只有真的出錯才需要它
    void import('@sentry/nextjs').then((Sentry) => Sentry.captureException(error)).catch(() => {});
  }, [error]);
  return <ErrorScreen t={t.error} locale="zh-TW" />;
}
