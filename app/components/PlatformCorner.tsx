import Link from 'next/link';
import LanguageSwitcher from './LanguageSwitcher';
import ContactButton from './ContactButton';
import { BRAND } from '@/brand';
import { localePath, type Locale } from '@/i18n/locales';

/**
 * 遊戲首頁的兩個角落：左上是平台 logo（回平台首頁），右上是聯絡我們＋語言。
 *
 * 平台是 Netflix 式的深色＋紅，進到遊戲是那款遊戲自己的風格（Wall Go 是奶油底撞色）——
 * 風格不同是刻意的（頻道與節目），但進去之後要看得出還在同一個網站、也要回得去。
 * 左上那顆深色 logo 就是那條線索。
 *
 * 試過一整條橫跨頂端的黑色平台列：太重，把遊戲首頁的奶油底切掉一大塊（Zach：不要整條黑色）。
 * 所以縮成角落的一顆 logo，高度跟右上角的圓鈕一樣（40px、離邊 10px）。
 *
 * 只放在遊戲首頁。對局畫面、規則頁這些「遊戲裡面」的頁面不放（Zach 指定）。
 */
export default function PlatformCorner({ locale }: { locale: Locale }) {
  return (
    <>
      {/* 紅在深墨上 3.9:1。logo（字標）不受 WCAG 對比門檻約束，但 20px 粗體本來就過大字的 3:1 */}
      <Link
        href={localePath(locale, '/')}
        // 矮的直式畫面（≤700 高）上標題會貼到頂：logo 縮小一級，讓開置中的標題
        className="fixed left-2.5 top-2.5 z-40 flex h-10 items-center rounded-full bg-tile-ink px-4 text-xl font-black tracking-tight text-brand-red transition active:scale-95 [@media(orientation:portrait)_and_(max-height:700px)]:px-2.5 [@media(orientation:portrait)_and_(max-height:700px)]:text-sm"
      >
        {BRAND}
      </Link>
      <div className="fixed right-2.5 top-2.5 z-40 flex gap-1">
        <ContactButton />
        <LanguageSwitcher />
      </div>
    </>
  );
}
