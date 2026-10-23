'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { LuCheck, LuCopy, LuShare2 } from 'react-icons/lu';
import StatusScreen from '@/components/StatusScreen';
import { useUser } from '@/contexts/UserContext';
import { useWebShare, share } from '@/hook/useWebShare';
import { useIsoLayoutEffect } from '@/hook/useIsoLayoutEffect';
import { useGameText, useMessages } from '@/i18n/LocaleProvider';
import { localePath, type Locale } from '@/i18n/locales';
import { baghChal } from '@/i18n/routes';
import { applyMove, createGame, decodeMoves, encodeMoves, replay, type BaghState, type Move, type Side } from '@/games/bagh-chal/engine';
import type { BaghRoom } from '@/types/baghRoom';
import { createBaghRoom, getBaghRoom, joinBaghRoom, subscribeBaghRoom, writeBaghMoves } from '@/utils/baghService';
import { atStep, describeOnlineError, reportOnlineError } from '@/utils/onlineError';
import BaghPlay from './BaghPlay';
import BaghFrame from './BaghFrame';
import { GoatToken, InviteToken, TigerToken } from './tokens';
import { BAGH_PRIMARY, BAGH_SECONDARY } from './styles';

/** `#new=tiger`（自己開房、自己當老虎）或 `#roomId=…`（進房） */
type Target = { create: Side } | { roomId: string } | { invalid: true };
function parseHash(hash: string): Target {
  const p = new URLSearchParams(hash.replace(/^#/, ''));
  const side = p.get('new');
  if (side === 'tiger' || side === 'goat') return { create: side };
  const roomId = p.get('roomId');
  return roomId && /^[-\w]{10,40}$/.test(roomId) ? { roomId } : { invalid: true };
}

type Failure = 'noRoom' | 'roomFull' | 'connectFail' | 'badLink';
const other = (s: Side): Side => (s === 'tiger' ? 'goat' : 'tiger');

/**
 * /bagh-chal/online：邀請朋友。流程照 Wall Go 的連線頁：
 * - `#new=tiger` 在這裡開房，開好用 replaceState 換成 `#roomId=…`（重整不會再開一間、按上一頁回首頁）
 * - `#roomId=…` 進房：已經坐著就接回（重整）、空位就坐、滿了就說滿了
 * - 對方還沒來：等待畫面放連結（手機是系統分享，桌機是複製）
 * - 兩邊都坐好：同一個 BaghPlay，局面由房間的走法字串重走出來
 */
export default function BaghOnline({ locale }: { locale: Locale }) {
  // 每次 hash 變了就是新的一場（結算的「再來一局」是把 hash 換成 #new=）。
  // 用遞增的編號當 key，而不是 hash 本身：開房後網址被 replaceState 成 #roomId=，
  // 再來一局又設回同一個 #new=tiger 時，hash 字串跟上一場一樣，key 就不會變。
  const [session, setSession] = useState<{ hash: string; n: number } | null>(null);
  useIsoLayoutEffect(() => {
    const read = () => setSession((s) => ({ hash: location.hash, n: (s?.n ?? 0) + 1 }));
    read();
    window.addEventListener('hashchange', read);
    return () => window.removeEventListener('hashchange', read);
  }, []);
  if (!session) return null;
  return <Session key={session.n} locale={locale} hash={session.hash} />;
}

function Session({ locale, hash }: { locale: Locale; hash: string }) {
  const target = useMemo(() => parseHash(hash), [hash]);
  const g = useGameText();
  const { ensureUser } = useUser();
  const [roomId, setRoomId] = useState<string | null>(null);
  const [me, setMe] = useState<Side | null>(null);
  const [room, setRoom] = useState<BaghRoom | null>(null);
  const [game, setGame] = useState<BaghState>(createGame);
  const [failed, setFailure] = useState<Failure | null>(null);
  const failure: Failure | null = 'invalid' in target ? 'badLink' : failed;

  // 開房或進房（這個元件一場一個，見上面的 key）
  useEffect(() => {
    if ('invalid' in target) return;
    let cancelled = false;
    void (async () => {
      try {
        const uid = await atStep('auth', ensureUser());
        const seat = { uid, displayName: 'player', joinedAt: Date.now() };
        if ('create' in target) {
          const id = await atStep('create', createBaghRoom(target.create, seat));
          if (cancelled) return;
          history.replaceState(null, '', `${location.pathname}#roomId=${id}`);
          setMe(target.create); setRoomId(id);
          return;
        }
        const existing = await atStep('getRoom', getBaghRoom(target.roomId));
        if (cancelled) return;
        if (!existing) { setFailure('noRoom'); return; }
        const mine = (['tiger', 'goat'] as const).find((s) => existing.players?.[s]?.uid === uid);
        const open = (['tiger', 'goat'] as const).find((s) => !existing.players?.[s]);
        const side = mine ?? open;
        if (!side) { setFailure('roomFull'); return; }
        if (!mine) await atStep('join', joinBaghRoom(target.roomId, side, seat));
        if (cancelled) return;
        setMe(side); setRoomId(target.roomId);
      } catch (err) {
        if (cancelled) return;
        console.error('[bagh-chal online]', err);
        const info = describeOnlineError(err);
        reportOnlineError('create' in target ? 'createFail' : 'connectFail', info);
        setFailure('connectFail');
      }
    })();
    return () => { cancelled = true; };
  }, [target, ensureUser]);

  // 房間的變化 → 局面。走法字串解不開或不合規則就當作連線壞了，不畫出一盤錯的棋
  useEffect(() => {
    if (!roomId) return;
    return subscribeBaghRoom(roomId, (r) => {
      if (!r) { setFailure('noRoom'); return; }
      setRoom(r);
      try { setGame(replay(decodeMoves(r.moves ?? ''))); } catch { setFailure('connectFail'); }
    });
  }, [roomId]);

  // 自己的一手：先畫出來（不必等資料庫回音），再寫進房間
  const onMove = useCallback((m: Move) => {
    if (!roomId) return;
    const next = applyMove(game, m);
    setGame(next);
    writeBaghMoves(roomId, encodeMoves(next.history), next.turn).catch((err) => {
      console.error('[bagh-chal online] 寫入失敗', err);
      reportOnlineError('connectFail', describeOnlineError(err));
      setFailure('connectFail');
    });
  }, [roomId, game]);

  const newRoom = useCallback(() => { if (me) location.hash = `#new=${me}`; }, [me]);

  const home = localePath(locale, baghChal());
  if (failure) {
    const copy = {
      noRoom: [g.play.noRoom, g.play.noRoomBody],
      roomFull: [g.play.roomFull, g.play.roomFullBody],
      connectFail: [g.play.connectFail, g.play.connectFailBody],
      badLink: [g.play.badLink, g.play.badLinkBody],
    }[failure];
    return (
      <BaghFrame variant="play" className="justify-center py-8">
        <StatusScreen embedded icon={InviteToken} title={copy[0]} body={copy[1]}
          actions={<>
            {failure === 'connectFail' && <button type="button" onClick={() => window.location.reload()} className={`${BAGH_PRIMARY} px-6 py-3.5 text-lg`}>{g.play.reload}</button>}
            <Link href={home} className={`${failure === 'connectFail' ? BAGH_SECONDARY : BAGH_PRIMARY} px-6 py-3.5 text-lg`}>{g.play.backHome}</Link>
          </>} />
      </BaghFrame>
    );
  }
  if (!roomId || !me || !room) return <Connecting />;

  if (!room.players?.[other(me)]) {
    return <Waiting me={me} url={`${location.origin}${location.pathname}#roomId=${roomId}`} home={home} />;
  }
  return <BaghPlay locale={locale} mode={{ kind: 'online', human: me, game, onMove, newRoom }} />;
}

/**
 * 連線中：一隻老虎、一隻羊面對面輪流浮起來。不用共用的 Connecting（那是 Wall Go 的紙色面板加紅藍兩顆棋子），
 * 原本這裡是一顆小轉圈加一行字，Zach 10/24：一開始連線中希望可以改好看一點。
 */
function Connecting() {
  const b = useMessages().baghChal;
  const g = useGameText();
  return (
    <BaghFrame variant="play" className="items-center justify-center">
      <div className="flex flex-col items-center gap-5" role="status">
        <div className="flex items-center gap-4" aria-hidden="true">
          <TigerToken className="text-[clamp(72px,20vw,96px)] motion-safe:animate-[bagh-bob_1.6s_ease-in-out_infinite]" />
          <span className="text-base font-black text-ink-soft">{b.versus}</span>
          <GoatToken className="text-[clamp(72px,20vw,96px)] motion-safe:animate-[bagh-bob_1.6s_ease-in-out_-0.8s_infinite]" />
        </div>
        <p className="text-base font-black">{g.play.connecting}</p>
      </div>
    </BaghFrame>
  );
}

/**
 * 等對方加入：整頁都是這一件事，所以不是彈窗。
 * 上面是自己（多一圈自己顏色的框，中間留一道縫，跟對局的狀態卡一樣）對上還沒來的對方（淡淡的、輕輕浮著），
 * 下面是標題、連結與分享。原本是一排小字靠左擠在大面板中間，Zach 10/24：偏醜、沒有整體風格。
 */
function Waiting({ me, url, home }: { me: Side; url: string; home: string }) {
  const b = useMessages().baghChal;
  const g = useGameText();
  const canShare = useWebShare();
  const [copied, setCopied] = useState(false);
  const name = (s: Side) => (s === 'tiger' ? b.tiger : b.goat);
  const Me = me === 'tiger' ? TigerToken : GoatToken;
  const Them = other(me) === 'tiger' ? TigerToken : GoatToken;
  const ring = me === 'tiger' ? 'ring-[#e3a43c]' : 'ring-[#5b6620]';
  const token = 'text-[clamp(84px,24vw,112px)]';

  const copy = async () => {
    try { await navigator.clipboard.writeText(url); } catch { return; }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <BaghFrame variant="play">
    <div className="flex flex-1 items-center justify-center px-5 py-8">
      <div className="flex w-full max-w-[440px] flex-col items-center gap-7 text-center">
        <div className="flex items-start gap-[clamp(14px,5vw,32px)]">
          <div className="flex flex-col items-center gap-2.5">
            <span className={`rounded-full ring ring-offset-4 ring-offset-[#fbf4e1] ${ring}`}><Me className={`block ${token}`} /></span>
            <span className="text-sm font-black">{name(me)}</span>
          </div>
          <span className="mt-[clamp(32px,10vw,46px)] text-lg font-black text-ink-soft">{b.versus}</span>
          <div className="flex flex-col items-center gap-2.5" aria-live="polite">
            <span className="rounded-full ring ring-transparent ring-offset-4 ring-offset-[#fbf4e1]">
              <Them className={`block opacity-45 motion-safe:animate-[bagh-bob_1.8s_ease-in-out_infinite] ${token}`} />
            </span>
            <span className="text-sm font-bold text-ink-soft">{b.waitingOpponent}</span>
          </div>
        </div>

        <div>
          <p className="text-sm font-bold text-ink-soft">{b.title} · {b.onlineTitle}</p>
          <h1 className="mt-1 text-[clamp(1.6rem,6.5vw,2.1rem)] font-black leading-tight">{b.inviteHeading}</h1>
          <p className="mt-2 text-sm leading-relaxed">{b.inviteBody.replace('{me}', name(me)).replace('{them}', name(other(me)))}</p>
        </div>

        <div className="flex w-full flex-col gap-2.5">
          <div className="bagh-line flex items-center gap-2 bg-[#f2e4c4] p-1.5 pl-3 text-left">
            <span className="flex-1 select-all truncate font-mono text-sm">{url}</span>
            <button type="button" onClick={copy} aria-label={copied ? g.share.copied : g.share.copyAria}
              className={`${BAGH_PRIMARY} shrink-0 gap-1.5 px-3 py-2 text-sm`}>
              {copied ? <LuCheck /> : <LuCopy />}{copied ? g.share.copied : g.share.copy}
            </button>
          </div>
          {canShare && (
            <button type="button" onClick={() => share({ title: b.title, text: b.shareText, url })}
              className={`${BAGH_PRIMARY} h-12 w-full px-4 text-base`}>
              <LuShare2 className="text-lg" aria-hidden="true" />{g.share.share}
            </button>
          )}
        </div>
        <Link href={home} className="text-sm font-bold text-ink-soft underline underline-offset-4">{g.play.backHome}</Link>
      </div>
    </div>
    </BaghFrame>
  );
}
