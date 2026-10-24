'use client';
import { useEffect, useState, type ReactNode } from 'react';
import { GiLaurelCrown } from 'react-icons/gi';
import { useStep, useSwipePager } from '@/hook/useSwipePager';
import { fill, useTextTable } from '@/i18n/gameText';
import { TEXT, type BalanceMancalaText } from '@/games/balance-mancala/text';
import { CELLS, COLOURS, letterOf, seatOfLetter, type Scores, type Seat } from '@/games/balance-mancala/engine';
import MancalaRing, { type RingMark } from './MancalaRing';
import ScorePanel from './ScorePanel';
import PieceDisc from './PieceDisc';
import { BRASS, BRASS_DEEP, DISH_BG, WOOD } from './palette';

/**
 * 平衡播棋規則的七步，一步一張圖（2026-10-25 Zach：「怎麼玩最好跟 Wall Go 一樣圖配字」）。
 * 規則頁（全部攤開，RulesStepsList）與對局中的說明彈窗（一次一步、可以左右滑，RulesStepsPaged）共用。
 * 文字是 text.ts 的 rules（七條）＋ ruleTitles（小標），跟這裡的七張圖同索引。
 *
 * 圖全部是遊戲裡真的元件畫的靜態局面：圓盤（MancalaRing，一塊圓的木頭）與分數面板（ScorePanel），
 * 放在一塊布色的切角方塊上（對局頁就是布上一塊木頭）。不加新顏色、不畫花紋（裝飾只有整頁最外緣的布邊）。
 * 盤面上的格子是按鈕，圖整塊 inert＋aria-hidden：不能點、不搶焦點，意思由旁邊的字講。
 * 局面是 4 席（A–D 各 4 顆，共 16 顆）的一局，每一張的子數都對得上。
 */
export const STEP_COUNT = 7;

/** 'AB' → [A, B]：每一格裡的子，依放進去的先後 */
function boardOf(cells: Record<number, string>): Seat[][] {
  return Array.from({ length: CELLS }, (_, i) => [...(cells[i] ?? '')].map(seatOfLetter));
}

/** 第 2 步：開局放到第 8 顆（A B C D A B C 已放，輪到 D）。滿 2 顆的格子不能再放，跟對局時一樣蓋暗 */
const SETUP = boardOf({ 2: 'AC', 5: 'B', 7: 'D', 10: 'A', 12: 'BC' });
const SETUP_OPEN = new Set(SETUP.flatMap((c, i) => (c.length < 2 ? [i] : [])));
/** 第 3、4 步：A 拿起綠盤（3）裡的 A、B、C，排成 A → C → B 播下去；最後一顆 B 落在綠盤（6），那格現在 3 顆 → B 的綠 +3 */
const SOWN = boardOf({ 0: 'C', 1: 'D', 2: 'A', 4: 'BA', 5: 'C', 6: 'DAB', 8: 'C', 9: 'AD', 11: 'B', 12: 'D', 13: 'CB' });
const SOWN_ORDER: Seat[] = [0, 2, 1];
const SOWN_INCOMING = new Set([4, 5, 6]);
const SOWN_MARK: RingMark = { cell: 6, owner: 1, points: 3, colour: 2 };
/** 第 5 步：A 拿起藍盤（5）的 A、D，D 落在 6、A 落在天使格（原本有 C → 2 顆）。A 原本紅 8 藍 5 綠 3 → 記到最低的綠 */
const ANGEL_BOARD = boardOf({ 0: 'B', 1: 'C', 3: 'DB', 4: 'A', 6: 'BD', 7: 'CA', 9: 'CA', 10: 'D', 11: 'B', 12: 'C', 13: 'AD' });
const ANGEL_SCORES: Scores = [8, 5, 3];
const ANGEL_MARK: RingMark = { cell: 7, owner: 0, points: 2, colour: 2 };
/** 第 6 步：B 的紅到了 31（過了 30 那條線）→ 遊戲結束 */
const END_SCORES: Scores[] = [[24, 19, 26], [31, 22, 25], [20, 27, 18], [17, 23, 28]];
/**
 * 第 7 步：A 是文案裡的例子（紅 13 藍 11 綠 20 → 2）；B 的總分更少，但三色平均，最終分高很多（12，第一）；
 * C 最平均，但每一色都少（8）—— 平均之外也要夠多
 */
const FINAL_SCORES: Scores[] = [[13, 11, 20], [15, 14, 16], [8, 8, 8]];

const noop = () => {};

