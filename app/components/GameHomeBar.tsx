import Link from 'next/link';
import LanguageSwitcher from './LanguageSwitcher';
import ContactButton from './ContactButton';
import PlatformMark from './PlatformMark';
import { brandName } from '@/brand';
import { localePath, type Locale } from '@/i18n/locales';
import type { CornerTheme } from './cornerTheme';

/**
 * 遊戲首頁最上面那一列：左邊平台 logo（回平台首頁），右邊聯絡我們＋語言。
 *
 * 平台是 Netflix 式的深色＋紅，進到遊戲是那款遊戲自己的風格（Wall Go 是奶油底撞色）——
 * 風格不同是刻意的（頻道與節目），但進去之後要看得出還在同一個網站、也要回得去。
 * 左上那顆平台標誌（長角的骰子，10/25 起是單色版 PlatformMark 的 mono）就是那條線索。
 *
 * 跟內容排在同一個流裡、寬度由各款用 className 對齊自己的內容，不釘在畫面角落
 * （2026-11-03 Zach：「各遊戲首頁的上面回饋跟語系區域可以跟時間拍賣一樣嗎？不是浮著的，是正常排列下來的」）。
 * 先前是 PlatformCorner：fixed 在角落，各款要另外留一塊空白閃它，有外框的還要算外框寬度。
 * 試過一整條橫跨頂端的黑色平台列：太重（Zach：不要整條黑色），所以這一列沒有底色、只有圓鈕。
 *
 * 只放在遊戲首頁。對局畫面、規則頁這些「遊戲裡面」的頁面不放（Zach 指定）。
 * `theme`：那款遊戲的樣子 —— 兩顆圓鈕，加上打開的聯絡、語言彈窗（見 cornerTheme.ts）。
 */
export default function GameHomeBar({ locale, theme, className = '' }: { locale: Locale; theme?: CornerTheme; className?: string }) {
  return (
    <div className={`flex w-full shrink-0 items-center justify-between ${className}`}>
      <Link href={localePath(locale, '/')} aria-label={brandName(locale)} title={brandName(locale)} className="transition active:scale-95">
        <PlatformMark mono />
      </Link>
      <div className="flex gap-1">
        <ContactButton theme={theme} />
        <LanguageSwitcher theme={theme} />
      </div>
    </div>
  );
}
