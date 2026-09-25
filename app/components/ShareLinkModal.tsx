"use client"
import React, { useState } from 'react';
import { GiCheckMark, GiShare } from "react-icons/gi";
import { LuCopy, LuShare2 } from "react-icons/lu";
import Modal from './Modal';
import { playerVar, type PlayerKey } from '@/config/players';
import { useWebShare, share } from '@/hook/useWebShare';
import { track } from '@/utils/analytics';
import { useGameText } from '@/i18n/LocaleProvider';

interface Props {
  isOpen: boolean;
  shareUrl: string;
  joinedCount: number;
  totalCount: number;
  onClose: () => void;
}

const SEATS: PlayerKey[] = ['A', 'B', 'C'];

/**
 * 邀請連結。
 *
 * 色帶用靛藍 —— 與首頁「連線」那兩塊磁磚同色，一眼知道自己在連線這條線上。
 *
 * 面板裡就**只有這一個色相加中性**。複製鍵原本是琥珀、複製完變森綠、
 * 分享鍵又是靛藍 —— 一塊小面板上四個色相在搶，而且分享鍵跟色帶同色，
 * 主要動作反而糊在背景裡。兩顆按鈕一律深墨：深墨不屬於任何色相，
 * 放在哪個色帶下面都成立，層級改用「整排寬 vs 靠右一顆」表示。
 * 座位的圓點不算 —— 那是玩家顏色，是資訊不是裝飾。
 *
 * 人數原本只是一行「1 / 2 玩家已加入」。改成一排座位：已入座的染該玩家的
 * 顏色，空位是虛線圈。同一個資訊，但不用讀字就看得懂，而且顏色與待會兒
 * 盤面上的棋子對得起來。
 */
const ShareLinkModal: React.FC<Props> = ({ isOpen, shareUrl, joinedCount, totalCount, onClose }) => {
  const g = useGameText();
  const [copied, setCopied] = useState(false);
  const canShare = useWebShare();

  /*
    手機上的主要動作是「分享」而不是「複製」—— 複製完還得自己切到
    訊息 App 再貼上，而系統分享面板可以直接選對話送出去。
    桌機沒有 navigator.share，就只留複製。
  */
  const handleShare = async () => {
    track('share_room_link', { method: 'native' });
    // 網址只放 url，不要在 text 裡再寫一次 —— 有些平台會把兩者串起來，
    // 於是同一個連結出現兩次。
    await share({
      title: g.share.shareTitle,
      text: g.share.shareText,
      url: shareUrl,
    });
  };

  const handleCopy = async () => {
    track('share_room_link', { method: 'copy' });
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      // 非安全內容或使用者拒絕權限時 clipboard 會被擋。
      // 連結本身是 select-all 的，使用者仍然可以自己長按複製，
      // 所以這裡不跳錯誤，只是不顯示「已複製」。
      return;
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={g.share.heading}
      kicker={g.share.kicker}
      icon={GiShare}
      band={{ className: 'bg-tile-purple', fg: 'text-tile-cream' }}
    >
      <p className="text-sm leading-relaxed">{g.share.body}</p>


      <div className="mt-4 flex items-center gap-2 rounded-xl bg-primary-50 p-2 pl-4">
        <span className="flex-1 select-all truncate font-mono text-sm">{shareUrl}</span>
        <button
          type="button"
          onClick={handleCopy}
          aria-label={copied ? g.share.copied : g.share.copyAria}
          className="flex shrink-0 items-center gap-1.5 rounded-lg bg-tile-ink px-3 py-2 text-sm font-black text-tile-cream transition hover:brightness-125 active:scale-[0.98]"
        >
          {copied ? <GiCheckMark /> : <LuCopy />}
          {copied ? g.share.copied : g.share.copy}
        </button>
      </div>

      {/* 分享鍵放在網址下面：先看到要送出去的是什麼，再決定怎麼送。
          有系統分享面板時它才出現，整排寬、拇指按得到。 */}
      {canShare && (
        <button
          type="button"
          onClick={handleShare}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-tile-ink px-4 py-3 text-base font-black text-tile-cream transition hover:brightness-125 active:scale-[0.98]"
        >
          <LuShare2 className="text-lg" aria-hidden="true" />
          {g.share.share}
        </button>
      )}

      <div className="mt-6 flex items-center gap-3">
        {SEATS.slice(0, totalCount).map((p, i) => {
          const joined = i < joinedCount;
          return (
            <div key={p} className="flex items-center gap-2">
              <div
                // 跟等待畫面同一套：空位是會轉的虛線圈、入座時彈一下
                className={`size-6 rounded-full ${joined ? 'animate-seat-join' : 'animate-seat-wait border-2 border-dashed border-tile-ink/35'}`}
                style={joined ? { backgroundColor: playerVar(p) } : { animationDelay: `${i * 0.35}s` }}
              />
              <span className={`text-xs font-bold ${joined ? '' : 'text-ink-soft'}`}>
                {joined ? g.players[p] : g.share.waiting}
              </span>
            </div>
          );
        })}
      </div>
    </Modal>
  );
};

export default ShareLinkModal;