function Ring({ t, board, center, ...rest }: {
  t: BalanceMancalaText;
  board: Seat[][];
  center?: ReactNode;
  selectable?: Set<number>;
  incoming?: Set<number>;
  /** 拿起來的那一格：對局中預覽時一樣，黃銅框（拿空了，框裡沒有子） */
  from?: number;
  mark?: RingMark;
}) {
  return (
    <div className="w-full rounded-full p-[3%]" style={{ background: WOOD }}>
      <MancalaRing board={board} colourShort={t.colourShort} highLabel={t.high} lowLabel={t.low} ariaOf={() => ''}
        selectable={rest.selectable ?? null} dimOthers={!!rest.selectable} selected={rest.from ?? null}
        incoming={rest.incoming} emptied={rest.from ?? null} mark={rest.mark ?? null} onPick={noop} center={center} />
    </div>
  );
}

/** 圓盤中央：落下順序（一排子，最後一顆可以加一圈黃銅） */
function OrderCenter({ t, last }: { t: BalanceMancalaText; last?: boolean }) {
  return (
    <>
      <p className="font-bold leading-tight opacity-70" style={{ fontSize: '2.7cqw' }}>{t.order}</p>
      <div className="mt-[2cqw] flex items-center" style={{ gap: '1.6cqw' }}>
        {SOWN_ORDER.map((seat, i) => (
          <PieceDisc key={i} seat={seat} size="6.4cqw" ring={last && i === SOWN_ORDER.length - 1 ? 'last' : undefined} />
        ))}
      </div>
    </>
  );
}

/** 圓盤中央：落在天使格的那個人原本的三色，最低的那一盤加一圈黃銅 */
function LowestCenter({ t }: { t: BalanceMancalaText }) {
  const low = Math.min(...ANGEL_SCORES);
  return (
    <>
      <PieceDisc seat={ANGEL_MARK.owner} size="6cqw" />
      <div className="mt-[2cqw] flex items-center" style={{ gap: '1.6cqw' }}>
        {COLOURS.map((c) => (
          <span key={c} className="grid place-items-center rounded-full font-black leading-none"
            style={{
              width: '8.4cqw', height: '8.4cqw', fontSize: '3.6cqw', background: DISH_BG[c],
              boxShadow: ANGEL_SCORES[c] === low ? `0 0 0 0.5cqw ${WOOD}, 0 0 0 1.1cqw ${BRASS}` : undefined,
            }}>
            {ANGEL_SCORES[c]}
          </span>
        ))}
      </div>
      <p className="mt-[2cqw] font-black leading-tight" style={{ fontSize: '2.7cqw', color: BRASS }}>{t.low} +{ANGEL_MARK.points}</p>
    </>
  );
}

function Scoreboard({ t, scores, turn = null }: { t: BalanceMancalaText; scores: Scores[]; turn?: Seat | null }) {
  const names = scores.map((_, seat) => fill(t.player, { seat: letterOf(seat) }));
  return <ScorePanel scores={scores} names={names} turn={turn} gain={null} colourShort={t.colourShort} finalLabel={t.final} compact />;
}

/** 第 i 步的圖：一塊布色的方塊，裡面是盤面或分數面板 */
function Stage({ i, t }: { i: number; t: BalanceMancalaText }) {
  let body: ReactNode;
  switch (i) {
    case 0: body = <Ring t={t} board={boardOf({})} />; break;
    case 1: body = (
      <Ring t={t} board={SETUP} selectable={SETUP_OPEN} center={(
        <>
          <PieceDisc seat={3} size="11cqw" />
          <p className="mt-[1.6cqw] font-black leading-tight" style={{ fontSize: '3.6cqw' }}>{fill(t.player, { seat: letterOf(3) })}</p>
          <p className="mt-[0.6cqw] font-bold leading-tight opacity-70" style={{ fontSize: '2.7cqw' }}>7 / 16</p>
        </>
      )} />
    ); break;
    case 2: body = <Ring t={t} board={SOWN} from={3} incoming={SOWN_INCOMING} center={<OrderCenter t={t} />} />; break;
    case 3: body = <Ring t={t} board={SOWN} from={3} incoming={SOWN_INCOMING} mark={SOWN_MARK} center={<OrderCenter t={t} last />} />; break;
    case 4: body = <Ring t={t} board={ANGEL_BOARD} from={5} incoming={new Set([6, 7])} mark={ANGEL_MARK} center={<LowestCenter t={t} />} />; break;
    case 5: body = (
      <div className="flex w-full flex-col gap-2">
        <p className="flex items-center gap-1.5 text-sm font-black">
          <GiLaurelCrown aria-hidden="true" className="text-lg" style={{ color: BRASS_DEEP }} />{t.over}
        </p>
        <Scoreboard t={t} scores={END_SCORES} turn={1} />
      </div>
    ); break;
    default: body = (
      <div className="flex w-full flex-col gap-2">
        <p className="text-xs font-black text-ink-soft">{t.formula}</p>
        <Scoreboard t={t} scores={FINAL_SCORES} turn={1} />
      </div>
    );
  }
  return (
    <div inert aria-hidden="true" className={`mcl-cut flex aspect-square w-full items-center justify-center bg-[#ebd2cb] ${i < 5 ? 'p-[3%]' : 'p-[6%]'}`}>
      {body}
    </div>
  );
}

