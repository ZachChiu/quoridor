'use client';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LuCheck, LuCopy, LuShare2 } from 'react-icons/lu';
import { useWebShare, share } from '@/hook/useWebShare';
import { parseRoomHash, useHashSession, useTurnRoom, type TurnRoomFailure } from '@/hook/useTurnRoom';
import { fill, useTextTable } from '@/i18n/gameText';
import { useGameText } from '@/i18n/LocaleProvider';
import { localePath, type Locale } from '@/i18n/locales';
import { BALANCE_MANCALA } from '@/i18n/routes';
import { TEXT } from '@/games/balance-mancala/text';
import { CELLS, CELL_COLOUR, DEVIL, letterOf, type MancalaState, type Seat } from '@/games/balance-mancala/engine';
import type { MatchSetup } from './match';
import { movesOf, parseNew, stateOf } from './online';
import { BRASS, CLOTH_LIGHT, DISH_BG, INK, WOOD, seatLook } from './palette';
import MancalaFrame from './MancalaFrame';
import MancalaPlay from './MancalaPlay';
import PieceDisc from './PieceDisc';

/**
 * /balance-mancala/online：連線對戰（邀請朋友）。房間是共用的 turnRooms（hook/useTurnRoom.ts），流程照尼泊爾虎棋的 BaghOnline：
 * - `#new=5` 在這裡開一間 5 人房（開房的人坐 A），開好換成 `#roomId=…`；`#roomId=…` 進房（坐過就接回、有空位就坐、滿了就說滿了）
 * - 還沒坐滿：等人畫面（一張圓木桌，坐了誰、還空幾個位子），放邀請連結
 * - 坐滿：同一個 MancalaPlay，局面由房間的整串走法重走出來（online.ts），解不開或不合規則就當作連線壞了
 * - 結算的「再來一局」是換 hash 開一間新房（同樣的人數），再把新連結傳出去
 *
 * 三個畫面（連線中、等人、失敗）都是這款自己的世界：印花布的頁面（MancalaFrame）、Oware 的圓木盤、黃銅牌與梳線的印花布條。
 * 不用 Wall Go 的紙色面板與紅藍棋子，也不用 Rattray 的 #3／#11／#12／#16 與 Bowdich 1817 的圖（布邊只有 MancalaFrame 那一圈）。
 */
export default function MancalaOnline({ locale }: { locale: Locale }) {
  const session = useHashSession();
  if (!session) return null;
  return <Session key={session.n} locale={locale} hash={session.hash} />;
}

function Session({ locale, hash }: { locale: Locale; hash: string }) {
  const target = useMemo(() => parseRoomHash(hash, parseNew), [hash]);
  const { failure, me, room, moves, open, inviteUrl, turn, send, fail } = useTurnRoom('balance-mancala', target);
  const router = useRouter();
  const home = localePath(locale, BALANCE_MANCALA);

  // 房間 → 局面：每台裝置自己從頭重走一次（也順便驗合不合規則）
  const setup = room?.setup;
  const seats = room?.seats ?? 0;
  const state = useMemo((): MancalaState | 'bad' | null => {
    if (setup === undefined) return null;
    try { return stateOf(setup, moves, seats); } catch { return 'bad'; }
  }, [setup, moves, seats]);
  // 已經跟資料庫同步（不是自己剛送出、回音還沒到的那一刻）時，房間的 turn 要跟 engine 算的一樣 ——
  // 不一樣的話該動的人寫不進去、整桌卡住，不如直接說連線壞了
  const synced = room !== null && (room.moves ?? '') === moves;
  const bad = state === 'bad' || (state !== null && synced && turn !== state.turn);
  useEffect(() => { if (bad) fail(); }, [bad, fail]);

  const onSend = useCallback((next: MancalaState) => send(movesOf(next), next.turn), [send]);
  const online = useMemo(() => (me !== null && state && state !== 'bad' ? { me, state, send: onSend } : null), [me, state, onSend]);
  const match = useMemo((): MatchSetup => ({ mode: 'online', seats, humans: seats, difficulty: 'normal' }), [seats]);
  const newRoom = useCallback(() => { location.hash = `#new=${seats}`; }, [seats]);

  if (failure) return <Failure locale={locale} failure={failure} />;
  if (!room || me === null || !online || !inviteUrl) return <Connecting />;
  if (open.length) {
    const filled = Array.from({ length: room.seats }, (_, i) => i).filter((i) => !open.includes(i));
    return <Waiting seats={room.seats} filled={filled} me={me} url={inviteUrl} home={home} />;
  }
  return <MancalaPlay locale={locale} setup={match} online={online} onHome={() => router.push(home)} onAgain={newRoom} />;
}

