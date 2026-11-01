'use client';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LuCheck, LuCopy, LuShare2 } from 'react-icons/lu';
import { parseRoomHash, useHashSession, useTurnRoom, type TurnRoomFailure } from '@/hook/useTurnRoom';
import { share, useWebShare } from '@/hook/useWebShare';
import { useGameText } from '@/i18n/LocaleProvider';
import { fill, useTextTable } from '@/i18n/gameText';
import { localePath, type Locale } from '@/i18n/locales';
import { NINE_MENS_MORRIS } from '@/i18n/routes';
import { other, type Move, type Side } from '@/games/nine-mens-morris/engine';
import { SIDE_AT, decodeSetup, newRoomHash, parseNewRoom, playOnline, roomGame } from '@/games/nine-mens-morris/online';
import { TEXT } from '@/games/nine-mens-morris/text';
import { PieceGlyph } from './MorrisBoard';
import MorrisFrame from './MorrisFrame';
import MorrisPlay from './MorrisPlay';
import { MAN_ORIGIN } from './art';

/**
 * /nine-mens-morris/online：邀請朋友。房間是共用的 turnRooms（hook/useTurnRoom.ts），流程照尼泊爾虎棋的 BaghOnline：
 * - `#new=black`（或 white，開了節目規則再加 `&rules=show`）在這裡開房，開好換成 `#roomId=…`
 * - `#roomId=…` 進房：已經坐著就接回（重整）、空位就坐、滿了就說滿了
 * - 對方還沒來：等人的畫面放連結（桌機複製、手機系統分享）
 * - 兩邊都坐好：同一個 MorrisPlay，局面由房間的走法重走出來（online.ts）
 *
 * 連線中、等人、連不上這三個畫面也是《遊戲之書》那一套（MorrisFrame 的群青底、朱紅框），
 * 中間一扇拱頂的羊皮紙窗（.nmm-arch，手抄本插圖框的形狀），兩個鐘形小人站在木條上 ——
 * 連線中互相鞠躬、等人時對方那格是淡淡的空位、連不上時剩自己一個倒在地上。不用 Wall Go 的紙色面板與紅藍棋子。
 */
export default function MorrisOnline({ locale }: { locale: Locale }) {
  const session = useHashSession();
  // 還沒讀到 hash（靜態 HTML、hydration 那一輪）就先畫連線中，不要先白一下
  if (!session) return <Connecting />;
  return <Session key={session.n} locale={locale} hash={session.hash} />;
}

function Session({ locale, hash }: { locale: Locale; hash: string }) {
  const target = useMemo(() => parseRoomHash(hash, parseNewRoom), [hash]);
  const { failure, me, room, moves, open, inviteUrl, send, fail } = useTurnRoom('nine-mens-morris', target);
  const router = useRouter();
  const setup = room?.setup;
  const game = useMemo(() => (setup === undefined ? null : roomGame(setup, moves)), [setup, moves]);
  // 走法解不開、不合規則、設定看不懂：當作連線壞了，不畫出一盤錯的棋
  const broken = !!room && !game;
  useEffect(() => { if (broken) fail(); }, [broken, fail]);

  const human: Side | null = me === null ? null : SIDE_AT[me] ?? null;
  const onMove = useCallback((m: Move) => {
    if (!game) return;
    const next = playOnline(game, m);
    send(next.moves, next.turn);
  }, [game, send]);
  const showRules = !!(setup && decodeSetup(setup)?.showRules);
  const newRoom = useCallback(() => { if (human) location.hash = newRoomHash(human, showRules); }, [human, showRules]);

  const home = localePath(locale, NINE_MENS_MORRIS);
  if (failure) return <Failed failure={failure} home={home} />;
  if (!room || !game || !human || !inviteUrl) return <Connecting />;
  if (open.length > 0) return <Waiting me={human} showRules={showRules} url={inviteUrl} home={home} />;
  return (
    <MorrisPlay locale={locale} mode={{ kind: 'online', human, game, onMove, newRoom }} showRules={showRules}
      onMenu={() => router.push(home)} />
  );
}

