"use client"
import React, { useState } from 'react';
import { GiCancel, GiCheckMark, GiShare } from "react-icons/gi";
import { LuCopy } from "react-icons/lu";
import SectionShadow from './SectionShadow';
import IconButton from './IconButton';

interface Props {
  isOpen: boolean;
  shareUrl: string;
  joinedCount: number;
  totalCount: number;
  onClose: () => void;
}

const ShareLinkModal: React.FC<Props> = ({ isOpen, shareUrl, joinedCount, totalCount, onClose }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`fixed inset-0 z-50 flex w-full items-center justify-center px-4 ${isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'} transition-opacity duration-300`}>
      <div className="fixed inset-0 bg-black/50"></div>
      <div className="min-w-80 max-w-md">
        <SectionShadow>
          <div className="relative w-full rounded-xl bg-primary p-6 font-[family-name:var(--font-app)]">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-2xl font-bold">
                <GiShare className="text-2xl" />等待玩家加入
              </h2>
              <IconButton handleClickEvent={onClose} label="關閉">
                <GiCancel />
              </IconButton>
            </div>

            <div className="mb-6 space-y-4">
              <p className="text-lg leading-relaxed">
                將連結分享給朋友，邀請他們加入對戰
              </p>
              <div className="flex items-center gap-2 rounded-lg bg-white p-3">
                <span className="flex-1 select-all truncate font-mono text-sm">{shareUrl}</span>
                <button
                  onClick={handleCopy}
                  className="shrink-0 rounded p-1 transition-colors hover:bg-gray-100"
                >
                  {copied
                    ? <GiCheckMark className="text-lg text-accent-green-700" />
                    : <LuCopy className="text-lg" />
                  }
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="size-2 animate-pulse rounded-full bg-player-C"></div>
              <span>{joinedCount} / {totalCount} 玩家已加入，等待中…</span>
            </div>
          </div>
        </SectionShadow>
      </div>
    </div>
  );
};

export default ShareLinkModal;
