'use client';
import { useState } from 'react';
import { GiRuleBook } from 'react-icons/gi';
import Modal from '@/components/Modal';
import { useStep, useSwipePager } from '@/hook/useSwipePager';
import { useMessages } from '@/i18n/LocaleProvider';
import { POINT_NAMES, type Cell, type Point, type Side } from '@/games/nine-mens-morris/engine';
import type { MorrisText } from '@/games/nine-mens-morris/text';
import { MorrisMiniBoard } from './MorrisBoard';
import { MORRIS_BAND, MORRIS_PANEL } from './ui';

/**
 * 九子棋規則的七個步驟，每步一張小圖（2026-10-25 Zach：「怎麼玩」要跟 Wall Go 一樣圖配字）。
 * 規則頁（/nine-mens-morris/rules）全部攤開、對局中的說明彈窗一次一步，用的是同一份圖與字。
 *
 * 圖是對局那塊棋盤畫的靜態局面（MorrisMiniBoard）：記號都是對局裡真的會看到的 ——
 * 剛連成的線是粉筆、可以拿的子會搖、拿起來的子浮起來留一塊粉筆印、可以走過去的點是粉筆點、被拿掉的子躺在下方。
 * 字在 text.ts 的 steps（順序跟這裡一樣），對著圖講黑方／白方。子數都對得上：放完之後的局面盤上＋躺著的＝9，放子中的局面對得上輪到誰。
 */
type StepArt = {
  board: Cell[];
  mills?: Point[][];
  removable?: Point[];
  selected?: Point;
  targets?: Point[];
  ghost?: { side: Side; at: Point };
  lastTo?: Point;
  lastFrom?: Point;
  removed?: Record<Side, number>;
};

const pt = (name: string): Point => POINT_NAMES.indexOf(name as (typeof POINT_NAMES)[number]);
/** 'a7 d7 g7' → 點的編號（連成的線要照線上的順序寫，粉筆從頭畫到尾） */
const pts = (names: string) => names.split(' ').filter(Boolean).map(pt);
function position(black: string, white: string): Cell[] {
  const board: Cell[] = Array(POINT_NAMES.length).fill(null);
  for (const p of pts(black)) board[p] = 'B';
  for (const p of pts(white)) board[p] = 'W';
  return board;
}

const FLY = position('d7 b6 d5 c4 e3 f2', 'g7 e4 b2');

const STEPS: StepArt[] = [
  // 棋盤：24 個點，空的
  { board: position('', '') },
  // 放子：黑方剛放下第 3 顆（頭上一個點），輪到白方，半透明的那顆是正要放下去的
  { board: position('d6 c4 f2', 'd5 e4'), lastTo: pt('f2'), ghost: { side: 'white', at: pt('b6') } },
  // 連成一線：黑方上排連成一線（粉筆），白方能拿的兩顆在搖；白方下排連成一線的三顆不能拿、不搖。
  // 先前白方連成那條線時拿走過黑方一顆（躺在下方）
  { board: position('a7 d7 g7 b4 e5', 'a1 d1 g1 d5 f4'), mills: [pts('a7 d7 g7')], lastTo: pt('g7'), removable: pts('d5 f4'), removed: { black: 1, white: 0 } },
  // 走子：黑方拿起 d6，粉筆點是沿線相鄰的空點
  { board: position('a7 d6 b4 c3 f2 d1 e5', 'g7 f6 e4 g4 d3 b2'), selected: pt('d6'), targets: pts('d7 b6 d5'), removed: { black: 2, white: 3 } },
  // 飛子：白方只剩 3 顆，拿起來的那顆可以去任何空點
  { board: FLY, selected: pt('e4'), targets: FLY.flatMap((c, p) => (c ? [] : [p])), removed: { black: 3, white: 6 } },
  // 輸贏：黑方連成一線拿掉白方第 7 顆，白方只剩 2 顆
  { board: position('c3 d3 e3 b6 f4', 'a1 g7'), mills: [pts('c3 d3 e3')], lastTo: pt('d3'), removed: { black: 4, white: 7 } },
  // 節目規則：黑方從 f4 走上來連成一線，但白方的子全都在線上 —— 一顆都不搖，這次沒得拿
  { board: position('b6 d6 f6 c4 e3', 'a1 d1 g1 g4 g7'), mills: [pts('b6 d6 f6')], lastTo: pt('f6'), lastFrom: pt('f4'), removed: { black: 4, white: 4 } },
];
/** 節目規則那一步（最後一步）：對局開了節目規則時，彈窗裡這一步的字墊一塊深一階的羊皮紙 */
const SHOW_STEP = STEPS.length - 1;

/** 步驟編號：手抄本的上色首字，朱紅與群青交替。字放到 19px（大字）：羊皮紙字在朱紅上 3.7:1，大字的門檻是 3:1 */
function StepNumber({ n }: { n: number }) {
  return (
    <span aria-hidden="true" className={`grid size-8 shrink-0 place-items-center rounded-[3px] text-[1.2rem] font-black leading-none text-[#eee0c4] ${n % 2 ? 'bg-[#4b4577]' : 'bg-[#c54915]'}`}>
      {n + 1}
    </span>
  );
}

/**
 * 全部攤開（規則頁）：一步一塊拱頂的羊皮紙（同首頁的卡片），手機上圖在上、字在下，桌機圖在左、字在右（同 Wall Go 的規則頁）。
 */
