'use client';
import { useState } from 'react';
import type { Locale } from '@/i18n/locales';
import AuctionSetup, { type Setup } from './AuctionSetup';
import AuctionPlay from './AuctionPlay';

/**
 * /time-auction（試做頁）：開局設定與對局在同一頁。
 *
 * 這一頁是「你＋電腦」：同時秘密出價不適合兩個人擠一台（要同時按住、又要藏資訊）。
 * 跟朋友玩是連線房（/time-auction/online，AuctionOnline.tsx），從設定頁的「邀請朋友」開。
 *
 * 靜態 HTML 就是設定畫面（有標題與說明可讀），按「開始」才進對局。
 * 每一局一個種子：電腦的個性與出價都由它衍生，「再來一局」換新種子、整個對局元件重掛。
 * 對局中左上的房子回到設定畫面（這款的首頁），直接換、不播轉場（Zach 10/24：跟虎羊棋一樣，裡面換畫面不播轉場）；
 * 只有設定畫面左上的平台 logo 回平台首頁。
 */
export default function TimeAuctionClient({ locale }: { locale: Locale }) {
  const [setup, setSetup] = useState<Setup>({ mode: 'quick', opponents: 5, difficulty: 'normal' });
  const [game, setGame] = useState<{ seed: number; setup: Setup } | null>(null);

  const start = (s: Setup) => {
    setGame({ seed: Math.floor(Math.random() * 0x100000000), setup: s });
    window.scrollTo(0, 0);
  };

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
      onHome={() => { setGame(null); window.scrollTo(0, 0); }}
      onAgain={() => start(game.setup)}
    />
  );
}