/** 一塊小圓木盤：14 個坑照盤面的顏色排（頂端惡魔、底端天使），連線中有種子一顆一顆播過去 */
function MiniBoard({ sowing = false, children }: { sowing?: boolean; children?: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  // 播種：從惡魔的下一格開始，每格落一顆（座位色輪流），繞完一圈停一下、整把收起來，再來一次
  useEffect(() => {
    const root = ref.current;
    if (!sowing || !root || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const step = 0.052;
    const anims = [...root.querySelectorAll<HTMLElement>('[data-seed]')].map((el, i) => el.animate([
      { opacity: 0, scale: '0.3', offset: 0 },
      { opacity: 0, scale: '0.3', offset: i * step },
      { opacity: 1, scale: '1.3', offset: i * step + 0.03 },
      { opacity: 1, scale: '1', offset: i * step + 0.05 },
      { opacity: 1, scale: '1', offset: 0.86 },
      { opacity: 0, scale: '0.6', offset: 0.94 },
      { opacity: 0, scale: '0.6', offset: 1 },
    ], { duration: 3800, iterations: Infinity, easing: 'ease-out' }));
    return () => anims.forEach((a) => a.cancel());
  }, [sowing]);

  return (
    <div ref={ref} aria-hidden="true" className="relative aspect-square w-[clamp(150px,44vw,196px)] rounded-full [container-type:inline-size]" style={{ background: WOOD }}>
      <svg viewBox="0 0 100 100" className="absolute inset-0 size-full">
        <circle cx={50} cy={50} r={37} fill="none" stroke={BRASS} strokeOpacity={0.45} strokeWidth={0.8} />
      </svg>
      {Array.from({ length: CELLS }, (_, cell) => {
        const a = ((-90 + (cell * 360) / CELLS) * Math.PI) / 180;
        const colour = CELL_COLOUR[cell];
        const seed = (cell - 1 + CELLS) % CELLS;
        return (
          <span key={cell} className="absolute grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full"
            style={{
              left: `${50 + 37 * Math.cos(a)}%`, top: `${50 + 37 * Math.sin(a)}%`, width: '14cqw', height: '14cqw',
              background: colour !== null ? DISH_BG[colour] : cell === DEVIL ? INK : CLOTH_LIGHT,
              boxShadow: `inset 0 0 0 1cqw ${BRASS}`,
            }}>
            {sowing && (
              <span data-seed className="block rounded-full opacity-0"
                style={{ width: '6.5cqw', height: '6.5cqw', background: seatLook(seed % 7).bg, boxShadow: `0 0 0 0.8cqw ${CLOTH_LIGHT}` }} />
            )}
          </span>
        );
      })}
      {children && <div className="absolute inset-[27%] flex flex-col items-center justify-center text-center" style={{ color: CLOTH_LIGHT }}>{children}</div>}
    </div>
  );
}

/** 連線中：小木盤上一顆一顆播種 */
function Connecting() {
  const g = useGameText();
  return (
    <MancalaFrame className="items-center justify-center px-5 py-10">
      <div className="flex flex-col items-center gap-6" role="status">
        <MiniBoard sowing />
        <p className="text-base font-black">{g.play.connecting}</p>
      </div>
    </MancalaFrame>
  );
}

function Failure({ locale, failure }: { locale: Locale; failure: TurnRoomFailure }) {
  const g = useGameText();
  const copy = {
    noRoom: [g.play.noRoom, g.play.noRoomBody],
    roomFull: [g.play.roomFull, g.play.roomFullBody],
    connectFail: [g.play.connectFail, g.play.connectFailBody],
    badLink: [g.play.badLink, g.play.badLinkBody],
  }[failure];
  const retry = failure === 'connectFail';
  return (
    <MancalaFrame className="items-center justify-center px-5 py-10">
      <div className="flex w-full max-w-[420px] flex-col items-center gap-5 text-center">
        {/* 空的木盤：一顆子都沒有 */}
        <div className="opacity-80"><MiniBoard /></div>
        <h1 className="text-[clamp(1.45rem,6vw,2rem)] font-black leading-tight">{copy[0]}</h1>
        <p className="text-sm leading-relaxed text-ink-soft">{copy[1]}</p>
        <div className="mt-1 flex w-full flex-col gap-2.5">
          {retry && (
            <button type="button" onClick={() => window.location.reload()} className="mcl-plaque h-12 text-base font-black">{g.play.reload}</button>
          )}
          <Link href={localePath(locale, BALANCE_MANCALA)} className={`${retry ? 'mcl-cloth' : 'mcl-plaque'} grid h-12 place-items-center text-base font-black`}>
            {g.play.backHome}
          </Link>
        </div>
      </div>
    </MancalaFrame>
  );
}

/**
 * 等人：一張圓木桌（盤面那塊木頭），座位照輪序從頂端順時針排 —— 坐下的是那個座位的子，空位是黃銅虛線圈、輕輕浮著。
 * 自己那個位子多一圈自己座位色的框，中間留一道縫（框外再一圈亮布色的細線：炭黑、褐色的座位在木頭上才看得到框）。
 * 桌子中間寫坐了幾個。下面是標題、還差幾個人、邀請連結（桌機複製、手機系統分享）。
 */
function Waiting({ seats, filled, me, url, home }: { seats: number; filled: Seat[]; me: Seat; url: string; home: string }) {
  const t = useTextTable(TEXT);
  const g = useGameText();
  const canShare = useWebShare();
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(url); } catch { return; }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };
  const disc = '17cqw';
  const gap = `calc(${disc} * 0.09)`;

  return (
    <MancalaFrame className="items-center justify-center px-5 py-8">
      <div className="flex w-full max-w-[440px] flex-col items-center gap-6 text-center">
        <p className="text-sm font-bold text-ink-soft">{t.title} · {t.modeOnline}</p>

        <div className="relative aspect-square w-[clamp(210px,62vw,280px)] rounded-full [container-type:inline-size]" style={{ background: WOOD }}
          role="list" aria-live="polite">
          <svg viewBox="0 0 100 100" className="absolute inset-0 size-full" aria-hidden="true">
            <circle cx={50} cy={50} r={36} fill="none" stroke={BRASS} strokeOpacity={0.45} strokeWidth={0.6} />
          </svg>
          {Array.from({ length: seats }, (_, i) => {
            const a = ((-90 + (i * 360) / seats) * Math.PI) / 180;
            const here = filled.includes(i);
            const name = fill(t.player, { seat: letterOf(i) });
            return (
              <div key={i} role="listitem" aria-label={`${name}: ${here ? t.seated : t.emptySeat}`}
                className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${50 + 36 * Math.cos(a)}%`, top: `${50 + 36 * Math.sin(a)}%` }}>
                {here ? (
                  <span className="block rounded-full"
                    style={i === me ? { boxShadow: `0 0 0 calc(${gap} + 2.5px) ${WOOD}, 0 0 0 calc(${gap} + 6px) ${seatLook(i).bg}, 0 0 0 calc(${gap} + 7.5px) ${CLOTH_LIGHT}` } : undefined}>
                    <PieceDisc seat={i} size={disc} />
                  </span>
                ) : (
                  <span aria-hidden="true" className="grid place-items-center rounded-full border-2 border-dashed font-black motion-safe:animate-[mcl-wait_2.2s_ease-in-out_infinite]"
                    style={{ width: disc, height: disc, background: WOOD, borderColor: BRASS, color: BRASS, fontSize: `calc(${disc} * 0.5)`, animationDelay: `${-i * 0.3}s` }}>
                    {letterOf(i)}
                  </span>
                )}
              </div>
            );
          })}
          <div className="absolute inset-[28%] flex flex-col items-center justify-center" style={{ color: CLOTH_LIGHT }} aria-hidden="true">
            <p className="font-black tabular-nums leading-none" style={{ fontSize: '15cqw', color: BRASS }}>
              {filled.length}<span style={{ opacity: 0.55 }}>/{seats}</span>
            </p>
            <p className="mt-[2.5cqw] font-bold" style={{ fontSize: '5.2cqw' }}>{t.seated}</p>
          </div>
        </div>

        <div>
          <h1 className="text-[clamp(1.6rem,6.5vw,2.1rem)] font-black leading-tight">{t.inviteHeading}</h1>
          <p className="mt-2 text-sm leading-relaxed">{fill(t.inviteBody, { n: seats - filled.length, total: seats })}</p>
        </div>

        <div className="flex w-full flex-col gap-2.5">
          <div className="mcl-cloth flex items-center gap-2 py-2.5 pl-3 pr-1.5 text-left">
            <span className="flex-1 select-all truncate font-mono text-sm">{url}</span>
            <button type="button" onClick={copy} aria-label={copied ? g.share.copied : g.share.copyAria}
              className="mcl-plaque is-small flex shrink-0 items-center gap-1.5 px-3 py-2 text-sm font-black">
              {copied ? <LuCheck aria-hidden="true" /> : <LuCopy aria-hidden="true" />}{copied ? g.share.copied : g.share.copy}
            </button>
          </div>
          {canShare && (
            <button type="button" onClick={() => { share({ title: t.title, text: t.shareText, url }).catch(() => {}); }}
              className="mcl-plaque flex h-12 w-full items-center justify-center gap-2 px-4 text-base font-black">
              <LuShare2 className="text-lg" aria-hidden="true" />{g.share.share}
            </button>
          )}
        </div>
        <Link href={home} className="mcl-link text-sm">{g.play.backHome}</Link>
      </div>
    </MancalaFrame>
  );
}