/**
 * 拱頂的羊皮紙窗：裡面一條木條當地板（棋盤嵌線的那種淺金色木條），兩個小人站在上面。
 * 小人在羊皮紙上才看得清楚（黑方的墨色疊在群青上只有 2:1）。
 */
function Stage({ children, pair = false }: { children: ReactNode; pair?: boolean }) {
  return (
    // 純裝飾：pointer-events-none，滑鼠滑過去拱才不會像按鈕一樣變色。
    // 兩個小人時各佔一半（等人畫面底下的說明照同一個兩欄對齊）
    <div className={`nmm-arch pointer-events-none relative w-[min(100%,17rem)] items-end px-6 pb-[1.15rem] pt-9 ${pair ? 'grid grid-cols-2 justify-items-center' : 'flex justify-center'}`} aria-hidden="true">
      {children}
      {/* 地板：木條（淺金色、兩側深色的邊，同 palette.ts 的 strip／stripEdge） */}
      <span aria-hidden="true" className="absolute inset-x-5 bottom-3.5 h-[5px] rounded-[1px] bg-[#bd9a55] shadow-[0_0_0_1.5px_#4e320d]" />
    </div>
  );
}

/** 站著的小人。transform-origin 在腳底（鞠躬、搖晃都以那裡為軸） */
function Man({ side, className = '' }: { side: Side; className?: string }) {
  return (
    <span className={`relative block size-[clamp(4.25rem,19vw,5.5rem)] ${className}`} style={{ transformOrigin: MAN_ORIGIN }}>
      <PieceGlyph side={side} className="size-full" />
    </span>
  );
}

/** 連線中：黑白兩個小人輪流朝對方鞠躬（宮廷裡的棋，開局先行禮） */
function Connecting() {
  const g = useGameText();
  return (
    <MorrisFrame className="items-center justify-center px-5 py-8">
      <div className="flex w-full flex-col items-center gap-5" role="status">
        <Stage pair>
          <Man side="black" className="motion-safe:animate-[nmm-bow-r_2.4s_ease-in-out_infinite]" />
          <Man side="white" className="motion-safe:animate-[nmm-bow-l_2.4s_ease-in-out_infinite]" />
        </Stage>
        <p className="text-base font-black">{g.play.connecting}</p>
      </div>
    </MorrisFrame>
  );
}

/**
 * 等對方加入：整頁就是這一件事，所以不是彈窗。
 * 拱窗裡左邊是自己（站好、腳下一圈粉筆，跟對局中「可以動的子」同一個記號）、右邊是對方的空位（淡淡的、輕輕晃著等人），
 * 下面是標題、連結與分享。
 */
