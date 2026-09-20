'use client';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { LOCALES, LOCALE_NAME, localeFromPath, localePath, stripLocale } from '@/i18n/locales';
import { useMessages } from '@/i18n/LocaleProvider';

/**
 * 語言切換器。
 *
 * 切換時停在**同一頁**而不是回首頁 —— 在規則頁想換語言的人要的是
 * 同一份規則的另一個語言，不是被丟回首頁重走一次。
 *
 * 用 <a> 而不是 router.push：換語言等於換文件語言，整頁重載反而正確，
 * 也讓 <html lang> 一定是對的。
 */
export default function LanguageSwitcher() {
  const pathname = usePathname() ?? '/';
  const current = localeFromPath(pathname);
  const bare = stripLocale(pathname);
  const t = useMessages();

  return (
    <nav aria-label={t.nav.language} className="flex flex-wrap items-center justify-center gap-1">
      {LOCALES.map((l) => (
        <Link
          key={l}
          href={localePath(l, bare)}
          hrefLang={l}
          aria-current={l === current ? 'true' : undefined}
          className={`rounded-lg px-2.5 py-1.5 text-xs font-bold transition ${
            l === current ? 'bg-tile-ink text-tile-cream' : 'text-ink-soft hover:bg-tile-ink/[0.06]'
          }`}
        >
          {LOCALE_NAME[l]}
        </Link>
      ))}
    </nav>
  );
}
