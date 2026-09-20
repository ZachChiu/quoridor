import type { Metadata } from 'next';
import { Shell, baseMetadata } from '@/shell';
import { siteViewport } from '@/viewport';
import { getMessages } from '@/i18n';


/**
 * zh-TW 的 root layout。網址不加語系前綴，所以這一組涵蓋
 * /、/rules、/solo、/local、/match。
 */
export const viewport = siteViewport;

export const metadata: Metadata = {
  ...baseMetadata,
  title: {
    default: getMessages('zh-TW').meta.titleDefault,
    template: getMessages('zh-TW').meta.titleTemplate,
  },
  description: getMessages('zh-TW').meta.description,
  keywords: [...getMessages('zh-TW').meta.keywords],
};

export default function DefaultLayout({ children }: { children: React.ReactNode }) {
  return <Shell locale="zh-TW">{children}</Shell>;
}
