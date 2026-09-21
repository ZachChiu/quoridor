'use client';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { LuGlobe } from 'react-icons/lu';
import { LOCALES, LOCALE_NAME, localeFromPath, localePath, stripLocale } from '@/i18n/locales';
import { useMessages } from '@/i18n/LocaleProvider';

/**
 * 語言切換。
 *
 * 原本四個語言名平鋪在首頁底下，佔掉一整行而且四個字串長度不一，
 * 版面會跟著語系抖動。改成一顆地球鈕，按了才展開。
 *
 * 展開的清單仍然是真的 <a> —— 爬蟲要走得過去，那是四個語系互相
 * 連通的唯一路徑（hreflang 是給機器的提示，不是連結）。
 *
 * 切換時停在**同一頁**：在規則頁想換語言的人要的是同一份規則的另一個
 * 語言，不是被丟回首頁重走一次。
 */
export default function LanguageSwitcher() {
  const pathname = usePathname() ?? '/';
  const current = localeFromPath(pathname);
  const bare = stripLocale(pathname);
  const t = useMessages();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // 點外面或按 Escape 收起來。少了這兩個，展開的選單在手機上會黏住。
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={t.nav.language}
        aria-expanded={open}
        aria-haspopup="menu"
        className="grid size-11 place-items-center rounded-full bg-tile-ink/[0.06] text-xl text-ink-soft transition hover:bg-tile-ink/[0.12] active:scale-95"
      >
        <LuGlobe aria-hidden="true" />
      </button>

      {/*
        清單永遠留在 DOM 裡，只切換 inert 與可見度 ——
        爬蟲讀得到那四條連結，而收起時焦點不會跑進去。
        這與站上其他 Modal 的作法一致。
      */}
      <div
        {...(open ? {} : { inert: true })}
        role="menu"
        aria-label={t.nav.language}
        className={`absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 overflow-hidden rounded-xl bg-primary-50 shadow-[0_4px_16px_rgba(20,16,16,0.12)] transition ${
          open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
      >
        {LOCALES.map((l) => (
          <Link
            key={l}
            href={localePath(l, bare)}
            hrefLang={l}
            role="menuitem"
            aria-current={l === current ? 'true' : undefined}
            onClick={() => setOpen(false)}
            className={`block whitespace-nowrap px-4 py-2.5 text-sm font-bold transition ${
              l === current ? 'bg-tile-ink text-tile-cream' : 'text-tile-ink hover:bg-tile-ink/[0.06]'
            }`}
          >
            {LOCALE_NAME[l]}
          </Link>
        ))}
      </div>
    </div>
  );
}
