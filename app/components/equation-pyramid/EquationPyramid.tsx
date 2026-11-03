'use client';
import { useMemo, useSyncExternalStore } from 'react';
import type { Locale } from '@/i18n/locales';
import { bigConfig, dailyConfig, localDate, showConfig } from '@/games/equation-pyramid/engine';
import EpMenu from './EpMenu';
import EpPlay from './EpPlay';
import { modeHash, parseMode, type Mode } from './mode';

/**
 * /equation-pyramid：選模式與對局都在這一頁，模式放在 hash（mode.ts）。做法同六角數字盤（components/hexagon/Hexagon.tsx）：
 * 從選單點進去時在點擊當下 pushState 一筆，按返回回選單；hash 用 useSyncExternalStore 讀，靜態 HTML 是選單。
 *
 * 種子：每日一題是當地的日期（同一天每個人同一盤）；節目規則、大金字塔每次一個新的亂數種子。
 */
const NAV = 'equation-pyramid:nav';

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
function enter(mode: Mode) { fromMenu = true; go(modeHash(mode)); }
function backToMenu() {
  if (fromMenu) { fromMenu = false; history.back(); } else go('', true);
}

const freshSeed = () => Math.random().toString(36).slice(2, 10);

export default function EquationPyramid({ locale }: { locale: Locale }) {
  const hash = useSyncExternalStore(subscribe, () => location.hash, () => '');
  const mode = useMemo(() => parseMode(hash), [hash]);

  if (mode.kind === 'daily') {
    return <EpPlay key="daily" makeConfig={() => dailyConfig(localDate(new Date()))} onMenu={backToMenu} />;
  }
  if (mode.kind === 'big') {
    return <EpPlay key="big" makeConfig={() => bigConfig(freshSeed())} onMenu={backToMenu} />;
  }
  if (mode.kind === 'show') {
    const { cpu } = mode;
    return <EpPlay key={`show-${cpu}`} makeConfig={() => showConfig(cpu, freshSeed())} onMenu={backToMenu} />;
  }
  return <EpMenu locale={locale} onEnter={enter} />;
}