function Waiting({ me, showRules, url, home }: { me: Side; showRules: boolean; url: string; home: string }) {
  const t = useTextTable(TEXT);
  const g = useGameText();
  const canShare = useWebShare();
  const [copied, setCopied] = useState(false);
  const name = (s: Side) => (s === 'black' ? t.black : t.white);
  const seat = (s: Side) => (s === 'black' ? t.first : t.second);
  // 黑方永遠在左邊：兩台裝置看到的站位一樣
  const sides = ['black', 'white'] as const;

  const copy = async () => {
    try { await navigator.clipboard.writeText(url); } catch { return; }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <MorrisFrame className="items-center justify-center px-5 py-8">
      <main className="flex w-full max-w-[440px] flex-col items-center gap-6 text-center">
        <div className="flex w-full flex-col items-center gap-2.5">
          <Stage pair>
            {sides.map((s) => (s === me
              ? <Man key={s} side={s} />
              : <Man key={s} side={s} className="opacity-35 motion-safe:animate-[nmm-wait_2.2s_ease-in-out_infinite]" />))}
          </Stage>
          <div className="grid w-[min(100%,17rem)] grid-cols-2 px-6 text-sm font-black" aria-live="polite">
            {sides.map((s) => (
              <span key={s} className={s === me ? '' : 'text-[#eee0c4]/70'}>{s === me ? seat(s) : t.waitingOpponent}</span>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-bold text-[#eee0c4]/80">{[t.title, t.online, ...(showRules ? [t.showRules] : [])].join(' · ')}</p>
          <h1 className="mt-1 text-[clamp(1.6rem,6.5vw,2.1rem)] font-black leading-tight">{t.inviteHeading}</h1>
          <p className="mt-2 text-sm font-bold leading-relaxed text-[#eee0c4]/90">{fill(t.inviteBody, { me: name(me), them: name(other(me)) })}</p>
        </div>

        <div className="flex w-full flex-col gap-2.5">
          {/* 連結：一條羊皮紙，右邊朱紅的小拱是複製 */}
          <div className="flex items-center gap-2 rounded-[5px] bg-[#eee0c4] p-1.5 pl-3 text-left text-[#1e120a] shadow-[inset_0_0_0_2px_#c54915,inset_0_0_0_4px_#eee0c4,inset_0_0_0_5px_rgb(197_73_21/0.35)]">
            <span className="flex-1 select-all truncate font-mono text-sm">{url}</span>
            <button type="button" onClick={copy} aria-label={copied ? g.share.copied : g.share.copyAria}
              className="nmm-arch is-small is-red flex shrink-0 items-center gap-1.5 px-3.5 pb-2 pt-2.5 text-sm font-black">
              {copied ? <LuCheck aria-hidden="true" /> : <LuCopy aria-hidden="true" />}{copied ? g.share.copied : g.share.copy}
            </button>
          </div>
          {canShare && (
            <button type="button" onClick={() => { void share({ title: t.title, text: t.shareText, url }).catch(() => {}); }}
              className="nmm-arch is-small is-red flex h-12 w-full items-center justify-center gap-2 px-4 pt-1 text-base font-black">
              <LuShare2 className="text-lg" aria-hidden="true" />{g.share.share}
            </button>
          )}
        </div>
        <Link href={home} className="nmm-pilcrow text-sm font-black text-[#eee0c4] underline decoration-2 underline-offset-4 [--nmm-rubric:#eee0c4] hover:text-white">
          {g.play.backHome}
        </Link>
      </main>
    </MorrisFrame>
  );
}

/** 連不上、房間不在、坐滿了、連結壞了：拱窗裡剩自己一個，倒在地上（被拿掉的子就是這樣躺著的） */
function Failed({ failure, home }: { failure: TurnRoomFailure; home: string }) {
  const g = useGameText();
  const [title, body] = {
    noRoom: [g.play.noRoom, g.play.noRoomBody],
    roomFull: [g.play.roomFull, g.play.roomFullBody],
    connectFail: [g.play.connectFail, g.play.connectFailBody],
    badLink: [g.play.badLink, g.play.badLinkBody],
  }[failure];
  const retry = failure === 'connectFail';
  return (
    <MorrisFrame className="items-center justify-center px-5 py-8">
      <main className="flex w-full max-w-[26rem] flex-col items-center gap-5 text-center">
        <Stage>
          {/* 躺下：以中心轉 90 度，再往下挪到身體貼著地板（側躺的身體下緣在 86%、站著的腳底在 94%） */}
          <span className="block size-[clamp(4.25rem,19vw,5.5rem)] translate-y-[8%] rotate-90">
            <PieceGlyph side="white" className="size-full" />
          </span>
        </Stage>
        <h1 className="text-[clamp(1.5rem,6vw,2.1rem)] font-black leading-tight">{title}</h1>
        <p className="text-sm font-bold leading-relaxed text-[#eee0c4]/90">{body}</p>
        <div className="mt-1 flex w-full max-w-80 flex-col gap-2.5">
          {retry && (
            <button type="button" onClick={() => window.location.reload()} className="nmm-arch is-small is-red h-12 px-4 pt-1 text-base font-black">
              {g.play.reload}
            </button>
          )}
          <Link href={home} className={`nmm-arch is-small grid h-12 place-items-center px-4 pt-1 text-base font-black ${retry ? '' : 'is-red'}`}>
            {g.play.backHome}
          </Link>
        </div>
      </main>
    </MorrisFrame>
  );
}
