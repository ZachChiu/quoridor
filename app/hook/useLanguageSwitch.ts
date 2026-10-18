'use client';
import { useEffect, useState } from 'react';
import { flushSync } from 'react-dom';
import { usePathname } from 'next/navigation';
import { LOCALES, LOCALE_NAME, localeFromPath, localePath, stripLocale, type Locale } from '@/i18n/locales';
import { track } from '@/utils/analytics';

/**
 * 換語言的行為（不含長相）。Wall Go 的 LanguageSwitcher 與平台的 PlatformLanguageMenu 共用。
 *
 * 規則（理由見 LanguageSwitcher 的註解）：
 * - 停在**同一頁**換語言，不是丟回首頁
 * - 底層是真的 <a href>、真的整頁重載：<html lang> 因此一定是對的，爬蟲也走得過去
 * - 已經在這個語言了：按下去只是關掉，不重新載入同一頁
 */
export function useLanguageSwitch() {
  const pathname = usePathname() ?? '/';
  const current = localeFromPath(pathname);
  const bare = stripLocale(pathname);
  const [open, setOpen] = useState(false);

  /*
    換語言是整頁跳轉，而瀏覽器會把離開的那一頁連同當下的畫面整個凍結起來
    （back-forward cache，Safari 特別積極）。按上一頁回來時不重新載入，
    直接解凍 —— 於是選單還開著，而且停在剛才選的語言上（Zach 回報：
    從規則頁按上一頁跑出日文首頁加語言選單）。

    兩道保險：點下去的當下就同步關掉（flushSync，確保凍結前已經畫成關的），
    以及從快取還原時（pageshow 帶 persisted）再關一次。
  */
  useEffect(() => {
    const onShow = (e: PageTransitionEvent) => { if (e.persisted) setOpen(false); };
    window.addEventListener('pageshow', onShow);
    return () => window.removeEventListener('pageshow', onShow);
  }, []);

  const items = LOCALES.map((l: Locale) => ({
    locale: l,
    name: LOCALE_NAME[l],
    href: localePath(l, bare),
    current: l === current,
    onClick: (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (l === current) {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
        e.preventDefault();
        setOpen(false);
        return;
      }
      // gtag 預設走 sendBeacon，整頁跳走也送得出去
      track('locale_switch', { from: current, to: l });
      flushSync(() => setOpen(false));
    },
  }));

  return { current, currentName: LOCALE_NAME[current], open, setOpen, items };
}
