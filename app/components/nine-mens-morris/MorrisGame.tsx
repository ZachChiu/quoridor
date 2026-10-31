'use client';
import { useState, useSyncExternalStore } from 'react';
import { useIsoLayoutEffect } from '@/hook/useIsoLayoutEffect';
import type { Locale } from '@/i18n/locales';
import MorrisPlay from './MorrisPlay';
import MorrisSetup from './MorrisSetup';
import { SESSION_KEY, clearSession, loadSession, type Session } from './session';

/*
  重新整理時，下到一半的棋要直接接回，不要先閃一下選模式的畫面（Wall Go 的 /solo 被回報過同一件事）。

  layout effect 擋不住這一下：靜態 HTML 裡本來就有選單，瀏覽器一收到就畫，那時 JS 還沒下載。
  能在第一次繪製之前看到 sessionStorage 的只有跟著 HTML 一起到的內嵌 script：
  有存著的局就往 <head> 塞一段把選單設成隱形的樣式（不改選單本身的屬性，hydration 才對得上），
  hydrate 之後由 layout effect 拿掉。
*/
const HIDE_STYLE_ID = 'nmm-setup-hide';
/** 伺服器輸出與 hydration 那一輪是 true，之後（站內換頁進來、換模式回到選單）都是 false */
const noop = () => () => {};
const useHydrating = () => useSyncExternalStore(noop, () => false, () => true);
const HIDE_SETUP = `try{if(sessionStorage.getItem('${SESSION_KEY}')&&!document.getElementById('${HIDE_STYLE_ID}')){var s=document.createElement('style');s.id='${HIDE_STYLE_ID}';s.textContent='.nmm-setup{visibility:hidden}';document.head.appendChild(s)}}catch(e){}`;

/**
 * /nine-mens-morris：選模式與對局（本機、跟電腦下）在同一頁；連線對戰另外一頁（/nine-mens-morris/online，MorrisOnline）。
 * 選好模式就換成對局畫面；這一局存在 sessionStorage，重新整理會接回（見 session.ts）。
 * 對局中按左上的房子或「換模式」就是換回選單 —— 同一頁裡換畫面，不播轉場。
 *
 * 返回鍵（11/1 Zach：選了黑、按上一頁直接回到平台）：進對局的那一下在歷史紀錄放一筆 `#play`（點擊當下放，
 * WebKit 才不會跳過，見 CLAUDE.md〈站內換頁〉），按返回退掉它就回到選單；房子鈕也是退掉它。
 * 對局裡的守門（useLeaveGuard）疊在 `#play` 上面，下到一半按返回照舊先問。
 */
const PLAY_HASH = '#play';
export default function MorrisGame({ locale }: { locale: Locale }) {
  // booting：還沒讀 sessionStorage 的那一輪。內嵌 script 只在伺服器輸出與 hydration 時畫 ——
  // 之後（換模式回到選單、從連線頁或平台站內換頁進來）再畫會讓 React 警告「client 端畫出的 script 不會執行」
  const [{ session, booting }, setState] = useState<{ session: Session | null; booting: boolean }>({ session: null, booting: true });
  const hydrating = useHydrating();

  useIsoLayoutEffect(() => {
    document.getElementById(HIDE_STYLE_ID)?.remove();
    const saved = loadSession();
    // 網址還掛著 #play 但這一局已經不在了（下完、清掉）：拿掉，不然按返回會停在同一個選單上
    if (!saved && location.hash === PLAY_HASH) history.replaceState(history.state, '', location.pathname + location.search);
    setState({ session: saved, booting: false });
    // 退掉 #play 那一筆（返回鍵、房子鈕）＝回選單
    const onPop = () => {
      if (location.hash === PLAY_HASH) return;
      clearSession();
      setState({ session: null, booting: false });
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const toMenu = () => {
    if (location.hash === PLAY_HASH) { history.back(); return; }
    clearSession();
    setState({ session: null, booting: false });
  };

  if (session) {
    return <MorrisPlay locale={locale} mode={session.mode} showRules={session.showRules} moves={session.moves} onMenu={toMenu} />;
  }
  return (
    <>
      {booting && hydrating && <script dangerouslySetInnerHTML={{ __html: HIDE_SETUP }} />}
      <MorrisSetup locale={locale} onStart={(mode, showRules) => {
        history.pushState(history.state, '', location.pathname + location.search + PLAY_HASH);
        setState({ session: { mode, showRules, moves: '' }, booting: false });
      }} />
    </>
  );
}
