'use client';
import { useRef, useState } from 'react';
import { useIsoLayoutEffect } from '@/hook/useIsoLayoutEffect';
import type { Locale } from '@/i18n/locales';
import ChallengePlay from './ChallengePlay';
import QtMenu from './QtMenu';
import ShowPlay from './ShowPlay';
import { HIDE_MENU_STYLE_ID, modeHash, readModeHash, type QtMode } from './modeHash';

/**
 * /question-and-truth：選模式與對局在同一頁，模式放在網址 hash（見 modeHash）。做法照大話骰的 LiarsDice：
 * 選了模式就在點擊當下 pushState 一筆帶 hash 的紀錄，返回鍵回到選單；回選單也是新增一筆、不是 history.back()。
 * 試做期間沒有 GA 事件（CLAUDE.md：第二批試做不送）。
 */
export default function QuestionAndTruth({ locale }: { locale: Locale }) {
  const [mode, setMode] = useState<QtMode | null | undefined>(undefined);
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

  const start = (m: QtMode) => {
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
  const again = () => setRound((r) => r + 1);

  if (mode?.kind === 'ai' || mode?.kind === 'local') return <ShowPlay key={`${modeHash(mode)}-${round}`} mode={mode} onMenu={toMenu} onAgain={again} />;
  if (mode?.kind === 'daily' || mode?.kind === 'six') return <ChallengePlay key={`${modeHash(mode)}-${round}`} kind={mode.kind} onMenu={toMenu} onAgain={again} />;
  return <QtMenu locale={locale} onStart={start} />;
}
