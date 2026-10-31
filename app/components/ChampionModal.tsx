'use client'
import React, { useMemo } from 'react';
import { LuX } from 'react-icons/lu';
import Modal from './Modal';
import Button from './Button';
import { type PlayerKey } from '@/config/players';
import { CardImage, RatioToggle, useResultCard, type ShareCardInput } from './ResultCard';
import type { CardLayout } from '@/utils/resultCard';

import { Player } from '@/types/chessboard';
import { useGameText, useMessages } from '@/i18n/LocaleProvider';

interface ChampionModalProps {
  winners: (Player | 'draw')[];
  isOpen: boolean;
  uniqTerritories: { A: string[]; B: string[]; C?: string[] };
  onClose: () => void;
  /** 省略時不顯示「再來一局」。連線模式沒有本地重開 —— 重開要雙方同意。 */
  onRestart?: () => void;
  /** 打開回饋表單。剛玩完是唯一還記得剛剛發生什麼的時刻。 */
  onFeedback?: () => void;
  /** 分享圖要畫的東西（見 ResultCard） */
  card: ShareCardInput;
}

/*
  圖的高度：受「畫面高度扣掉上下的切換與按鈕」與「畫面寬度 × 比例」兩邊限制，再加一個上限。寫死的完整字串，Tailwind 才掃得到。
  手機橫放（short）：圖在左、右邊一欄 13rem 放切換與按鈕，圖吃滿高度（扣掉 Modal 上下各 1rem）；
  寬度扣掉那一欄＋間距＋左右各 1rem ＝ 16.25rem。
*/
const SIZE: Record<CardLayout, string> = {
  story: 'h-[min(calc(100svh_-_11.5rem),calc((100vw_-_2rem)*16/9),720px)] short:h-[calc(100svh_-_2rem)]',
  poster: 'h-[min(calc(100svh_-_11.5rem),calc((100vw_-_2rem)*5/4),640px)] short:h-[min(calc(100svh_-_2rem),calc((100vw_-_16.25rem)*5/4))]',
  square: 'h-[min(calc(100svh_-_11.5rem),calc(100vw_-_2rem),560px)] short:h-[min(calc(100svh_-_2rem),calc(100vw_-_16.25rem))]',
};

/** 按鈕的尺寸跟一般 Modal 的底部按鈕列一樣（Button 預設是給頁面上單獨一顆的大 CTA） */
const BTN_SIZE = '[&_button]:p-3.5 [&_button]:text-base [&_button]:tracking-normal [&_button]:lg:p-4 [&_button]:lg:text-base';

/**
 * 結算。
 *
 * **結算畫面就是分享圖本身**（Zach 10/23：「是不是可以直接顯示這個分享畫面，結合成一個」、
 * 「有可能讓結尾 Modal 直接變成是圖片本身嗎，目前感覺像是長在 Modal 內」）。
 * 圖上本來就有勝方、比分、盤面，所以不再有色帶標題與名次；「看看棋盤」也拿掉了（右上角關掉就看得到真的棋盤）。
 * 圖是 Canvas 畫的，名次另外放一份給螢幕報讀（sr-only）。
 *
 * 外觀是 Zach 從兩種裡挑的 A（「A 圖比較好」）：沒有紙色底，圖直接浮在暗下來的遮罩上，
 * 比例切換在上、按鈕在下；另一種 B 是圖下面接一塊紙色托盤。
 * 因為底是暗的，按鈕顏色反過來：主要米白、次要半透明白（全站「主要深墨、次要淡灰」的暗底版）。
 */
