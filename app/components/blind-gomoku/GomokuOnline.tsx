'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LuCheck, LuCopy, LuShare2 } from 'react-icons/lu';
import { useWebShare, share } from '@/hook/useWebShare';
import { parseRoomHash, useHashSession, useTurnRoom, type TurnRoomFailure } from '@/hook/useTurnRoom';
import { useGameText } from '@/i18n/LocaleProvider';
import { fill, useTextTable } from '@/i18n/gameText';
import { localePath, type Locale } from '@/i18n/locales';
import { BLIND_GOMOKU } from '@/i18n/routes';
import { applyMove, encodeMoves, other, type Move, type Side } from '@/games/blind-gomoku/engine';
import { ONLINE_SEATS, decodeSetup, newRoomHash, parseNewRoom, roomGame, seatOf, sideOfSeat } from '@/games/blind-gomoku/online';
import { TEXT } from '@/games/blind-gomoku/text';
import GomokuFrame from './GomokuFrame';
import GomokuPlay from './GomokuPlay';
import { SideFace } from './Stone';

/**
 * /blind-gomoku/online：邀請朋友。房間是平台共用的 turnRooms（hook/useTurnRoom.ts），這款的座位、setup、走法見 games/blind-gomoku/online.ts。
 * 流程照尼泊爾虎棋的 BaghOnline：
 * - `#new=blind-black` 在這裡開房，開好用 replaceState 換成 `#roomId=…`（重整不會再開一間）
 * - `#roomId=…` 進房：已經坐著就接回（重整）、空位就坐、滿了就說滿了
 * - 朋友還沒來：等人畫面放連結（桌機複製、手機叫系統分享）
 * - 兩邊都坐好：同一個 GomokuPlay，局面由房間的走法字串整串重走；解不開或不合規則就當作連線壞了
 *
 * 連線中、等人、失敗三個畫面是這款自己的布（朝鮮拼布包袱巾：青綠拼角布、平針縫、白絲面），
 * 不用共用的紙色面板與紅藍棋子。這款裡面換頁不播轉場（回這款首頁是直接換）。
 */
export default function GomokuOnline({ locale }: { locale: Locale }) {
  const session = useHashSession();
  // 還沒讀到 hash（靜態 HTML 與 hydrate 的那一刻）先畫「連線中」，不要一片空白
  if (!session) return <Connecting />;
  return <Session key={session.n} locale={locale} hash={session.hash} />;
}

function Session({ locale, hash }: { locale: Locale; hash: string }) {
  const router = useRouter();
  const target = useMemo(() => parseRoomHash(hash, parseNewRoom), [hash]);
  const { failure, me, room, moves, open, inviteUrl, send, fail } = useTurnRoom('blind-gomoku', target);

  // 房間 → 局面。setup 看不懂、座位數不對、走法解不開或不合規則：都當作連線壞了，不畫出一盤錯的棋
  const setupText = room?.setup;
  const seats = room?.seats;
  const parsed = useMemo(() => {
    if (setupText === undefined) return null;
    const setup = seats === ONLINE_SEATS ? decodeSetup(setupText) : null;
    if (!setup) return 'bad' as const;
    try { return { blind: setup.blind, game: roomGame(moves) }; } catch { return 'bad' as const; }
  }, [setupText, seats, moves]);
  useEffect(() => { if (parsed === 'bad') fail(); }, [parsed, fail]);

  const side: Side | null = me === null ? null : sideOfSeat(me);
  const ok = parsed && parsed !== 'bad' ? parsed : null;

  // 自己的一手：整串走法＋下一個輪到誰一起寫（useTurnRoom 先把它算進局面，不等資料庫回音）
  const onMove = useCallback((m: Move) => {
    if (!ok || ok.game.turn !== side) return;
    let next;
    try { next = applyMove(ok.game, m); } catch { return; }
    send(encodeMoves(next.moves), seatOf(next.turn));
  }, [ok, side, send]);
  // 再來一局：同樣的玩法、同一方，再開一間房（換 hash 就是新的一場，見 useHashSession）
  const newRoom = useCallback(() => { if (ok && side) location.hash = newRoomHash(ok.blind, side); }, [ok, side]);
  const home = localePath(locale, BLIND_GOMOKU);
  const toHome = useCallback(() => router.push(home), [router, home]);

  if (failure) return <Failure failure={failure} home={home} />;
  if (!room || !side || !ok || !inviteUrl) return <Connecting />;
  if (open.length) return <Waiting side={side} blind={ok.blind} url={inviteUrl} home={home} />;
  return <GomokuPlay mode={{ opponent: 'online', blind: ok.blind, side, game: ok.game, onMove, newRoom }} onMenu={toHome} />;
}

