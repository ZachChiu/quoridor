'use client';
import { useState } from 'react';
import { useTransition } from '@/contexts/TransitionContext';
import { localePath, type Locale } from '@/i18n/locales';
import { PLATFORM_HOME } from '@/i18n/routes';
import AuctionSetup, { type Setup } from './AuctionSetup';
import AuctionPlay from './AuctionPlay';

/**
 * /time-auction（試做頁）：開局設定與對局在同一頁。
 *
 * 只有「你＋電腦」：同時秘密出價不適合兩個人擠一台（要同時按住、又要藏資訊），
 * 連線房要等共用的「密封值」原件做好（docs/games-deep-s2.md〈共用技術〉）。
 *
 * 靜態 HTML 就是設定畫面（有標題與說明可讀），按「開始」才進對局。
 * 每一局一個種子：電腦的個性與出價都由它衍生，「再來一局」換新種子、整個對局元件重掛。
 */
export default function TimeAuctionClient({ locale }: { locale: Locale }) {
  const { navigate } = useTransition();
  const [setup, setSetup] = useState<Setup>({ mode: 'quick', opponents: 5, difficulty: 'normal' });
  const [game, setGame] = useState<{ seed: number; setup: Setup } | null>(null);

  const start = (s: Setup) => {
    setGame({ seed: Math.floor(Math.random() * 0x100000000), setup: s });
    window.scrollTo(0, 0);
  };
  const home = () => navigate(localePath(locale, PLATFORM_HOME));

  if (!game) {
    return <AuctionSetup locale={locale} value={setup} onChange={(patch) => setSetup((s) => ({ ...s, ...patch }))} onStart={() => start(setup)} />;
  }
  return (
    <AuctionPlay
      key={game.seed}
      locale={locale}
      mode={game.setup.mode}
      opponents={game.setup.opponents}
      difficulty={game.setup.difficulty}
      seed={game.seed}
      onHome={home}
      onSettings={() => setGame(null)}
      onAgain={() => start(game.setup)}
    />
  );
}
