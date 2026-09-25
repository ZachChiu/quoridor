'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import PlayClient from '@/components/PlayClient';
import Connecting from '@/components/Connecting';
import StatusScreen, { BTN_PRIMARY, BTN_SECONDARY } from '@/components/StatusScreen';
import { GiBreakingChain, GiUnplugged } from 'react-icons/gi';
import { useGameText, useLocale } from '@/i18n/LocaleProvider';
import { fmt } from '@/i18n/content/game';
import { localePath } from '@/i18n/locales';
import { useUser } from '@/contexts/UserContext';
import { createRoom } from '@/utils/gameService';
import { parseOnlineHash, type OnlineTarget } from '@/utils/gameMode';
import { createGame, toWgf } from '@/game/engine';

export default function OnlineClient() {
  const g = useGameText();
  const locale = useLocale();
  const searchParams = useSearchParams();
  const { ensureUser } = useUser();
  // null ＝ 還沒讀到 hash。初次 render 時 effect 還沒跑，
  // 若直接當成「看不懂」會先閃一下錯誤畫面。
  const [target, setTarget] = useState<OnlineTarget | null>(null);
  const [createFailed, setCreateFailed] = useState(false);
  // 同一次進頁只建一間房。StrictMode 會把 effect 跑兩次，沒有這道閘就是兩間。
  const creating = useRef(false);

  useEffect(() => {
    const sync = () => setTarget(parseOnlineHash(window.location.hash));
    sync();
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);

  /*
    `#new=2`：在這裡開房（理由見 utils/gameMode.ts 的 parseOnlineHash）。

    建好之後用 replaceState 把網址換成 `#roomId=…`，而且**不留歷史紀錄**：
    - 在等待畫面按重新整理，才不會又開一間新房
    - 按上一頁會回首頁，而不是回到 `#new=2` 再開一間
    - 網址列上看到的就是可以分享的那條
  */
  const createCount = target && 'create' in target ? target.create : null;
  useEffect(() => {
    if (!createCount || creating.current) return;
    creating.current = true;
    void (async () => {
      try {
        const uid = await ensureUser();
        const roomId = await createRoom(createCount, 'A', {
          uid,
          displayName: fmt(g.play.playerName, { id: uid.slice(0, 4).toUpperCase() }),
          joinedAt: Date.now(),
        }, toWgf(createGame(createCount)));
        history.replaceState(null, '', `${location.pathname}#roomId=${roomId}`);
        setTarget({ roomId });
      } catch (err) {
        console.error('[online] 開房失敗：', err);
        setCreateFailed(true);
      }
    })();
  }, [createCount, ensureUser, g]);

  const legacyRoomId = searchParams.get('roomId');
  if (legacyRoomId) return <PlayClient roomId={legacyRoomId} />;
  if (target === null) return null;

  if (createFailed) {
    return (
      <StatusScreen
        icon={GiUnplugged}
        iconClass="text-tile-blue"
        title={g.play.connectFail}
        body={g.play.connectFailBody}
        actions={<>
          <button type="button" onClick={() => window.location.reload()} className={BTN_PRIMARY}>{g.play.reload}</button>
          <Link href={localePath(locale, '/')} className={BTN_SECONDARY}>{g.play.backHome}</Link>
        </>}
        embedded
      />
    );
  }

  if ('create' in target) return <Connecting label={g.play.connecting} />;

  /*
    沒有 roomId 就不能渲染 PlayClient。

    PlayClient 是用 `isOnline = !!roomId` 區分本機與連線的，空字串會讓它
    整個退化成本機對戰 —— 於是直接開 /online 的人會拿到一局可以玩的本機棋，
    但頁面標題寫著「連線對戰」。連結被截斷時就會發生。
  */
  if ('invalid' in target) {
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

  return <PlayClient roomId={target.roomId} />;
}
