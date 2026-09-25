'use client';
import { useState } from 'react';
import { GiBrain } from 'react-icons/gi';
import PlayClient from '@/components/PlayClient';
import { useGame } from '@/contexts/GameContext';
import { useMessages } from '@/i18n/LocaleProvider';
import { track } from '@/utils/analytics';
import { gameHash, readGameHash } from '@/utils/gameMode';
import { useIsoLayoutEffect } from '@/hook/useIsoLayoutEffect';
import DifficultyButtons from '@/components/DifficultyButtons';

/**
 * 單人對戰。
 *
 * 難度原本存在 GameContext，由首頁的 Modal 設定後才導過來 —— 那表示
 * 直接開這個網址（書籤、分享連結、搜尋結果點進來）會沒有難度，
 * 靜靜地退化成本機雙人。一條自己站不住的路由不值得存在，
 * 所以這裡自備選單：沒選過就先問，選了就開打。
 *
 * 難度同時也寫在網址的 hash 裡（`/solo#hard`）—— 重整之後不必再問一次，
 * 而且那個連結分享出去是「直接開困難」，不是「開一個選單」。
 */

/*
  重整 /solo#easy 時不要先閃出難度選單（Zach 回報）。

  layout effect 擋不住這一下：靜態匯出的 HTML 裡本來就有選單，瀏覽器
  一收到就畫出來，那時 JS 都還沒下載，更別說 hydrate。能在第一次繪製
  之前讀到 hash 的只有「跟著 HTML 一起到、解析到就同步執行」的內嵌 script。

  它往 <head> 塞一段把選單設成 visibility:hidden 的樣式，而不是直接改
  選單的 style —— 後者會讓 hydration 對不上屬性。React 19 會略過
  head 裡不是它放的節點，所以這段樣式不會造成 mismatch。
  選單仍然佔位（hidden 不是 none），hydrate 之後直接換成棋盤。
*/
const HIDE_STYLE_ID = 'solo-picker-hide';
const HIDE_PICKER = `if(/(^#|-)(easy|normal|hard)$/.test(location.hash)&&!document.getElementById('${HIDE_STYLE_ID}')){var s=document.createElement('style');s.id='${HIDE_STYLE_ID}';s.textContent='.solo-picker{visibility:hidden}';document.head.appendChild(s)}`;
export default function SoloClient() {
  const { gameState, setGameState } = useGame();
  const t = useMessages();
  const [picked, setPicked] = useState(!!gameState.aiDifficulty);

  /*
    重整後從網址還原難度。用 layout effect 而不是 useEffect：
    後者在 paint 之後才跑，會先閃一次難度選單再跳進對局。
  */
  useIsoLayoutEffect(() => {
    // 下面那段內嵌 script 加的樣式到這裡就完成任務了 —— 留著的話，之後在站內
    // 換頁回到沒有 hash 的 /solo，選單會一直是隱形的。
    document.getElementById(HIDE_STYLE_ID)?.remove();
    if (gameState.aiDifficulty) return;
    const d = readGameHash().aiDifficulty;
    if (!d) return;
    setGameState((s) => ({ ...s, playersNum: 2, aiDifficulty: d }));
    setPicked(true);
    // 只在掛載時還原一次
  }, []);

  if (picked && gameState.aiDifficulty) return <PlayClient aiDifficulty={gameState.aiDifficulty} />;

  return (
    <div className="solo-picker flex w-full max-w-[380px] flex-col items-center gap-6 px-5">
      <script dangerouslySetInnerHTML={{ __html: HIDE_PICKER }} />
      <div className="flex flex-col items-center gap-3 text-center">
        <GiBrain className="text-6xl text-tile-orange" aria-hidden="true" />
        <h2 className="text-3xl font-black tracking-tight">{t.solo.pickLevel}</h2>
      </div>
      <DifficultyButtons
        onPick={(key) => {
          setGameState({ ...gameState, playersNum: 2, aiDifficulty: key });
          setPicked(true);
          // 在這裡選的也要進網址，之後重整才回得來
          history.replaceState(null, '', location.pathname + gameHash({ aiDifficulty: key }));
          track('mode_select', { mode: 'solo', players: 2, difficulty: key, source: 'solo_page' });
        }}
      />
    </div>
  );
}
