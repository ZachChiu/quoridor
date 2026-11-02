'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GiExitDoor, GiRuleBook, GiTatteredBanner } from 'react-icons/gi';
import { LuBellRing, LuCircleHelp, LuFlag, LuHouse, LuRotateCcw, LuUndo2, LuVolume2, LuVolumeX, LuWifiOff } from 'react-icons/lu';
import Modal from '@/components/Modal';
import { ShareResultModal, useShareCard } from '@/components/ShareResultModal';
import { useGameText, useLocale, useMessages } from '@/i18n/LocaleProvider';
import { fill, useTextTable } from '@/i18n/gameText';
import { localePath } from '@/i18n/locales';
import { BLIND_GOMOKU } from '@/i18n/routes';
import { useSound } from '@/hook/useSound';
import { useLeaveGuard } from '@/hook/useLeaveGuard';
import { shakeElement } from '@/hook/useRoomSignals';
import { track } from '@/utils/analytics';
import { TEXT } from '@/games/blind-gomoku/text';
import {
  COLORS, applyMove, createGame, isLegal, lastColor, other, play, pointName, undo,
  type GomokuState, type Move, type Point, type Side, type StoneColor,
} from '@/games/blind-gomoku/engine';
import { GomokuBoard, Ghost, revealMs } from './GomokuBoard';
import { ColorPicker } from './ColorPicker';
import { RulesStepsPaged } from './RulesSteps';
import { SideFace, colorName } from './Stone';
import { GMK_BAND, GMK_PANEL } from './palette';
import GomokuFrame from './GomokuFrame';
import { useGomokuAi } from './useGomokuAi';
import { PLAY_GRID } from './deskLayout';
import { colorString, playEnd, playNudge, playPick, playReveal, playStone, stringOf } from './sounds';
import { drawGomokuCard } from './shareCard';
import type { GomokuMode } from './modeHash';

/**
 * 連線（邀請朋友）：局面由房間推導（GomokuOnline 持有），這裡只負責畫、只在輪到自己時能下，下好交給 onMove。
 * 連線局沒有悔棋與重來（要兩個人都同意，先不做）；結算的「再來一局」是再開一間房（換 hash）。
 */
export type OnlineMode = {
  opponent: 'online';
  blind: boolean;
  /** 自己執哪一方 */
  side: Side;
  game: GomokuState;
  onMove: (m: Move) => void;
  newRoom: () => void;
  /** 在線狀態、催一下、投降（GomokuOnline 的 useRoomSignals，同九子棋）：away＝斷線滿 3 秒的對方 */
  away: Side | null; selfOffline: boolean;
  canNudge: boolean; nudged: boolean; nudge: () => void;
  /** 被催：數字變了就抖一下棋盤、撥兩下弦；nudgeFrom 是誰催的 */
  shake: number; nudgeFrom: Side | null;
  /** 房間裡投降的那一方；resign 寫進房間 */
  resigned: Side | null; resign: () => void;
};

/**
 * 盲眼五子棋的對局畫面。六種模式共用：盲棋／一般 × 對電腦／兩人同機／連線。
 *
 * - 手機：上方一排小圓鈕（首頁、聲音、標題、重來、說明），下面兩方的分段條與狀態（固定兩行高，提示一出一沒棋盤不跳）、棋盤、選色盤與「下子」。
 *   悔棋（只有一般模式）放在「下子」旁邊：上方加了聲音鈕之後再放悔棋，標題會被擠成「盲五…」
 *   390×844 一個畫面放得下，不捲動
 * - 桌機（lg）：棋盤在左，右邊一欄放狀態、選色盤與有字的按鈕
 *
 * 盲棋的規矩（docs/games-deep-s1.md §3 的建議）：沒有悔棋、沒有「停在子上偷看黑白」；
 * 電腦（連線是對方）落子那顆亮一下就淡掉；結束時依下子順序把每顆子翻開，翻完才畫連線、跳結算。
 * 連線的盲棋兩邊畫面一樣只畫顏色、各自選色（沒有「跟你上一手同色」，那是節目裡 AI 的規矩），也一樣沒有閒置動作。
 *
 * 聲音（sounds.ts）：每個顏色是一根伽倻琴的弦，AI 跟色時彈的就是你剛才那根；翻開時刮過整排弦。
 * 結算就是分享圖（shareCard.ts，跟 Wall Go、尼泊爾虎棋一樣的做法），關掉之後停在翻開的終局盤面上。
 */