/**
 * 一小塊拼起來的包袱巾：左上是青綠布、角上拼一塊桃紅三角（跟按鈕、彈窗標題的拼法一樣），旁邊幾塊包袱巾裡的布，
 * 布塊之間留白絲縫，外圈一道白絲的平針縫。
 * - sewing：縫線一直往前走（連線中）
 * - loose：右上那塊布脫線翹起來、那一角的縫線斷了（連線失敗）
 * 碰到外圈縫線的都是深色的布（白絲線才看得見），黃與白絲兩塊放在裡面。顏色都是 palette.ts、Stone.tsx 取樣的那幾個。
 */
function Patchwork({ className = '', sewing = false, loose = false }: { className?: string; sewing?: boolean; loose?: boolean }) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden="true">
      <rect width="120" height="120" rx="2" fill="#ede2c7" />
      <rect x="1" y="1" width="70" height="70" fill="#046161" />
      <path d="M1 1H29L1 29Z" fill="#be3479" />
      <path d="M30 1L1 30" stroke="#ede2c7" strokeWidth="2" />
      <rect x="73" y="1" width="46" height="32" fill="#0b2859"
        transform={loose ? 'rotate(9 119 33) translate(5 -6)' : undefined} />
      <rect x="73" y="35" width="32" height="36" fill="#dfda24" />
      <rect x="107" y="35" width="12" height="36" fill="#46246b" />
      <rect x="1" y="73" width="38" height="46" fill="#983c4a" />
      <rect x="41" y="73" width="44" height="32" fill="#f2e4c9" />
      <rect x="41" y="107" width="44" height="12" fill="#b35e40" />
      <rect x="87" y="73" width="32" height="46" fill="#662d2e" />
      <path d={loose ? 'M66 7H7V113H113V40' : 'M7 7H113V113H7Z'} fill="none" stroke="#f2e4c9" strokeOpacity="0.9" strokeWidth="1.6"
        strokeDasharray="4.5 3.5" strokeLinecap="round"
        className={sewing ? 'motion-safe:animate-[gmk-sew_0.9s_linear_infinite]' : undefined} />
    </svg>
  );
}

/** 連線中：一塊包袱巾，外圈的縫線一直往前縫 */
function Connecting() {
  const g = useGameText();
  return (
    <GomokuFrame className="items-center justify-center px-5 py-10">
      <div className="flex flex-col items-center gap-5" role="status">
        <Patchwork sewing className="size-[clamp(96px,28vw,128px)]" />
        <p className="text-base font-black">{g.play.connecting}</p>
      </div>
    </GomokuFrame>
  );
}

/** 連線失敗：同一塊包袱巾，右上那塊脫線了 */
function Failure({ failure, home }: { failure: TurnRoomFailure; home: string }) {
  const g = useGameText();
  const [title, body] = {
    noRoom: [g.play.noRoom, g.play.noRoomBody],
    roomFull: [g.play.roomFull, g.play.roomFullBody],
    connectFail: [g.play.connectFail, g.play.connectFailBody],
    badLink: [g.play.badLink, g.play.badLinkBody],
  }[failure];
  const retry = failure === 'connectFail';
  const btn = 'gmk-patch flex h-12 items-center justify-center px-6 text-base font-black active:scale-[0.98]';
  return (
    <GomokuFrame className="items-center justify-center px-5 py-10">
      <div className="flex w-full max-w-[26rem] flex-col items-center gap-5 text-center">
        <Patchwork loose className="size-[clamp(88px,26vw,112px)]" />
        <h1 className="text-[clamp(1.5rem,6vw,2.1rem)] font-black leading-tight">{title}</h1>
        <p className="text-base font-bold leading-relaxed text-ink-soft">{body}</p>
        <div className="mt-1 flex flex-wrap justify-center gap-2.5">
          {retry && <button type="button" onClick={() => window.location.reload()} className={`${btn} is-pieced`}>{g.play.reload}</button>}
          <Link href={home} className={`${btn} ${retry ? 'is-ramie' : 'is-pieced'}`}>{g.play.backHome}</Link>
        </div>
      </div>
    </GomokuFrame>
  );
}

