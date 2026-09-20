"use client"
import React, { useState } from 'react';
import { GiCheckMark, GiShare } from "react-icons/gi";
import { LuCopy, LuShare2 } from "react-icons/lu";
import Modal from './Modal';
import { PLAYER_NAME, playerVar, type PlayerKey } from '@/config/players';
import { useWebShare, share } from '@/hook/useWebShare';
import { trackButtonClick } from '@/utils/analytics';

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
 * 人數原本只是一行「1 / 2 玩家已加入」。改成一排座位：已入座的染該玩家的
 * 顏色，空位是虛線圈。同一個資訊，但不用讀字就看得懂，而且顏色與待會兒
 * 盤面上的棋子對得起來。
 */
const ShareLinkModal: React.FC<Props> = ({ isOpen, shareUrl, joinedCount, totalCount, onClose }) => {
  const [copied, setCopied] = useState(false);
  const canShare = useWebShare();

  /*
    手機上的主要動作是「分享」而不是「複製」—— 複製完還得自己切到
    訊息 App 再貼上，而系統分享面板可以直接選對話送出去。
    桌機沒有 navigator.share，就只留複製。
  */
  const handleShare = async () => {
    trackButtonClick('share_room_link_native');
    // 網址只放 url，不要在 text 裡再寫一次 —— 有些平台會把兩者串起來，
    // 於是同一個連結出現兩次。
    await share({
      title: '牆壁圍棋 Wall Go',
      text: '我開了一間房，點連結直接加入對局！',
      url: shareUrl,
    });
  };

  const handleCopy = async () => {
    trackButtonClick('share_room_link_copy');
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
      title="邀請朋友加入"
      kicker="連線對戰"
      icon={GiShare}
      band={{ className: 'bg-tile-blue', fg: 'text-tile-cream' }}
    >
      <p className="text-sm leading-relaxed">把連結傳給朋友，他們點開就會直接坐進這間房。</p>


      <div className="mt-4 flex items-center gap-2 rounded-xl bg-primary-50 p-2 pl-4">
        <span className="flex-1 select-all truncate font-mono text-sm">{shareUrl}</span>
        <button
          type="button"
          onClick={handleCopy}
          aria-label={copied ? '已複製' : '複製連結'}
          className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-black transition ${
            copied ? 'bg-tile-forest text-tile-cream' : 'bg-tile-amber text-tile-ink hover:brightness-95'
          }`}
        >
          {copied ? <GiCheckMark /> : <LuCopy />}
          {copied ? '已複製' : '複製'}
        </button>
      </div>

      {/* 分享鍵放在網址下面：先看到要送出去的是什麼，再決定怎麼送。
          有系統分享面板時它才出現，整排寬、拇指按得到。 */}
      {canShare && (
        <button
          type="button"
          onClick={handleShare}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-tile-blue px-4 py-3 text-base font-black text-tile-cream transition active:scale-[0.98]"
        >
          <LuShare2 className="text-lg" aria-hidden="true" />
          分享連結
        </button>
      )}

      <div className="mt-6 flex items-center gap-3">
        {SEATS.slice(0, totalCount).map((p, i) => {
          const joined = i < joinedCount;
          return (
            <div key={p} className="flex items-center gap-2">
              <div
                className={`size-6 rounded-full ${joined ? '' : 'border-ink-soft/50 border-2 border-dashed'}`}
                style={joined ? { backgroundColor: playerVar(p) } : undefined}
              />
              <span className={`text-xs font-bold ${joined ? '' : 'text-ink-soft'}`}>
                {joined ? PLAYER_NAME[p] : '等待中'}
              </span>
            </div>
          );
        })}
      </div>
    </Modal>
  );
};

export default ShareLinkModal;
