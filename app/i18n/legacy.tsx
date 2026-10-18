import type { Metadata } from 'next';
import LegacyRedirect from '@/components/LegacyRedirect';
import { localePath, type Locale } from './locales';
import { MOVED } from './routes';

/**
 * 舊網址頁面（只做轉址）的共用件：noindex、canonical 指向新網址。
 * 搜尋引擎看到的是 CloudFront 的 301；這裡的 canonical 是給「萬一走到這一頁」時表態用。
 */
export function legacyMetadata(locale: Locale, oldPath: string): Metadata {
  return {
    robots: { index: false, follow: true },
    alternates: { canonical: localePath(locale, MOVED[oldPath]) },
  };
}

export function Legacy({ locale, oldPath }: { locale: Locale; oldPath: string }) {
  return <LegacyRedirect to={`${localePath(locale, MOVED[oldPath])}/`} />;
}