/** 小標＋那一條規則（最後一步再加文案裡的例子） */
function Caption({ i, t, heading: Heading = 'h3' }: { i: number; t: BalanceMancalaText; heading?: 'h2' | 'h3' }) {
  return (
    <>
      <Heading className="flex items-start gap-2.5 text-base font-black leading-snug md:text-lg">
        <span aria-hidden="true" className="mcl-plaque is-small mt-0.5 grid size-6 shrink-0 place-items-center text-xs font-black">{i + 1}</span>
        <span>{t.ruleTitles[i]}</span>
      </Heading>
      <p className="mt-2 text-sm leading-relaxed md:text-base">{t.rules[i]}</p>
      {i === STEP_COUNT - 1 && <p className="mt-2 text-sm font-black leading-relaxed md:text-base">{t.example}</p>}
    </>
  );
}

/** 全部攤開（規則頁）：一步一張切角的亮布卡，桌機圖在左、字在右 */
export function RulesStepsList() {
  const t = useTextTable(TEXT);
  return (
    <ol className="flex flex-col gap-4">
      {Array.from({ length: STEP_COUNT }, (_, i) => (
        <li key={i} className="mcl-cut bg-[#fef2ec] p-4 md:p-5">
          <div className="grid gap-4 md:grid-cols-[20rem_1fr] md:items-center md:gap-6">
            <div className="mx-auto w-full max-w-xs md:max-w-none"><Stage i={i} t={t} /></div>
            <div><Caption i={i} t={t} heading="h2" /></div>
          </div>
        </li>
      ))}
    </ol>
  );
}

/**
 * 一次一步（對局中的說明彈窗）：七張並排在一條軌道上，手指左右拖（hook/useSwipePager.ts，同 Wall Go 的遊玩方式、虎棋的說明），
 * 也可以按下面的按鈕、點頁碼，或用左右方向鍵。頁碼是一排小塊的黃銅砝碼（首頁難度的那種），按鈕是這款的布條與黃銅牌。
 * 彈窗關著時內容仍掛在頁面上（Modal 只加 inert），所以要 `open`：開著才聽方向鍵、每次打開從第一步開始。
 * 這裡不放會離開對局的連結；出處與署名在規則頁。
 */
export function RulesStepsPaged({ open, prev, next, done, onDone }: {
  open: boolean; prev: string; next: string; done: string; onDone: () => void;
}) {
  const t = useTextTable(TEXT);
  const [i, goTo] = useStep(STEP_COUNT);
  const pager = useSwipePager(STEP_COUNT, i, goTo);
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) goTo(0);
  }
  const { onKeyDown } = pager;
  useEffect(() => {
    if (!open) return;
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onKeyDown]);
  const last = i === STEP_COUNT - 1;
  return (
    <div className="flex flex-col gap-4">
      <div {...pager.viewport}>
        <div className="flex items-start" style={pager.trackStyle}>
          {Array.from({ length: STEP_COUNT }, (_, n) => (
            <div key={n} className="w-full shrink-0 px-0.5" aria-hidden={n !== i}>
              {/* 圖的寬度跟著可視高度縮：矮的手機上整塊（標題、圖、字、按鈕）塞得下，不必捲 */}
              <div className="mx-auto w-[min(100%,21rem,max(11rem,calc(100svh-25rem)))]"><Stage i={n} t={t} /></div>
              <div className="mt-4"><Caption i={n} t={t} /></div>
            </div>
          ))}
        </div>
      </div>
      {/* 頁碼：一步一塊小砝碼，目前那一步是實的、其他淡掉；點了直接跳過去（觸控範圍撐到 24px） */}
      <div className="-mt-1 flex justify-center" role="group" aria-label={`${i + 1} / ${STEP_COUNT}`}>
        {Array.from({ length: STEP_COUNT }, (_, n) => (
          <button key={n} type="button" onClick={() => goTo(n)} aria-label={`${n + 1}. ${t.ruleTitles[n]}`}
            aria-current={n === i ? 'step' : undefined} className="grid size-6 place-items-center">
            <span className={`mcl-weight transition ${n === i ? 'scale-125' : 'opacity-30'}`} />
          </button>
        ))}
      </div>
      <div className="flex gap-3">
        {i > 0 && (
          <button type="button" onClick={() => goTo(i - 1)} className="mcl-cloth flex-1 py-3.5 font-black">{prev}</button>
        )}
        <button type="button" onClick={() => (last ? onDone() : goTo(i + 1))} className="mcl-plaque flex-1 py-3.5 font-black">
          {last ? done : next}
        </button>
      </div>
    </div>
  );
}
