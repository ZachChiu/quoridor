'use client';
import { useState } from 'react';
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
const HIDE_SETUP = `try{if(sessionStorage.getItem('${SESSION_KEY}')&&!document.getElementById('${HIDE_STYLE_ID}')){var s=document.createElement('style');s.id='${HIDE_STYLE_ID}';s.textContent='.nmm-setup{visibility:hidden}';document.head.appendChild(s)}}catch(e){}`;

/**
 * /nine-mens-morris：選模式與對局在同一頁（第二批試做的寫法，規則頁與連線房之後再補）。
 * 選好模式就換成對局畫面；這一局存在 sessionStorage，重新整理會接回（見 session.ts）。
 */
export default function MorrisGame({ locale }: { locale: Locale }) {
  // booting：伺服器輸出與 hydration 那一輪。內嵌 script 只在這一輪畫 ——
  // 之後（換模式回到選單）再畫會讓 React 警告「client 端畫出的 script 不會執行」
  const [{ session, booting }, setState] = useState<{ session: Session | null; booting: boolean }>({ session: null, booting: true });

  useIsoLayoutEffect(() => {
    document.getElementById(HIDE_STYLE_ID)?.remove();
    const resume = () => setState({ session: loadSession(), booting: false });
    resume();
  }, []);

  if (session) {
    return <MorrisPlay locale={locale} session={session} onMenu={() => { clearSession(); setState({ session: null, booting: false }); }} />;
  }
  return (
    <>
      {booting && <script dangerouslySetInnerHTML={{ __html: HIDE_SETUP }} />}
      <MorrisSetup locale={locale} onStart={(mode, showRules) => setState({ session: { mode, showRules, moves: '' }, booting: false })} />
    </>
  );
}
