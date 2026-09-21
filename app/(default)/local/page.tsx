import type { Metadata } from 'next';
import LocalView from '@/views/LocalView';
import { getMessages } from '@/i18n';

export const metadata: Metadata = {
  title: getMessages('zh-TW').local.metaTitle,
  /*
    不索引，與 /en/local /ja/local /ko/local 一致。

    這是一進去就開局的畫面，除了 sr-only 的 h1 之外沒有任何可讀文字 ——
    收錄了也只是一個空殼。原本中文版忘了設，變成「sitemap 說收我、
    頁面說別收」，Search Console 會直接報 Submitted URL marked noindex。

    要讓它值得被索引，得先給它一段真正的內容（例如「兩人怎麼在同一台
    裝置上輪流玩」），那是另一件事。
  */
  robots: { index: false, follow: true },
};

export default function LocalPage() {
  return <LocalView locale="zh-TW" />;
}
