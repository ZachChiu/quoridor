'use client';
import { useMemo, useSyncExternalStore } from 'react';
import type { Locale } from '@/i18n/locales';
import KnightsTourMenu from './KnightsTourMenu';
import { modeHash, parseMode } from './mode';
import PracticeGame from './PracticeGame';
import ShowGame from './ShowGame';

/**
 * /knights-tour：選模式與對局都在這一頁，模式放在 hash —— `#show`、`#practice-8`，沒有就是選單。
 *
 * 放 hash 是為了返回鍵：從選單進入對局時在點擊當下 pushState 一筆（WebKit 要在使用者手勢裡新增紀錄，
 * 否則返回時會被跳過，見 CLAUDE.md〈站內換頁〉），按返回就回到選單，而不是離開整個遊戲。
 * 重新整理會照 hash 開一局新的（這版沒有接回進行中的局面）。
 *
 * 用 useSyncExternalStore 讀 hash（跟 hook/useCoarsePointer 同一個做法）：靜態 HTML 是選單，
 * 瀏覽器接手時同一輪換成 hash 指的模式，不必用 effect 再 setState。
 */
const NAV = 'knights-tour:nav';

function subscribe(onChange: () => void) {
  window.addEventListener('hashchange', onChange);
  window.addEventListener('popstate', onChange);
  window.addEventListener(NAV, onChange);
  return () => {
    window.removeEventListener('hashchange', onChange);
    window.removeEventListener('popstate', onChange);
    window.removeEventListener(NAV, onChange);
  };
}

/** pushState／replaceState 不會觸發 hashchange，自己通知一聲 */
function go(hash: string, replace = false) {
  const url = location.pathname + location.search + hash;
  if (replace) history.replaceState(null, '', url); else history.pushState(null, '', url);
  window.dispatchEvent(new Event(NAV));
}

/** 這一次是不是從選單點進來的（是的話「回選單」等於上一頁，歷史紀錄才不會多一筆選單） */
let fromMenu = false;
function enter(hash: string) { fromMenu = true; go(hash); }
function backToMenu() {
  if (fromMenu) { fromMenu = false; history.back(); } else go('', true);
}

export default function KnightsTour({ locale }: { locale: Locale }) {
  const hash = useSyncExternalStore(subscribe, () => location.hash, () => '');
  const mode = useMemo(() => parseMode(hash), [hash]);

  const practice = (n: number) => modeHash({ kind: 'practice', n });

  if (mode.kind === 'show') {
    return <ShowGame onMenu={backToMenu} onPractice={(n) => go(practice(n), true)} />;
  }
  if (mode.kind === 'practice') {
    return <PracticeGame key={mode.n} n={mode.n} onMenu={backToMenu} onSize={(n) => go(practice(n), true)} />;
  }
  return <KnightsTourMenu locale={locale} onShow={() => enter(modeHash({ kind: 'show' }))} onPractice={(n) => enter(practice(n))} />;
}