export function RulesStepsList({ steps }: { steps: MorrisText['steps'] }) {
  return (
    <ol className="flex flex-col gap-5">
      {STEPS.map((art, i) => (
        // 卡片不是按鈕：底色鎖住，滑鼠滑過不變深（.nmm-arch 的 hover 是給按鈕的）
        <li key={i} className="nmm-arch !bg-[#eee0c4] px-5 pb-6 pt-9 md:px-7">
          <div className="grid gap-5 md:grid-cols-[15rem_1fr] md:items-center md:gap-7">
            <div className="mx-auto w-full max-w-60 md:max-w-none"><MorrisMiniBoard {...art} /></div>
            <div>
              <h2 className="flex items-center gap-3 text-xl font-black leading-snug">
                <StepNumber n={i} />{steps[i].title}
              </h2>
              <p className="mt-2.5 text-[0.95rem] font-bold leading-relaxed md:text-base">{steps[i].body}</p>
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}

/**
 * 「怎麼玩」彈窗（對局中）：七步並排在一條軌道上，一次一步，手指左右拖（hook/useSwipePager.ts，同 Wall Go 的遊玩方式），
 * 也可以按下面的上一步／下一步、點頁碼的小圓點，或用左右方向鍵。最後一步是節目規則的差別。
 * 彈窗裡不放規則頁的連結：從對局離開，下到一半的棋會丟（名字由來、出處只放規則頁）。
 *
 * 彈窗關著時內容仍掛在頁面上（Modal 只加 inert）：每次打開從第一步開始（同 Wall Go）；
 * 七塊小棋盤第一次打開才畫（木頭的斑是 SVG 濾鏡，沒打開過就不必在背後多算七張）。
 */
export function MorrisRulesModal({ t, open, onClose, showRules }: { t: MorrisText; open: boolean; onClose: () => void; showRules?: boolean }) {
  const m = useMessages();
  const [i, goTo] = useStep(STEPS.length);
  const pager = useSwipePager(STEPS.length, i, goTo);
  const [wasOpen, setWasOpen] = useState(open);
  const [drawn, setDrawn] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) { goTo(0); setDrawn(true); }
  }
  const last = i === STEPS.length - 1;

  return (
    <Modal isOpen={open} onClose={onClose} title={t.rulesHeading} kicker={t.title} icon={GiRuleBook}
      band={MORRIS_BAND} panelClassName={`${MORRIS_PANEL} short:max-w-2xl`} onKeyDown={pager.onKeyDown}
      bodyClassName="short:py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      footer={
        <>
          {i > 0 && (
            <button type="button" onClick={() => goTo(i - 1)} className="nmm-arch is-small flex-1 whitespace-nowrap font-black">{m.ui.prev}</button>
          )}
          <button type="button" onClick={() => (last ? onClose() : goTo(i + 1))} className="nmm-arch is-small is-red flex-1 whitespace-nowrap font-black">
            {last ? m.ui.close : m.ui.next}
          </button>
        </>
      }>
      {drawn && (
        <>
          <div {...pager.viewport}>
            <div className="flex items-start" style={pager.trackStyle}>
              {STEPS.map((art, n) => (
                <div key={n} className="w-full shrink-0 px-0.5 short:flex short:items-start short:gap-5" aria-hidden={n !== i}>
                  {/* 盤面寬度跟著可視高度走（扣掉色帶、字、頁碼、按鈕），放不下時縮的是盤面、不是讓內容捲（同 Wall Go）。
                      手機橫放（short）圖在左、字在右，扣的是色帶、頁碼與按鈕 */}
                  <div className="mx-auto w-[clamp(7rem,calc((100svh-33rem)*0.9),14rem)] short:mx-0 short:w-[clamp(5.5rem,calc((100svh-17rem)*0.9),11rem)] short:shrink-0">
                    <MorrisMiniBoard {...art} />
                  </div>
                  <div className="short:min-w-0 short:flex-1">
                    <h3 className="mt-4 flex items-center gap-2.5 text-lg font-black leading-snug text-[#1e120a] short:mt-0">
                      <StepNumber n={n} />{t.steps[n].title}
                    </h3>
                    <p className={`mt-2 text-sm font-bold leading-relaxed text-[#1e120a] ${n === SHOW_STEP && showRules ? 'rounded-[3px] bg-[#e3c99c] p-3' : ''}`}>
                      {t.steps[n].body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* 頁碼：每一步一顆小圓點（目前這步是朱紅的長條），點了直接跳過去；觸控範圍撐到 24px */}
          <div className="mt-3 flex justify-center gap-1.5" role="group" aria-label={`${i + 1} / ${STEPS.length}`}>
            {STEPS.map((_, n) => (
              <button key={n} type="button" onClick={() => goTo(n)} aria-label={`${n + 1}. ${t.steps[n].title}`} aria-current={n === i ? 'step' : undefined}
                className="group grid h-6 min-w-6 place-items-center">
                <span className={`block h-2 rounded-full transition-all ${n === i ? 'w-6 bg-[#c54915]' : 'w-2 bg-[#1e120a]/25 group-hover:bg-[#1e120a]/45'}`} />
              </button>
            ))}
          </div>
        </>
      )}
    </Modal>
  );
}
