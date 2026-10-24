'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { LuCheck, LuCopy, LuHouse, LuShare2 } from 'react-icons/lu';
import { useHashSession } from '@/hook/useTurnRoom';
import { useWebShare, share } from '@/hook/useWebShare';
import { useGameText } from '@/i18n/LocaleProvider';
import { fill, useTextTable } from '@/i18n/gameText';
import { localePath, type Locale } from '@/i18n/locales';
import { TIME_AUCTION } from '@/i18n/routes';
import { MAX_SEATS, MODES, ONLINE_MIN_SEATS, type Mode } from '@/games/time-auction/engine';
import { TEXT } from '@/games/time-auction/text';
import { auctionSeatKey, type AuctionRoom } from '@/types/auctionRoom';
import AuctionOnlinePlay from './AuctionOnlinePlay';
import { KEY_ART, roundBtn } from './theme';
import TauFrame from './TauFrame';
import { parseAuctionHash, useAuctionRoom } from './useAuctionRoom';

/**
 * /time-auction/online：邀請朋友來拍賣。流程照尼泊爾虎棋的 BaghOnline，房間是這款自己的 auctionRooms（同時出價，
 * 不能用輪流下的 turnRooms；結構見 types/auctionRoom.ts、流程見 useAuctionRoom.ts）：
 * - `#new=quick-4` 在這裡開房（模式-人數），開好用 replaceState 換成 `#roomId=…`
 * - `#roomId=…` 進房：已經坐著就接回（重整）、空位就坐、滿了就說滿了
 * - 還有空位：等人畫面放連結（手機是系統分享，桌機是複製）、看得出幾個位子、哪幾個還空著
 * - 坐滿：AuctionOnlinePlay，整場由房間裡的按鍵時間推出來（games/time-auction/online.ts）
 *
 * 連線中、等人、失敗三個畫面都是這款自己的拍賣傳單（TauFrame 的紙與紅色牛津角框、Cruikshank 的拍賣場、
 * 紅色鉛字版塊與墨色雙線的票），不用 Wall Go 的紙色面板與紅藍棋子，也不抄虎羊棋。
 */
export default function AuctionOnline({ locale }: { locale: Locale }) {
  const session = useHashSession();
  if (!session) return null;
  return <Session key={session.n} locale={locale} hash={session.hash} />;
}

function Session({ locale, hash }: { locale: Locale; hash: string }) {
  const target = useMemo(() => parseAuctionHash(hash), [hash]);
  const { failure, me, room, open, inviteUrl } = useAuctionRoom(target);
  const home = localePath(locale, TIME_AUCTION);

  // 房間的模式、人數不認得（安全規則擋得住，這裡是保險）：當作連線壞了，不畫出一場算不出來的拍賣
  const broken = !!room && (!(room.mode in MODES) || !(room.seats >= ONLINE_MIN_SEATS && room.seats <= MAX_SEATS));
  if (failure || broken) return <Failure failure={failure ?? 'connectFail'} home={home} />;
  if (me === null || !room || !inviteUrl) return <Connecting />;
  if (open.length > 0) return <Waiting room={room} me={me} url={inviteUrl} home={home} />;
  // 再來一局＝用同一個模式與人數再開一間房（換 hash 就是新的一場），連結要重新傳
  const again = () => { location.hash = `#new=${room.mode}-${room.seats}`; };
  return <AuctionOnlinePlay locale={locale} room={room} me={me} home={home} onAgain={again} />;
}

/** 拍賣場的版畫：三個畫面最上面都是它（同首頁主視覺，裁掉下面的說明文字） */
function Art({ className = '' }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- 靜態匯出，不需要 next/image
    <img src={KEY_ART} alt="" aria-hidden="true" width={818} height={462}
      className={`h-[clamp(6.5rem,19svh,12rem)] w-full rounded-sm object-cover ${className}`} />
  );
}

/** 連線中：拍賣場的版畫底下，三枚得標的金幣輪流跳一下 */
function Connecting() {
  const g = useGameText();
  return (
    <TauFrame className="items-center justify-center px-5 py-8">
      <div className="flex w-full max-w-[380px] flex-col items-center gap-6" role="status">
        <Art />
        <div className="flex items-center gap-3" aria-hidden="true">
          {[0, 1, 2].map((i) => <span key={i} className="tau-coin" style={{ animationDelay: `${i * 0.18}s` }} />)}
        </div>
        <p className="text-base font-black">{g.play.connecting}</p>
      </div>
    </TauFrame>
  );
}

type FailureKind = 'noRoom' | 'roomFull' | 'connectFail' | 'badLink';

