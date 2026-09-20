'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import PlayClient from '@/components/PlayClient';
import { useGameText } from '@/i18n/LocaleProvider';

export default function MatchClient() {
  const g = useGameText();
  const searchParams = useSearchParams();
  // null ＝ 還沒讀到 hash，'' ＝ 讀完了但沒有 roomId。
  // 兩者必須分開：初次 render 時 effect 還沒跑，若用 '' 當初值會先閃一下錯誤畫面。
  const [hashRoomId, setHashRoomId] = useState<string | null>(null);

  useEffect(() => {
    const syncHashRoomId = () => {
      const hash = window.location.hash.replace(/^#/, '');
      const params = new URLSearchParams(hash);
      setHashRoomId(params.get('roomId') ?? '');
    };

    syncHashRoomId();
    window.addEventListener('hashchange', syncHashRoomId);
    return () => window.removeEventListener('hashchange', syncHashRoomId);
  }, []);

  const roomId = searchParams.get('roomId') ?? hashRoomId;

  if (roomId === null) return null;

  /*
    沒有 roomId 就不能渲染 PlayClient。

    PlayClient 是用 `isOnline = !!roomId` 區分本機與連線的，空字串會讓它
    整個退化成本機對戰 —— 於是直接開 /match 的人會拿到一局可以玩的本機棋，
    但頁面標題寫著「連線對戰」。連結被截斷時就會發生。
  */
  if (!roomId) {
    return (
      <div className="flex flex-col items-center gap-5 px-6 text-center">
        <div>
          <p className="text-xs font-bold tracking-widest text-ink-soft">{g.share.kicker}</p>
          <h2 className="mt-1 text-3xl font-black">{g.play.badLink}</h2>
        </div>
        <p className="text-sm leading-relaxed text-ink-soft">
          {g.play.badLinkBody}
        </p>
        <Link
          href="/"
          className="rounded-2xl bg-tile-amber px-6 py-4 text-lg font-black text-tile-ink transition hover:brightness-95 active:scale-[0.98]"
        >
          {g.play.backHome}
        </Link>
      </div>
    );
  }

  return <PlayClient roomId={roomId} />;
}
