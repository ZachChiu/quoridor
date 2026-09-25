'use client';
import { useEffect } from 'react';
import ErrorScreen from '@/components/ErrorScreen';
import { useLocale, useMessages } from '@/i18n/LocaleProvider';

/** en / ja / ko 的執行期錯誤畫面。語系從 layout 的 Provider 拿，不必猜網址。 */
export default function Error({ error }: { error: Error & { digest?: string } }) {
  const t = useMessages();
  const locale = useLocale();
  useEffect(() => {
    void import('@sentry/nextjs').then((Sentry) => Sentry.captureException(error)).catch(() => {});
  }, [error]);
  return <ErrorScreen t={t.error} locale={locale} />;
}