/** 連不上、找不到房、房滿了、連結壞了：版畫淡掉，底下一段說明與出口（連不上才有「重新整理」） */
function Failure({ failure, home }: { failure: FailureKind; home: string }) {
  const g = useGameText();
  const copy = {
    noRoom: [g.play.noRoom, g.play.noRoomBody],
    roomFull: [g.play.roomFull, g.play.roomFullBody],
    connectFail: [g.play.connectFail, g.play.connectFailBody],
    badLink: [g.play.badLink, g.play.badLinkBody],
  }[failure];
  return (
    <TauFrame className="items-center justify-center px-5 py-8">
      <div className="flex w-full max-w-[400px] flex-col items-center gap-5 text-center">
        <Art className="opacity-45" />
        <div className="w-full border-y-[3px] border-double border-[#35331c]/60 px-2 py-4">
          <h2 className="text-[clamp(1.4rem,6vw,1.9rem)] font-black leading-tight">{copy[0]}</h2>
          <p className="mt-2 text-sm font-bold leading-relaxed text-ink-soft">{copy[1]}</p>
        </div>
        <div className="flex w-full flex-col gap-2.5">
          {failure === 'connectFail' && (
            <button type="button" onClick={() => window.location.reload()} className="tau-press h-12 w-full text-base font-black">{g.play.reload}</button>
          )}
          <Link href={home} className={`${failure === 'connectFail' ? 'tau-lot' : 'tau-press'} grid h-12 w-full place-items-center text-base font-black`}>
            {g.play.backHome}
          </Link>
        </div>
      </div>
    </TauFrame>
  );
}

/**
 * 等朋友入座：整頁都是這一件事，所以不是彈窗。
 * 版畫底下是標題與說明，接著一排競買人名片 —— 坐了人的寫「已入座」、自己那張是紅框（不寫「你」）、空位是一張輕輕浮著的虛線票；
 * 再下面是邀請連結（桌機複製、手機系統分享）。
 */
function Waiting({ room, me, url, home }: { room: AuctionRoom; me: number; url: string; home: string }) {
  const t = useTextTable(TEXT);
  const g = useGameText();
  const canShare = useWebShare();
  const [copied, setCopied] = useState(false);
  const modeName = (m: Mode) => (m === 'quick' ? t.modeQuick : t.modeShow);
  const seats = Array.from({ length: room.seats }, (_, i) => i);

  const copy = async () => {
    try { await navigator.clipboard.writeText(url); } catch { return; }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <TauFrame className="items-center px-4 pb-6 pt-3">
      <div className="flex w-full max-w-[440px] items-center">
        <Link href={home} aria-label={t.home} className={roundBtn}><LuHouse aria-hidden="true" /></Link>
      </div>
      <main className="mt-2 flex w-full max-w-[440px] flex-1 flex-col items-center justify-center gap-5 text-center">
        <Art />
        <div className="w-full">
          <p className="tau-head text-ink-soft">{t.title} · {t.onlineTitle}</p>
          <h1 className="mt-2 text-[clamp(1.6rem,6.5vw,2.1rem)] font-black leading-tight">{t.waitHeading}</h1>
          <p className="mt-2 text-sm font-bold leading-relaxed">{fill(t.waitBody, { n: room.seats })}</p>
          <p className="mt-1 text-xs font-bold text-ink-soft">{modeName(room.mode)} · {room.mode === 'quick' ? t.modeQuickNote : t.modeShowNote}</p>
        </div>

        <ul className={`grid w-full gap-2 ${room.seats <= 2 ? 'grid-cols-2' : room.seats === 4 ? 'grid-cols-2' : 'grid-cols-3'}`} aria-live="polite">
          {seats.map((i) => {
            const taken = !!room.players?.[auctionSeatKey(i)];
            return (
              <li key={i} className={`flex items-baseline gap-1.5 px-3 py-2.5 text-left ${taken ? `tau-bidder ${i === me ? 'is-me' : ''}` : 'tau-seat-empty'}`}
                style={taken ? undefined : { animationDelay: `${i * 0.25}s` }}>
                <span aria-hidden="true" className="tau-display shrink-0 text-[11px] italic text-ink-soft">No.{i + 1}</span>
                <span className={`truncate text-xs font-black ${taken ? '' : 'text-ink-soft'}`}>
                  {taken ? t.seatTaken : t.seatEmpty}
                </span>
              </li>
            );
          })}
        </ul>

        <div className="flex w-full flex-col gap-2.5">
          <div className="tau-box flex items-center gap-2 p-1.5 pl-3 text-left">
            <span className="flex-1 select-all truncate font-mono text-sm">{url}</span>
            <button type="button" onClick={copy} aria-label={copied ? g.share.copied : g.share.copyAria}
              className="tau-press flex shrink-0 items-center gap-1.5 px-3 py-2 text-sm font-black tracking-normal">
              {copied ? <LuCheck aria-hidden="true" /> : <LuCopy aria-hidden="true" />}{copied ? g.share.copied : g.share.copy}
            </button>
          </div>
          {canShare && (
            <button type="button" onClick={() => share({ title: t.title, text: t.shareText, url }).catch(() => {})}
              className="tau-press flex h-12 w-full items-center justify-center gap-2 px-4 text-base font-black tracking-normal">
              <LuShare2 className="text-lg" aria-hidden="true" />{g.share.share}
            </button>
          )}
        </div>
        <Link href={home} className="tau-hand text-sm">{g.play.backHome}</Link>
      </main>
    </TauFrame>
  );
}
