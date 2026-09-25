'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import PlayClient from '@/components/PlayClient';
import StatusScreen, { BTN_PRIMARY } from '@/components/StatusScreen';
import { GiBreakingChain } from 'react-icons/gi';
import { useGameText, useLocale } from '@/i18n/LocaleProvider';
import { localePath } from '@/i18n/locales';

export default function OnlineClient() {
  const g = useGameText();
  const locale = useLocale();
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
      <StatusScreen
        icon={GiBreakingChain}
        iconClass="text-tile-blue"
        title={g.play.badLink}
        body={g.play.badLinkBody}
        actions={<Link href={localePath(locale, '/')} className={BTN_PRIMARY}>{g.play.backHome}</Link>}
        embedded
      />
    );
  }

  return <PlayClient roomId={roomId} />;
}
