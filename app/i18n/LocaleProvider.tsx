'use client';
import React, { createContext, useContext } from 'react';
import type { Locale } from './locales';
import { DEFAULT_LOCALE } from './locales';
import { getMessages, type Messages } from './index';

/**
 * 讓 client component 拿得到字典。
 *
 * server component 直接呼叫 getMessages(locale) 就好；這個 provider 是給
 * 深層的互動元件用的 —— 一路把 messages 當 prop 傳下去會讓每個中間層
 * 都被迫知道 i18n 的存在，而它們其實只是版面。
 *
 * 值由 server 端決定後傳進來，所以不會有「client 先畫錯語言再修正」的閃動。
 */
type Ctx = { locale: Locale; t: Messages };
const LocaleContext = createContext<Ctx | null>(null);

export function LocaleProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return (
    <LocaleContext.Provider value={{ locale, t: getMessages(locale) }}>
      {children}
    </LocaleContext.Provider>
  );
}

function useCtx(): Ctx {
  const ctx = useContext(LocaleContext);
  // 沒有 provider 時退回預設語系而不是拋錯。i18n 不該是「忘了包就整頁白掉」
  // 的那種相依 —— 退回中文至少畫面還在，而漏包這件事在 build 的頁面上
  // 一眼就看得出來。
  return ctx ?? { locale: DEFAULT_LOCALE, t: getMessages(DEFAULT_LOCALE) };
}

export const useLocale = (): Locale => useCtx().locale;
export const useMessages = (): Messages => useCtx().t;