const ChampionModal: React.FC<ChampionModalProps> = ({
  winners, isOpen, uniqTerritories, onClose, onRestart, onFeedback, card,
}) => {
  const g = useGameText();
  const t = useMessages();
  const share = useResultCard(isOpen, card);
  const isDraw = !winners?.length || winners[0] === 'draw';
  const winnerKeys = useMemo(
    () => (isDraw ? [] : (winners as PlayerKey[])),
    [isDraw, winners]
  );

  // 勝方一律排最上面，其次才看地盤大小（投降的人地可能比較多，但他輸了）
  const ranking = useMemo(() => {
    const keys = (['A', 'B', 'C'] as PlayerKey[])
      .filter((p) => uniqTerritories[p] !== undefined);
    const won = (p: PlayerKey) => (winnerKeys.includes(p) ? 1 : 0);
    return keys
      .map((p) => ({ player: p, count: uniqTerritories[p]?.length ?? 0 }))
      .sort((a, b) => won(b.player) - won(a.player) || b.count - a.count);
  }, [uniqTerritories, winnerKeys]);

  const shareLabel = share.canShareFile ? g.share.shareImage : g.share.save;
  const onShare = share.canShareFile ? share.shareFile : share.save;

  const srList = (
    <ol className="sr-only">
      {ranking.map(({ player, count }) => (
        <li key={player}>
          {!isDraw && winnerKeys.includes(player) && `${g.champion.winner} `}
          {g.players[player]} {count} {g.champion.squares}
        </li>
      ))}
    </ol>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={share.title}
      band={{ fg: '' }}
      bare
      backdropClassName="bg-black/85 backdrop-blur-sm"
      panelClassName="w-fit max-w-full"
    >
      {/*
        直式：切換／圖／按鈕／提示由上往下一欄；手機橫放：圖在左、其他疊在右邊一欄（上下各一格 1fr 讓那一欄置中）。
        按鈕列與提示寬度跟著圖走（w-0 min-w-full：不參與撐寬），小手機上按鈕不會把整塊撐得比圖還寬。
        一排兩顆：分享＋再來一局（連線只有分享）；給點意見退成最下面一行的文字連結，跟「也可以長按圖片儲存」同一行。
      */}
      <div className="grid justify-items-center gap-3 short:grid-cols-[auto_13rem] short:grid-rows-[1fr_auto_auto_auto_1fr] short:gap-x-5">
        <div className="short:col-start-2 short:row-start-2"><RatioToggle card={share} onDark /></div>
        <div className="relative short:col-start-1 short:row-span-5 short:row-start-1">
          <CardImage card={share} size={SIZE} className="rounded-2xl" />
          {/*
            關閉鈕疊在圖的右上角：28px 的小圓＋線條 ✕（Zach：「那個叉叉太大」；原本 44px 的實心圈圈叉疊在圖上很搶眼），
            手指點的範圍用 ::before 往外撐到 44px。
          */}
          <button type="button" aria-label={t.ui.close} onClick={onClose}
            className="absolute right-2 top-2 grid size-7 place-items-center rounded-full bg-black/25 text-base text-tile-cream transition before:absolute before:-inset-2 before:content-[''] hover:bg-black/40">
            <LuX className="stroke-[3]" />
          </button>
        </div>
        <div className={`flex w-0 min-w-full gap-2 short:col-start-2 short:row-start-3 short:flex-col [&_button]:px-2 ${BTN_SIZE}`}>
          {onRestart && <Button color="bg-white/15 text-tile-cream" handleClickEvent={onShare} disabled={!share.ready}>{shareLabel}</Button>}
          {onRestart
            ? <Button color="bg-tile-cream text-tile-ink" handleClickEvent={onRestart}>{g.champion.playAgain}</Button>
            : <Button color="bg-tile-cream text-tile-ink" handleClickEvent={onShare} disabled={!share.ready}>{shareLabel}</Button>}
        </div>
        <div className="flex w-0 min-w-full flex-wrap items-center justify-between gap-x-3 gap-y-1 px-1 text-xs font-bold text-tile-cream/70 short:col-start-2 short:row-start-4">
          <span>{g.share.holdToSave}</span>
          {onFeedback && <button type="button" onClick={onFeedback} className="shrink-0 underline-offset-2 hover:text-tile-cream hover:underline">{g.champion.feedback}</button>}
        </div>
      </div>
      {srList}
    </Modal>
  );
};

export default ChampionModal;
