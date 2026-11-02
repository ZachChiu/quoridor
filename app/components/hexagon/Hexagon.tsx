'use client';
import { useMemo, useSyncExternalStore } from 'react';
import type { Locale } from '@/i18n/locales';
import { dailyConfig, localDate, practiceConfig, showConfig } from '@/games/hexagon/engine';
import HexMenu from './HexMenu';
import HexPlay from './HexPlay';
import { modeHash, parseMode } from './mode';

/**
 * /hexagon：選模式與對局都在這一頁，模式放在 hash（mode.ts）。做法同騎士巡遊（components/knights-tour/KnightsTour.tsx）：
 * 從選單點進去時在點擊當下 pushState 一筆，按返回回選單；hash 用 useSyncExternalStore 讀，靜態 HTML 是選單。
 *
 * 種子：每日一題是當地的日期（同一天每個人同一題）；節目規則、練習每次一個新的亂數種子。
 */
const NAV = 'hexagon:nav';

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

function go(hash: string, replace = false) {
  const url = location.pathname + location.search + hash;
  if (replace) history.replaceState(null, '', url); else history.pushState(null, '', url);
  window.dispatchEvent(new Event(NAV));
}

let fromMenu = false;
function enter(hash: string) { fromMenu = true; go(hash); }
function backToMenu() {
  if (fromMenu) { fromMenu = false; history.back(); } else go('', true);
}

const freshSeed = () => Math.random().toString(36).slice(2, 10);

export default function Hexagon({ locale }: { locale: Locale }) {
  const hash = useSyncExternalStore(subscribe, () => location.hash, () => '');
  const mode = useMemo(() => parseMode(hash), [hash]);

  if (mode.kind === 'daily') {
    return <HexPlay key="daily" makeConfig={() => dailyConfig(localDate(new Date()))} onMenu={backToMenu} />;
  }
  if (mode.kind === 'show') {
    return <HexPlay key="show" makeConfig={() => showConfig(freshSeed())} onMenu={backToMenu} />;
  }
  if (mode.kind === 'practice') {
    const { level } = mode;
    return <HexPlay key={`practice-${level}`} makeConfig={() => practiceConfig(level, freshSeed())} onMenu={backToMenu} />;
  }
  return <HexMenu locale={locale}
    onDaily={() => enter(modeHash({ kind: 'daily' }))}
    onShow={() => enter(modeHash({ kind: 'show' }))}
    onPractice={(level) => enter(modeHash({ kind: 'practice', level }))} />;
}
