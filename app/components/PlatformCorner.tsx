import Link from 'next/link';
import LanguageSwitcher from './LanguageSwitcher';
import ContactButton from './ContactButton';
import PlatformMark from './PlatformMark';
import { BRAND } from '@/brand';
import { localePath, type Locale } from '@/i18n/locales';
import type { CornerTheme } from './cornerTheme';

/**
 * 遊戲首頁的兩個角落：左上是平台 logo（回平台首頁），右上是聯絡我們＋語言。
 *
 * 平台是 Netflix 式的深色＋紅，進到遊戲是那款遊戲自己的風格（Wall Go 是奶油底撞色）——
 * 風格不同是刻意的（頻道與節目），但進去之後要看得出還在同一個網站、也要回得去。
 * 左上那顆平台標誌（長角的骰子）就是那條線索。
 *
 * 試過一整條橫跨頂端的黑色平台列：太重，把遊戲首頁的奶油底切掉一大塊（Zach：不要整條黑色）。
 * 所以縮成角落的一顆 logo，後來再縮成只有圖示的圓鈕（PlatformMark），跟右上角的圓鈕一樣大（40px、離邊 10px）。
 *
 * 只放在遊戲首頁。對局畫面、規則頁這些「遊戲裡面」的頁面不放（Zach 指定）。
 */
/**
 * `theme`：那款遊戲的樣子 —— 右上兩顆圓鈕，加上打開的聯絡、語言彈窗（見 cornerTheme.ts）。
 * `buttonClassName`：只換圓鈕（舊的寫法，各遊戲分支換成 theme 之前先留著）。
 * `offset`：離邊距離（CSS 長度），整頁有外框的遊戲用來避開外框，例如 `calc(var(--gmk-frame) + 6px)`。
 */
export default function PlatformCorner({ locale, theme, buttonClassName, offset }: { locale: Locale; theme?: CornerTheme; buttonClassName?: string; offset?: string }) {
  return (
    <>
      <Link
        href={localePath(locale, '/')}
        aria-label={BRAND}
        title={BRAND}
        className="fixed left-2.5 top-2.5 z-40 transition hover:brightness-110 active:scale-95"
        style={offset ? { left: offset, top: offset } : undefined}
      >
        <PlatformMark />
      </Link>
      <div className="fixed right-2.5 top-2.5 z-40 flex gap-1" style={offset ? { right: offset, top: offset } : undefined}>
        <ContactButton theme={theme} buttonClassName={buttonClassName} />
        <LanguageSwitcher theme={theme} buttonClassName={buttonClassName} />
      </div>
    </>
  );
}
