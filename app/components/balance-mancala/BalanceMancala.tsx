'use client';
import { useState } from 'react';
import type { Locale } from '@/i18n/locales';
import { DEFAULT_SETUP, type MatchSetup } from './match';
import MancalaSetup from './MancalaSetup';
import MancalaPlay from './MancalaPlay';

/**
 * /balance-mancala：開局設定與對局在同一頁（試做期，routes.ts 的約定）。
 * 「再來一局」換 key 重新掛載對局（同樣的設定），「換設定」回到設定畫面並保留上次的選擇。
 */
export default function BalanceMancala({ locale }: { locale: Locale }) {
  const [match, setMatch] = useState<MatchSetup | null>(null);
  const [round, setRound] = useState(0);
  const [lastSetup, setLastSetup] = useState<MatchSetup>(DEFAULT_SETUP);

  if (!match) {
    return (
      <MancalaSetup locale={locale} initial={lastSetup} onStart={(m) => {
        setLastSetup(m);
        setMatch(m);
        setRound((r) => r + 1);
        window.scrollTo(0, 0);
      }} />
    );
  }
  return (
    <MancalaPlay key={round} locale={locale} setup={match}
      onSettings={() => { setMatch(null); window.scrollTo(0, 0); }}
      onAgain={() => setRound((r) => r + 1)} />
  );
}
