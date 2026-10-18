'use client';
import { LuCheck, LuChevronDown, LuGlobe } from 'react-icons/lu';
import PlatformDialog from './PlatformDialog';
import { useMessages } from '@/i18n/LocaleProvider';
import { useLanguageSwitch } from '@/hook/useLanguageSwitch';

/**
 * 平台頁的語言選單：外框按鈕寫著目前的語言（地球＋名稱＋箭頭），像 Netflix 頁首那顆。
 * Wall Go 用的是一顆只有地球的圓鈕；平台的按鈕要讓人一眼看到現在是什麼語言。
 *
 * 換語言的規則（同一頁換、整頁重載、bfcache 還原時關掉）跟 Wall Go 共用（useLanguageSwitch）。
 */
export default function PlatformLanguageMenu() {
  const t = useMessages();
  const { open, setOpen, items, currentName } = useLanguageSwitch();

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`${t.nav.language}: ${currentName}`}
        aria-haspopup="dialog"
        className="flex h-10 items-center gap-1.5 rounded-md border border-tile-cream/40 px-3 text-sm font-bold text-tile-cream transition hover:bg-tile-cream/[0.1]"
      >
        <LuGlobe aria-hidden="true" className="text-base" />
        {currentName}
        <LuChevronDown aria-hidden="true" />
      </button>

      <PlatformDialog isOpen={open} onClose={() => setOpen(false)} title={t.nav.language}>
        <ul className="flex flex-col gap-1">
          {items.map((it) => (
            <li key={it.locale}>
              {/* 真的 a、真的整頁重載：<html lang> 因此一定是對的 */}
              <a
                href={it.href}
                hrefLang={it.locale}
                aria-current={it.current ? 'true' : undefined}
                onClick={it.onClick}
                className={`flex items-center justify-between rounded-md px-4 py-3.5 text-base font-bold transition ${
                  it.current ? 'bg-tile-cream/[0.12]' : 'hover:bg-tile-cream/[0.08]'
                }`}
              >
                {it.name}
                {it.current && <LuCheck aria-hidden="true" className="text-brand-red" />}
              </a>
            </li>
          ))}
        </ul>
      </PlatformDialog>
    </>
  );
}
