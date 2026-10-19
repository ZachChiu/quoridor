'use client';
import { useState } from 'react';
import { useIsoLayoutEffect } from '@/hook/useIsoLayoutEffect';
import type { Locale } from '@/i18n/locales';
import GomokuMenu from './GomokuMenu';
import GomokuPlay from './GomokuPlay';
import { HIDE_MENU_STYLE_ID, modeHash, readModeHash, type GomokuMode } from './modeHash';

/**
 * /blind-gomoku：選模式與對局在同一頁，模式放在網址 hash（見 modeHash）。
 *
 * 選了模式就 pushState 一筆帶 hash 的紀錄 —— 在點擊當下做（WebKit 會跳過沒有使用者手勢時新增的紀錄，
 * 見 CLAUDE.md〈站內換頁〉），所以瀏覽器的返回鍵會回到選單。換模式（房子鈕）也是新增一筆，不是 history.back()：
 * 直接打開帶 hash 的網址進來的人，back 會離開網站。
 */
export default function BlindGomoku({ locale }: { locale: Locale }) {
  // undefined：還沒讀 hash（靜態 HTML 與 hydrate 的那一刻都畫選單）
  const [mode, setMode] = useState<GomokuMode | null | undefined>(undefined);
  // 換模式或重整都要開新的一局：key 帶一個每次選模式都會變的序號
  const [round, setRound] = useState(0);

  useIsoLayoutEffect(() => {
    // 選單上那段內嵌 script 加的「先藏起選單」到這裡就完成任務了
    document.getElementById(HIDE_MENU_STYLE_ID)?.remove();
    const read = () => { setMode(readModeHash(location.hash)); setRound((r) => r + 1); };
    read();
    window.addEventListener('popstate', read);
    window.addEventListener('hashchange', read);
    return () => {
      window.removeEventListener('popstate', read);
      window.removeEventListener('hashchange', read);
    };
  }, []);

  const start = (m: GomokuMode) => {
    history.pushState(null, '', modeHash(m));
    setMode(m);
    setRound((r) => r + 1);
  };
  const toMenu = () => {
    history.pushState(null, '', location.pathname + location.search);
    setMode(null);
  };

  if (mode) return <GomokuPlay key={`${modeHash(mode)}-${round}`} mode={mode} onMenu={toMenu} />;
  return <GomokuMenu locale={locale} onStart={start} />;
}
