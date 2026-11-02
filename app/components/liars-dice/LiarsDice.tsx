'use client';
import { useRef, useState } from 'react';
import { useIsoLayoutEffect } from '@/hook/useIsoLayoutEffect';
import type { Locale } from '@/i18n/locales';
import DiceMenu from './DiceMenu';
import DicePlay from './DicePlay';
import { HIDE_MENU_STYLE_ID, modeHash, readModeHash, type DiceMode } from './modeHash';

/**
 * /liars-dice：選模式與對局在同一頁，模式放在網址 hash（見 modeHash）。做法照盲五子棋的 BlindGomoku：
 * 選了模式就在點擊當下 pushState 一筆帶 hash 的紀錄，返回鍵回到選單；回選單也是新增一筆、不是 history.back()。
 * 試做期間沒有 GA 事件（CLAUDE.md：第二批試做不送）。
 */
export default function LiarsDice({ locale }: { locale: Locale }) {
  const [mode, setMode] = useState<DiceMode | null | undefined>(undefined);
  const [round, setRound] = useState(0);
  // 返回鍵退掉的若是同一個網址（離開前確認的守門那筆），不是換模式、不能重開一局
  const shown = useRef<string | null>(null);

  useIsoLayoutEffect(() => {
    document.getElementById(HIDE_MENU_STYLE_ID)?.remove();
    const read = () => {
      if (location.hash === shown.current) return;
      shown.current = location.hash;
      setMode(readModeHash(location.hash));
      setRound((r) => r + 1);
    };
    read();
    window.addEventListener('popstate', read);
    window.addEventListener('hashchange', read);
    return () => {
      window.removeEventListener('popstate', read);
      window.removeEventListener('hashchange', read);
    };
  }, []);

  const start = (m: DiceMode) => {
    history.pushState(null, '', modeHash(m));
    shown.current = location.hash;
    setMode(m);
    setRound((r) => r + 1);
  };
  const toMenu = () => {
    history.pushState(null, '', location.pathname + location.search);
    shown.current = location.hash;
    setMode(null);
  };

  if (mode) return <DicePlay key={`${modeHash(mode)}-${round}`} mode={mode} onMenu={toMenu} onAgain={() => setRound((r) => r + 1)} />;
  return <DiceMenu locale={locale} onStart={start} />;
}