/**
 * 等朋友進來：整頁都是這一件事，所以不是彈窗。
 * 上面是兩塊要縫在一起的布 —— 左邊是自己的（白絲布、實線的黑絲縫邊，放著自己那一方的子），
 * 右邊是還空著的那塊（半透明的苧麻布、淡淡的對方的子輕輕浮著），中間一道平針縫一直往前縫。
 * 下面是標題、連結與分享（桌機複製；手機叫系統分享，複製也還在）。
 */
function Waiting({ side, blind, url, home }: { side: Side; blind: boolean; url: string; home: string }) {
  const t = useTextTable(TEXT);
  const g = useGameText();
  const canShare = useWebShare();
  const [copied, setCopied] = useState(false);
  const name = (s: Side) => (s === 'black' ? t.black : t.white);
  // 兩欄跟布一樣寬（字長的語系自己換行），中間的縫線才接得到兩塊布
  const col = 'flex w-[clamp(84px,24vw,104px)] flex-col items-center gap-2.5';
  const patch = 'gmk-patch grid size-[clamp(84px,24vw,104px)] place-items-center';
  const stone = 'size-[58%]';

  const copy = async () => {
    try { await navigator.clipboard.writeText(url); } catch { return; }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <GomokuFrame className="items-center justify-center px-5 py-8">
      <div className="flex w-full max-w-[440px] flex-col items-center gap-7 text-center">
        <div className="flex items-start">
          <div className={col}>
            <span className={`${patch} ![outline-color:#2a2525] ![outline-offset:-5px] ![outline-style:solid] ![outline-width:2px]`}>
              <SideFace side={side} className={stone} />
            </span>
            <span className="text-sm font-black">{name(side)}</span>
          </div>
          {/* 兩塊布之間的縫線 */}
          <svg viewBox="0 0 40 8" aria-hidden="true" className="mt-[calc(clamp(84px,24vw,104px)/2-4px)] w-[clamp(28px,9vw,44px)] shrink-0">
            <path d="M0 4H40" stroke="#2a2525" strokeOpacity="0.55" strokeWidth="1.6" strokeDasharray="4.5 3.5" strokeLinecap="round"
              className="motion-safe:animate-[gmk-sew_1.4s_linear_infinite]" />
          </svg>
          <div className={col} aria-live="polite">
            <span className={`${patch} is-ramie`}>
              <SideFace side={other(side)} className={`${stone} opacity-35 motion-safe:animate-[gmk-bob_1.8s_ease-in-out_infinite]`} />
            </span>
            <span className="text-sm font-bold leading-snug text-ink-soft">{t.waitingFriend}</span>
          </div>
        </div>

        <div>
          <p className="text-sm font-bold text-ink-soft">{t.title} · {t.online} · {blind ? t.blind : t.classic}</p>
          <h1 className="mt-1 text-[clamp(1.6rem,6.5vw,2.1rem)] font-black leading-tight">{t.inviteHeading}</h1>
          <p className="mt-2 text-sm font-bold leading-relaxed">
            {fill(t.inviteBody, { side: name(other(side)) })}{blind && <><br />{t.inviteBlind}</>}
          </p>
        </div>

        <div className="flex w-full flex-col gap-2.5">
          <div className="gmk-patch is-ramie flex items-center gap-2 p-1.5 pl-3.5 text-left">
            <span className="flex-1 select-all truncate font-mono text-sm">{url}</span>
            <button type="button" onClick={copy} aria-label={copied ? g.share.copied : g.share.copyAria}
              className={`gmk-patch ${canShare ? '' : 'is-pieced ![--corner:13px]'} flex shrink-0 items-center gap-1.5 px-3 py-2 text-sm font-black active:scale-95`}>
              {copied ? <LuCheck aria-hidden="true" /> : <LuCopy aria-hidden="true" />}{copied ? g.share.copied : g.share.copy}
            </button>
          </div>
          {canShare && (
            <button type="button" onClick={() => { share({ title: t.title, text: t.shareText, url }).catch(() => {}); }}
              className="gmk-patch is-pieced flex h-12 w-full items-center justify-center gap-2 px-4 text-base font-black active:scale-[0.98]">
              <LuShare2 className="text-lg" aria-hidden="true" />{g.share.share}
            </button>
          )}
        </div>
        <Link href={home} className="gmk-thread px-3 py-1 text-sm text-ink-soft">{g.play.backHome}</Link>
      </div>
    </GomokuFrame>
  );
}