export default function GomokuPlay({ mode, onMenu }: { mode: GomokuMode | OnlineMode; onMenu: () => void }) {
  const t = useTextTable(TEXT);
  const ui = useMessages().ui;
  const g = useGameText();
  const locale = useLocale();
  const { prefs: soundPrefs, setPrefs: setSoundPrefs } = useSound();
  const [localGame, setGame] = useState<GomokuState>(createGame);
  const online = mode.opponent === 'online' ? mode : null;
  /** 本機、對電腦的投降（連線的在房間裡）：局面直接蓋上勝方，之後誰都不能再走 */
  const [localResigned, setLocalResigned] = useState<Side | null>(null);
  const resignedSide = online ? online.resigned : localResigned;
  const played = online ? online.game : localGame;
  const game = useMemo(() => (resignedSide && !played.winner ? { ...played, winner: other(resignedSide), line: null } : played), [played, resignedSide]);
  const [resignOpen, setResignOpen] = useState(false);
  const boardRef = useRef<HTMLDivElement>(null);
  const [color, setColor] = useState<StoneColor>(COLORS[0]);
  const [aim, setAim] = useState<Point | null>(null);
  /** 盲棋結算：子翻到黑白那面了 */
  const [flipped, setFlipped] = useState(false);
  /** 結束的動畫跑完了：畫連線、跳結算 */
  const [settled, setSettled] = useState(false);
  const [resultOpen, setResultOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  const vsAi = mode.opponent === 'ai';
  const level = mode.opponent === 'ai' ? mode.level : null;
  const { blind } = mode;
  const { ask, cancel } = useGomokuAi(vsAi);
  const aiTurn = vsAi && !game.winner && game.turn === 'white';
  // 連線時輪到對方：跟電腦的回合一樣不能動
  const theirTurn = !!online && !game.winner && game.turn !== online.side;
  const canPlay = !game.winner && !aiTurn && !theirTurn;
  // 下到一半離開先問：房子鈕、瀏覽器返回鍵、電腦版關分頁（hook/useLeaveGuard.ts）。連線局一開打就算，其他下過一手才算
  const leave = useLeaveGuard({ live: !game.winner, inProgress: !game.winner && (!!online || game.moves.length > 0) });
  const toMenu = () => leave.request(onMenu);

  // 電腦的回合：問 Worker，回來時局面沒變才下（中途重來、悔棋的答案丟掉）
  useEffect(() => {
    if (!aiTurn || !level) return;
    const asked = game;
    ask(asked, level, (m) => setGame((g) => (g === asked && isLegal(g, m.at) ? play(g, m) : g)));
    return cancel;
  }, [aiTurn, level, game, ask, cancel]);

  // 分出勝負：盲棋先等最後一顆子落定、亮一下，再依序翻開；翻完才畫線、跳結算
  // 聲音跟著走：翻開時刮過整排弦，連線畫出來時贏／輸／和局（對電腦、連線看你贏沒有；兩人同機有人贏就是贏的那一句）
  const mySide: Side | null = online ? online.side : vsAi ? 'black' : null;
  const endSound = game.winner === 'draw' ? 'draw' : mySide && game.winner !== mySide ? 'lose' : 'win';
  useEffect(() => {
    if (!game.winner) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timers: number[] = [];
    const settle = () => { setSettled(true); setResultOpen(true); playEnd(endSound); };
    if (blind) {
      const flipAt = reduce ? 0 : 400;
      timers.push(window.setTimeout(() => { setFlipped(true); playReveal(); }, flipAt));
      timers.push(window.setTimeout(settle, flipAt + (reduce ? 0 : revealMs(game.moves.length)) + 450));
    } else {
      timers.push(window.setTimeout(settle, 800));
    }
    return () => timers.forEach((id) => window.clearTimeout(id));
  }, [game.winner, game.moves.length, blind, endSound]);

  // 落子的聲音：剛好多一手才響（悔棋、重來不響）。盲棋的音高只看顏色、兩方一樣，聽不出是誰的子
  const heard = useRef(game.moves.length);
  useEffect(() => {
    const prev = heard.current;
    heard.current = game.moves.length;
    if (game.moves.length !== prev + 1) return;
    const m = game.moves[game.moves.length - 1];
    const stone = game.board[m.at];
    if (stone) playStone(stringOf(stone, blind));
  }, [game, blind]);

  // 被催（連線）：棋盤抖一下、撥兩下最高的弦（震動在 useRoomSignals）
  const shake = online ? online.shake : 0;
  useEffect(() => {
    if (!shake) return;
    shakeElement(boardRef.current);
    playNudge();
  }, [shake]);

  // GA：看「狀態轉變」，不看按鈕 —— 連線一次補好幾手、重整接回都不算開局／結束（同九子棋、虎棋）
  const gaMode = online ? 'online' : vsAi ? 'solo' : 'local';
  const gaBase = useMemo(() => ({ game: 'blind-gomoku', mode: gaMode, players: 2, difficulty: level ?? undefined } as const), [gaMode, level]);
  const gaSeen = useRef({ moves: game.moves.length, winner: game.winner });
  useEffect(() => {
    const prev = gaSeen.current;
    gaSeen.current = { moves: game.moves.length, winner: game.winner };
    if (prev.moves === 0 && game.moves.length > 0) track('game_start', gaBase);
    if (!prev.winner && game.winner) {
      const result = game.winner === 'draw' ? 'tie' : !mySide ? 'decided' : game.winner === mySide ? 'win' : 'lose';
      track('game_end', { ...gaBase, result, winner: game.winner, ended: resignedSide ? 'resign' : 'natural', turns: game.moves.length });
    }
  }, [game, gaBase, mySide, resignedSide]);

  const pickColor = (c: StoneColor) => { setColor(c); playPick(colorString(c)); };

  const place = useCallback((p: Point) => {
    if (!canPlay || !isLegal(game, p)) return;
    const m = { at: p, color: blind ? color : COLORS[0] };
    if (online) online.onMove(m);
    else setGame(applyMove(game, m));
    setAim(null);
  }, [canPlay, game, blind, color, online]);

  const restart = () => {
    cancel();
    setGame(createGame());
    setLocalResigned(null);
    setAim(null);
    setFlipped(false);
    setSettled(false);
    setResultOpen(false);
  };
  // 連線的再來一局是再開一間房
  const again = () => {
    track('game_restart', gaBase);
    if (online) online.newRoom(); else restart();
  };
  // 悔棋只有一般模式、不連線；對電腦時退到「又輪到你」（電腦已經回了就退兩手）
  const undoSteps = vsAi ? 2 : 1;
  const canUndo = !blind && !online && canPlay && game.moves.length >= undoSteps;
  const doUndo = () => { setGame(undo(game, undoSteps)); setAim(null); };
  // 投降：本機是輪到的那方、對電腦是自己（黑）、連線寫進房間
  const resign = () => {
    if (game.winner) return;
    if (online) { online.resign(); return; }
    cancel();
    setLocalResigned(vsAi ? 'black' : game.turn);
    setAim(null);
  };

  // 連線的字跟兩人同機一樣寫黑方／白方，不寫「你」「對方」（太直白，Zach 對 Wall Go 選過用記號不用字）：
  // 自己是哪一方由兩方那條分段條上的實線框標出來（見 segment）
  const resultTitle = game.winner === 'draw' ? t.draw
    : vsAi ? (game.winner === 'black' ? t.youWin : t.youLose)
    : game.winner === 'black' ? t.blackWins : t.whiteWins;
  const resultBody = resignedSide && game.winner !== 'draw' ? fill(t.resignBody, { side: resignedSide === 'black' ? t.black : t.white })
    : game.winner === 'draw' ? t.drawBody
    : vsAi ? fill(game.winner === 'black' ? t.winBodyYou : t.winBodyAi, { n: game.moves.length })
    : fill(t.winBodySide, { side: game.winner === 'black' ? t.black : t.white, n: game.moves.length });
  const status = game.winner ? (settled || !blind ? resultTitle : t.revealing)
    : aiTurn ? t.thinking
    : vsAi ? t.yourTurn
    : game.turn === 'black' ? t.blackTurn : t.whiteTurn;
  // 連線的提示（跟 Wall Go、九子棋同一套文案）：自己斷線最要緊，再來是對方斷線、被催
  const away = online && !game.winner ? online.away : null;
  const notice = !online || game.winner ? ''
    : online.selfOffline ? g.play.reconnecting
    : away ? fill(g.play.away, { who: away === 'black' ? t.black : t.white })
    : online.nudgeFrom ? fill(g.nudge.received, { who: online.nudgeFrom === 'black' ? t.black : t.white }) : '';
  const hint = game.winner ? (settled && blind ? t.revealBody : '')
    : online ? notice
    : blind ? (vsAi ? t.aiCopies : t.localBlindHint)
    : vsAi ? t.youAreBlack : '';
  const moveNo = fill(t.moveN, { n: game.winner ? game.moves.length : game.moves.length + 1 });
  const modeLabel = level
    ? `${blind ? t.blindAi : t.classicAi} · ${t.levels[level].name}`
    : `${online ? t.online : t.local} · ${blind ? t.blind : t.classic}`;
  // 翻完、畫好線就算結束：結算開著時背後也是結束的樣子（11/2 Zach：先前綁著「結算沒開」，一打開結算，後面的按鈕區就跳回下棋的狀態）
  const ended = !!game.winner && settled;
  /** 標題大約幾個字寬（中日韓一個字 1、粗體的拉丁與泰文約 0.7），手機上方一排用它決定字級 */
  const titleEm = Array.from(t.title).reduce((n, ch) => n + (ch.charCodeAt(0) >= 0x2e80 ? 1 : ch === ' ' ? 0.3 : 0.7), 0).toFixed(2);

  const describe = (p: Point) => {
    const s = game.board[p];
    const name = pointName(p).toUpperCase();
    if (!s) return `${name} ${t.empty}`;
    if (blind && !flipped) return `${name} ${colorName(t, s.color)}`;
    return `${name} ${s.side === 'black' ? t.stoneBlack : t.stoneWhite}`;
  };

  // 結算就是分享圖（shareCard.ts）：翻開的終局盤面、連成的五子、誰贏、第幾手
  const card = {
    board: game.board, line: game.line, winner: game.winner ?? 'draw', blind, lastColor: lastColor(game),
    text: {
      kicker: `${g.champion.matchOver} · ${modeLabel}`,
      name: t.title,
      sub: t.subtitle,
      title: resultTitle,
      body: resultBody,
      brand: t.title,
      from: fill(g.share.cardFrom, { show: t.showName }),
      host: new URL(process.env.SITE_URL || 'https://quoridorgame.com').host,
    },
  } as const;
  const font = typeof document === 'undefined' ? 'system-ui' : getComputedStyle(document.documentElement).getPropertyValue('--font-app').trim() || 'system-ui';
  const share = useShareCard({
    isOpen: resultOpen,
    draw: drawGomokuCard({ ...card, font }),
    contentKey: JSON.stringify({ ...card, board: game.moves.length }),
    fileName: 'blind-gomoku',
    homePath: localePath(locale, BLIND_GOMOKU),
    campaign: 'blind-gomoku',
    // 站名前面用這款自己的 favicon，不是平台的骰子惡魔（11/1 Zach 看到結算圖是骰子惡魔）
    icon: '/icons/blind-gomoku-192.png',
    // 只留 9:16（Zach 10/24，跟尼泊爾虎棋一樣）：只給一種，比例切換就不會出現
    layouts: ['story'],
    fonts: [
      { font: `900 40px ${font}`, text: card.text.name + card.text.title + card.text.brand },
      { font: `700 40px ${font}`, text: card.text.kicker + card.text.sub + card.text.body + card.text.from },
    ],
  });

  // 按鈕是一塊塊布（globals.css 的 .gmk-*）：角落的小鈕與次要動作是半透明的苧麻布，主要動作是拼起來的青綠布
  const round = 'gmk-patch is-ramie grid size-11 shrink-0 place-items-center text-xl text-ink-soft disabled:opacity-35';
  const wide = 'gmk-patch is-ramie flex h-12 items-center justify-center gap-2 text-sm font-black disabled:opacity-35';
  const ink = 'gmk-patch is-pieced flex h-12 items-center justify-center gap-2 text-sm font-black active:scale-[0.98] disabled:opacity-35';

  // 對方斷線（滿 3 秒）那半蓋一層灰、正中一個斷掉的 Wi‑Fi（同九子棋、虎棋）
  const sideName = (s: Side) => (s === 'black' ? t.black : t.white);
  const awayCover = (
    <span className="gmk-away-cover" role="img" aria-label={g.status.away}><LuWifiOff aria-hidden="true" /></span>
  );
  const turnSide = game.winner ? (game.winner === 'draw' ? null : game.winner) : game.turn;

  // 結算關掉之後留在翻開的盤面上看，狀態那一塊換成叫回結算的鈕（同尼泊爾虎棋；11/2 Zach：「結束點不出結尾畫面」）
  const reopen = ended && (
    <button type="button" onClick={() => setResultOpen(true)} className={`${wide} w-full px-4`}>
      {game.winner !== 'draw' && <SideFace side={game.winner!} className="size-5 shrink-0" />}
      {resultTitle} · {g.champion.seeResult}
    </button>
  );

  // 自己是哪一方：連線看座位、對電腦是黑。畫面上不寫「你／AI」，用實線框標（11/2 Zach：對電腦時寫了「你」）
  const mine = (s: Side) => (online ? online.side === s : vsAi ? s === 'black' : false);
  // 自己那半（連線、對電腦）的縫線換成 2px 實線（11/2 Zach 從實線框、底下布邊、名字後的小人三種挑了實線框）：
  // 輪到自己時在青綠布上是白絲，輪到對方時是黑絲；跟選色盤選中的那格同一個記號
  const markBox = (s: Side, lit: boolean) => (!mine(s) ? ''
    : lit ? '![outline-color:#f2e4c9] ![outline-style:solid] ![outline-width:2px]' : '![outline-color:#2a2525] ![outline-style:solid] ![outline-width:2px]');
  // 兩方是一條分段條（11/2 Zach 從計分牌、上下夾、分段條挑了分段條），手機與桌機同一條，輪到的那半是拼起來的青綠布；名字只有一行，黑白兩塊才對得齊
  const segment = (tall: boolean) => (
    <div className="gmk-patch is-ramie grid grid-cols-2 gap-1 p-1 ![outline-offset:-3px]">
      {(['black', 'white'] as const).map((s) => {
        const lit = turnSide === s;
        return (
          <div key={s} className={`relative flex items-center justify-center gap-2 rounded-[2px] font-black ![outline-offset:-4px] ${tall ? 'h-14 text-base' : 'h-10 text-sm'} ${
            lit ? 'gmk-patch is-pieced ![--corner:14px]' : 'text-ink-soft'} ${markBox(s, lit)} ${away === s ? 'gmk-away [--away-size:1.1rem]' : ''}`}>
            <SideFace side={s} className={`${tall ? 'size-7' : 'size-6'} shrink-0`} />
            <span>{sideName(s)}</span>
            {away === s && awayCover}
          </div>
        );
      })}
      {(online || vsAi) && <span className="sr-only">{mine('black') ? t.youAreBlack : t.youAreWhite}</span>}
    </div>
  );
  const sideCards = segment(true);
  /** 手機：一行狀態＋提示，固定兩行高 —— 提示一出一沒，棋盤不跟著跳 */
  const line = (
    <div className="mt-1.5 flex h-8 items-start justify-between gap-2 text-xs font-bold leading-4 text-ink-soft" aria-live="polite">
      <p className="line-clamp-2 min-w-0"><span className="text-ink font-black">{status}</span>{hint && <> · {hint}</>}</p>
      <span className="shrink-0 font-black tabular-nums">{moveNo}</span>
    </div>
  );

  const picker = blind && (
    <ColorPicker value={color} onChange={pickColor} disabled={!canPlay} label={t.pickColor} nameOf={(c) => colorName(t, c)} />
  );
  const soundButton = (
    <button type="button" onClick={() => setSoundPrefs({ sfx: !soundPrefs.sfx })} aria-pressed={soundPrefs.sfx} aria-label={g.sound.button} className={round}>
      {soundPrefs.sfx ? <LuVolume2 aria-hidden="true" /> : <LuVolumeX aria-hidden="true" />}
    </button>
  );
  // 左上的房子就是回這款的首頁（選模式那個畫面），不另外放「換模式」（11/1 Zach：有首頁按鈕，選模式就重複了）
  const homeButton = (
    <button type="button" onClick={toMenu} aria-label={g.play.home} className={round}><LuHouse aria-hidden="true" /></button>
  );
  const undoButton = !blind && !online && (
    <button type="button" onClick={doUndo} disabled={!canUndo} className={wide}><LuUndo2 aria-hidden="true" />{t.undo}</button>
  );
  const resignButton = (
    <button type="button" onClick={() => setResignOpen(true)} disabled={!!game.winner} className={wide}><LuFlag aria-hidden="true" />{g.surrender.label}</button>
  );
  const nudgeButton = online && (
    <button type="button" onClick={online.nudge} disabled={!online.canNudge || online.nudged} className={wide}>
      <LuBellRing aria-hidden="true" />{online.nudged ? g.nudge.sent : g.nudge.button}
    </button>
  );
  // 桌機的操作：一般模式四顆（悔棋、重來、怎麼玩、投降）兩兩一排；盲棋沒有悔棋、連線沒有悔棋與重來但多催一下，剛好三顆排一排
  const deskActions = [
    undoButton,
    !online && <button key="restart" type="button" onClick={restart} className={wide}><LuRotateCcw aria-hidden="true" />{t.restart}</button>,
    <button key="help" type="button" onClick={() => setHelpOpen(true)} className={wide}><LuCircleHelp aria-hidden="true" />{t.rules}</button>,
    resignButton,
    nudgeButton,
  ].filter(Boolean);

  return (
    <GomokuFrame className="items-center px-4 pb-5 pt-3 lg:flex-row lg:items-center lg:justify-center lg:py-8">
      {/* 手機的上方一排 */}
      <div className="flex w-full max-w-[520px] items-center justify-between gap-1.5 lg:hidden">
        {/* 左邊：首頁、聲音（跟 Wall Go 一樣聲音在左上）；右邊：說明、重來。兩邊一樣寬，標題才在正中間 */}
        <div className="flex shrink-0 gap-1">
          {homeButton}
          {soundButton}
        </div>
        <div className="min-w-0 text-center">
          {/* 名字的長度差很多（盲五子棋、Blind Gomoku、ブラインド五目並べ）：字級照「兩組圓鈕中間剩多寬」縮，最大 18px */}
          <h1 className="truncate font-black leading-tight" style={{ fontSize: `clamp(12px, calc((100vw - 268px) / ${titleEm}), 18px)` }}>{t.title}</h1>
          <p className="truncate text-[11px] font-bold text-ink-soft">{modeLabel}</p>
        </div>
        <div className="flex shrink-0 gap-1">
          {/* 連線沒有重來：留一顆同寬的空位（在內側，問號才會靠邊），標題才會在正中間 */}
          {online ? <span aria-hidden="true" className="size-11 shrink-0" />
            : <button type="button" onClick={restart} aria-label={t.restart} className={round}><LuRotateCcw aria-hidden="true" /></button>}
          <button type="button" onClick={() => setHelpOpen(true)} aria-label={t.rules} className={round}><LuCircleHelp aria-hidden="true" /></button>
        </div>
      </div>
      <div className="mt-2 w-full max-w-[520px] lg:hidden">
        {reopen || <>{segment(false)}{line}</>}
      </div>

      {/* 桌機：棋盤與右欄並排（排法見 deskLayout.ts）；手機這一層是 contents，不影響手機的上下排 */}
      <div className={PLAY_GRID.row}>
        {/* 棋盤：手機在剩下的高度裡置中；寬度同時受高度限制，矮的手機也放得下下面的選色盤 */}
        <div ref={boardRef} className={`flex w-full max-w-[min(520px,calc(100svh-17rem))] flex-1 items-center py-2 lg:w-[min(640px,calc(100svh-4rem))] lg:max-w-none lg:flex-none lg:py-0`}>
          <GomokuBoard
            board={game.board}
            moves={game.moves}
            blind={blind}
            revealed={flipped}
            aim={canPlay ? aim : null}
            ghost={(p) => <Ghost blind={blind} color={color} side={game.turn} p={p} />}
            glow={blind && !flipped}
            lastMark={!blind && !game.winner}
            line={settled ? game.line : null}
            idle={!blind && !game.winner ? other(game.turn) : null}
            interactive={canPlay}
            label={t.board}
            describe={describe}
            onAim={setAim}
            onPlace={place}
          />
        </div>

        {/* 手機的下方：選色盤，再一排悔棋（一般模式）／催一下（連線）、投降與「下子」；結束後換成再來一局 */}
        <div className="flex w-full max-w-[520px] flex-col gap-2.5 lg:hidden">
          {ended ? (
            <button type="button" onClick={again} className={ink}>{t.again}</button>
          ) : (
            <>
              {picker}
              <div className="flex gap-2.5 [&>*]:flex-1">
                {undoButton}
                {nudgeButton}
                {resignButton}
                <button type="button" onClick={() => aim !== null && place(aim)} disabled={!canPlay || aim === null || !!game.board[aim]}
                  className={`${ink} hidden coarse:flex`}>
                  {canPlay && aim === null ? t.aimFirst : t.place}
                </button>
              </div>
            </>
          )}
        </div>

        {/* 桌機的右邊一欄：房子＋標題＋聲音、兩方、狀態、選色盤、操作 */}
        <aside className={`hidden w-[340px] shrink-0 flex-col gap-5 lg:flex ${PLAY_GRID.aside}`}>
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-3">
              {homeButton}
              <div className="min-w-0 flex-1">
                <h1 className="truncate text-3xl font-black leading-none">{t.title}</h1>
                <p className="mt-1.5 truncate text-sm font-bold text-ink-soft">{modeLabel}</p>
              </div>
              {soundButton}
            </div>
            {sideCards}
            {reopen || <div className="flex items-start justify-between gap-3">
              <div className="min-w-0" aria-live="polite">
                <p className="text-base font-black leading-tight">{status}</p>
                {hint && <p className="mt-0.5 text-xs font-bold leading-snug text-ink-soft">{hint}</p>}
              </div>
              <span className="gmk-patch is-ramie flex shrink-0 items-center gap-1.5 py-1.5 pl-2 pr-3 text-xs font-black tabular-nums">{moveNo}</span>
            </div>}
            {!ended && picker && (
              <div className="flex flex-col gap-2">
                <p className="text-xs font-black text-ink-soft">{t.pickColor}</p>
                {picker}
              </div>
            )}
          </div>
          {ended ? (
            <div className="grid grid-cols-2 gap-2.5">
              <button type="button" onClick={() => setHelpOpen(true)} className={wide}><LuCircleHelp aria-hidden="true" />{t.rules}</button>
              <button type="button" onClick={again} className={ink}>{t.again}</button>
            </div>
          ) : (
            <div className={`grid gap-2.5 ${deskActions.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>{deskActions}</div>
          )}
        </aside>
      </div>

      {/* 投降確認。本機是輪到的那方投降（小標寫哪一方），對電腦是自己；連線寫進房間 */}
      <Modal isOpen={resignOpen && !game.winner} onClose={() => setResignOpen(false)} title={g.surrender.heading}
        kicker={mode.opponent === 'local' ? sideName(game.turn) : g.surrender.kicker}
        icon={GiTatteredBanner} band={GMK_BAND} panelClassName={GMK_PANEL}
        footer={<>
          <button type="button" onClick={() => setResignOpen(false)} className={`${wide} flex-1`}>{g.surrender.cancel}</button>
          <button type="button" onClick={() => { setResignOpen(false); resign(); }} className={`${ink} flex-1`}>{g.surrender.confirm}</button>
        </>}>
        <p className="text-sm leading-relaxed">{g.surrender.body}</p>
      </Modal>

      <Modal isOpen={leave.open} onClose={leave.cancel} title={g.leave.heading} kicker={g.leave.kicker}
        icon={GiExitDoor} band={GMK_BAND} panelClassName={GMK_PANEL}
        footer={<>
          <button type="button" onClick={leave.cancel} className={`${wide} flex-1`}>{g.leave.cancel}</button>
          <button type="button" onClick={leave.confirm} className={`${ink} flex-1`}>{g.leave.confirm}</button>
        </>}>
        <p className="text-sm leading-relaxed">{online ? g.leave.bodyOnline : g.leave.body}</p>
      </Modal>

      <Modal isOpen={helpOpen} onClose={() => setHelpOpen(false)} title={t.rules} kicker={t.title}
        icon={GiRuleBook} band={GMK_BAND} panelClassName={GMK_PANEL}>
        {/* 同規則頁的步驟，一次一步、可以左右滑（RulesSteps.tsx）；不放規則頁的連結 —— 對局中不放會離開對局的東西 */}
        <RulesStepsPaged open={helpOpen} steps={t.steps} prev={ui.prev} next={ui.next} done={ui.close} onDone={() => setHelpOpen(false)} />
      </Modal>

      {/* 結算就是分享圖。關掉還留在棋盤上，可以看翻開後的盤面；下面換成再來一局（連線是再開一間房；回首頁用左上的房子）。
          暗遮罩上的按鈕也是這款的布：再來一局是拼起來的青綠布、分享是白絲布。只留 9:16，比例切換不會出現（toggle 那幾個 class 留著，之後加回比例時用） */}
      <ShareResultModal isOpen={resultOpen} onClose={() => setResultOpen(false)} title={resultTitle} card={share}
        onRestart={again} restartLabel={t.again}
        srText={`${resultTitle} ${resultBody}${blind ? ` ${t.revealBody}` : ''}`}
        frameClassName="rounded-[3px]"
        classes={{
          primary: 'gmk-patch is-pieced',
          secondary: 'gmk-patch',
          toggle: '!rounded-[3px] bg-[#f2e4c9]/15',
          toggleOn: '!rounded-[2px] bg-[#f2e4c9] text-[#2a2525]',
          toggleOff: '!rounded-[2px] text-[#f2e4c9]/75 hover:text-[#f2e4c9]',
          button: 'font-black',
          placeholder: 'bg-[#f2e4c9]/20',
        }} />
    </GomokuFrame>
  );
}
