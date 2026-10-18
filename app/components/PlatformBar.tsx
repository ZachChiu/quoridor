import Link from 'next/link';
import LanguageSwitcher from './LanguageSwitcher';
import ContactButton from './ContactButton';
import { BRAND } from '@/brand';
import { localePath, type Locale } from '@/i18n/locales';

/**
 * 遊戲頁頂端的平台列：左邊平台名（回平台首頁），右邊聯絡我們＋語言。
 *
 * 平台是 Netflix 式的深色＋紅，進到遊戲是那款遊戲自己的風格（Wall Go 是奶油底撞色）——
 * 風格不同是刻意的（頻道與節目），但進去之後要看得出還在同一個網站、也要回得去。
 * 這條細列就是那條線索。
 *
 * 只放在遊戲首頁，不放對局畫面（棋盤已經很滿）與規則頁（它有自己的固定頂部列）。
 * 高度 48px，跟原本右上角那排圓鈕（40px＋離邊）差不多，首頁「一屏塞得下」不受影響。
 */
export default function PlatformBar({ locale }: { locale: Locale }) {
  return (
    <div className="fixed inset-x-0 top-0 z-40 flex h-12 items-center justify-between bg-tile-ink pl-4 pr-1.5">
      {/* 20px 粗體算大字：紅在深墨上 3.9:1，大字的門檻是 3:1 */}
      <Link href={localePath(locale, '/')} className="text-xl font-black tracking-tight text-brand-red">
        {BRAND}
      </Link>
      <div className="flex gap-1">
        <ContactButton onDark />
        <LanguageSwitcher onDark />
      </div>
    </div>
  );
}
