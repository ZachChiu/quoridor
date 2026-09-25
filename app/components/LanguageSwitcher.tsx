'use client';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { LuGlobe, LuCheck } from 'react-icons/lu';
import Modal from './Modal';
import { LOCALES, LOCALE_NAME, localeFromPath, localePath, stripLocale } from '@/i18n/locales';
import { useMessages } from '@/i18n/LocaleProvider';
import { track } from '@/utils/analytics';

/**
 * 語言切換。
 *
 * 一顆地球鈕開一個 Modal，不是下拉選單。
 *
 * 下拉的兩個問題：它要自己處理往上還是往下開（置頂列往下、頁尾往上，
 * 兩邊各一套定位），而且清單為了讓爬蟲讀得到必須一直留在 DOM，
 * 於是它還會把版面撐寬 —— 先前就因此在規則頁多出一條水平捲軸。
 *
 * 改用站上既有的 Modal：位置由 Modal 負責（永遠置中），
 * inert、焦點鎖、Escape、背景捲動鎖全部現成，不必再寫一次。
 *
 * 切換時停在**同一頁**：在規則頁想換語言的人要的是同一份規則的
 * 另一個語言，不是被丟回首頁重走一次。
 *
 * 底層仍然是真的 `<a href>`（TransitionLink 包的就是 a）：爬蟲走得過去，
 * cmd／中鍵開新分頁照常。zh-TW 與其他語系分屬兩套 root layout，
 * Next 會自己退回整頁載入 —— 那正是我們要的，<html lang> 因此一定是對的。
 *
 * ── 這裡刻意沒有換場動畫 ─────────────────────────────────────────
 * 站上其他「會換頁」的按鈕都有掃場，只有這裡是硬切。
 *
 * zh-TW 與其他語系分屬兩個 root layout（為了 `<html lang>`），Next 只能
 * 整份文件重載 —— 覆蓋層跟著舊文件消失，離場那半段得靠 sessionStorage
 * 交棒給新文件，再用一段 pre-paint 的 inline script 先鋪一塊同色色塊頂著。
 * 那一套在產品建置上是連續的，但在 dev server 上會漏出一幀沒遮住的新頁面，
 * 而且 inline script 動到 `<html>` 的屬性會讓 React 報 hydration mismatch。
 *
 * 一個只在正式站對、開發時看起來像壞掉的動畫不值得留著。換語言一次
 * 造訪頂多做一次，整頁重載本來就正常。
 */
export default function LanguageSwitcher({ onDark = false }: { onDark?: boolean } = {}) {
  const pathname = usePathname() ?? '/';
  const current = localeFromPath(pathname);
  const bare = stripLocale(pathname);
  const t = useMessages();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t.nav.language}
        aria-haspopup="dialog"
        className={`relative grid size-10 place-items-center rounded-full after:absolute after:-inset-0.5 after:content-[''] text-xl transition active:scale-95 ${
          onDark
            ? 'bg-tile-cream/[0.16] text-tile-cream hover:bg-tile-cream/[0.26]'
            : 'bg-tile-ink/[0.06] text-ink-soft hover:bg-tile-ink/[0.12]'
        }`}
      >
        <LuGlobe aria-hidden="true" />
      </button>

      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title={t.nav.language}
        icon={LuGlobe}
        band={{ className: 'bg-tile-blue', fg: 'text-tile-cream' }}
      >
        <ul className="flex flex-col gap-2">
          {LOCALES.map((l) => {
            const row = 'flex items-center justify-between rounded-xl px-4 py-3.5 text-base font-black transition';
            // 已經在這個語言了：連結留著給爬蟲，但按下去只是關掉 ——
            // 讓它重新載入同一頁，使用者會以為自己按錯了。
            if (l === current) {
              return (
                <li key={l}>
                  <a
                    href={localePath(l, bare)}
                    hrefLang={l}
                    aria-current="true"
                    onClick={(e) => {
                      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
                      e.preventDefault();
                      setOpen(false);
                    }}
                    className={`${row} bg-tile-ink text-tile-cream`}
                  >
                    {LOCALE_NAME[l]}
                    <LuCheck aria-hidden="true" />
                  </a>
                </li>
              );
            }
            return (
              <li key={l}>
                {/* 真的 a、真的整頁重載：<html lang> 因此一定是對的 */}
                <a
                  href={localePath(l, bare)}
                  hrefLang={l}
                  // gtag 預設走 sendBeacon，整頁跳走也送得出去
                  onClick={() => track('locale_switch', { from: current, to: l })}
                  className={`${row} bg-primary-50 text-tile-ink hover:brightness-95`}
                >
                  {LOCALE_NAME[l]}
                </a>
              </li>
            );
          })}
        </ul>
      </Modal>
    </>
  );
}
