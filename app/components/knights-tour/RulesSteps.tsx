'use client';
import { LuCheck } from 'react-icons/lu';
import { useTextTable } from '@/i18n/gameText';
import { canStartFrom, knightMoves, legalMoves, replay, type Square } from '@/games/knights-tour/engine';
import { TEXT, type KnightsText } from '@/games/knights-tour/text';
import TourBoard from './TourBoard';
import { sizeLabel } from './ui';

/**
 * 騎士巡遊規則的六個步驟，每步一張圖（Fig. 1–6）。規則頁（全部攤開）與對局中的說明彈窗（一次一步、可以左右滑）共用：
 * 圖就是對局用的棋盤（TourBoard，不給 onTap 就是靜態的），教學裡看到的樣子進遊戲認得出來 —— 不另外畫插圖。
 * 文字是 text.ts 的 howTitles／howSteps，跟這裡的 FIGS 靠索引對齊（長度由 tests/components/knights-tour/rulesSteps.test.ts 鎖住）。
 *
 * 局面都是真的走得到的（測試用 engine 重播過）：
 * 1. 5×5 正中央的騎士與它跳得到的八格
 * 2. 從左上角出發走了四步，圓點是第五步可以去的格子（就是第 3 張那條走法的開頭）
 * 3. 一條走完 5×5 的走法（engine 的 solve 解出來的），每一格寫上第幾步，像首頁的 Fig. 1
 * 4. 7×7 還沒放騎士：跟四角不同色的格子打 ×（對局裡奇數盤開局就是這樣）
 * 5. 練習模式：6×6 走到第 9 步，底下照對局的狀態列寫「還走得完」
 * 6. 訣竅：8×8 照「出路最少」的走法（Warnsdorff）從角落走 24 步 —— 外面兩圈先走掉、中間整塊留著；閃的那格是下一步
 */
export type RuleFig = {
  n: number;
  path: readonly Square[];
  targets?: ReadonlySet<Square>;
  dead?: ReadonlySet<Square>;
  hinted?: Square;
  /** 最後一格畫騎士（false：整張是寫好步數的解答） */
  showKnight?: boolean;
  /** 底下加一列練習模式的狀態（大小、步數、判定） */
  practice?: boolean;
};

const nextOf = (n: number, path: readonly Square[]) => new Set(legalMoves(replay(n, path)));

/** 5×5 的一條完整走法（從左上角出發） */
export const TOUR_5: readonly Square[] = [0, 7, 4, 13, 24, 17, 20, 11, 2, 5, 16, 23, 14, 3, 6, 15, 22, 19, 8, 1, 10, 21, 18, 9, 12];
/** 6×6 走到第 9 步（一條走得完的走法的開頭） */
export const PRACTICE_6: readonly Square[] = [0, 8, 4, 17, 28, 32, 24, 13, 2];
/** 8×8 從左上角照 Warnsdorff 走 24 步，下一步是 54 */
export const WARNSDORFF_8: readonly Square[] = [0, 10, 16, 1, 11, 5, 15, 30, 47, 62, 52, 58, 48, 33, 50, 56, 41, 24, 9, 3, 13, 7, 22, 39];
export const WARNSDORFF_8_NEXT: Square = 54;

export const FIGS: readonly RuleFig[] = [
  { n: 5, path: [12], targets: new Set(knightMoves(5, 12)) },
  { n: 5, path: TOUR_5.slice(0, 4), targets: nextOf(5, TOUR_5.slice(0, 4)) },
  { n: 5, path: TOUR_5, showKnight: false },
  { n: 7, path: [], dead: new Set(Array.from({ length: 49 }, (_, sq) => sq).filter((sq) => !canStartFrom(7, sq))) },
  { n: 6, path: PRACTICE_6, targets: nextOf(6, PRACTICE_6), practice: true },
  { n: 8, path: WARNSDORFF_8, targets: nextOf(8, WARNSDORFF_8), hinted: WARNSDORFF_8_NEXT },
];

/**
 * 一張圖：棋盤（＋練習模式那張的狀態列）＋圖說「Fig. N.」（銅版圖版的編號，舊式襯線）。
 * shortCompact：矮的橫放手機（short）只留棋盤 —— 說明彈窗在那種畫面上塞不下狀態列與圖說
 */
export function RuleFigure({ index, className = '', shortCompact = false }: { index: number; className?: string; shortCompact?: boolean }) {
  const t = useTextTable<KnightsText>(TEXT);
  const f = FIGS[index];
  return (
    <figure className={className}>
      <TourBoard n={f.n} path={f.path} targets={f.targets} dead={f.dead} hinted={f.hinted ?? null} showKnight={f.showKnight} />
      {f.practice && (
        // 對局的狀態列縮小版（PracticeGame 的 status）：大小、步數、判定
        <div aria-hidden="true" className={`kt-plate mt-1.5 flex items-center gap-2 px-2.5 py-1.5 ${shortCompact ? 'short:hidden' : ''}`}>
          <span className="text-sm font-black tabular-nums">{sizeLabel(f.n)}</span>
          <span className="text-xs font-bold tabular-nums text-ink-soft">{f.path.length} / {f.n * f.n}</span>
          <span className="kt-plate ml-auto flex items-center gap-1 whitespace-nowrap px-2 py-1 text-[11px] font-black">
            <LuCheck aria-hidden="true" className="shrink-0" />{t.canFinish}
          </span>
        </div>
      )}
      <figcaption className={`kt-serif mt-1.5 text-center text-sm italic opacity-75 ${shortCompact ? 'short:hidden' : ''}`}>Fig. {index + 1}.</figcaption>
    </figure>
  );
}

/** 全部攤開（規則頁）：一步一列，手機圖在上、桌機圖在左 */
export function RulesStepsList() {
  const t = useTextTable<KnightsText>(TEXT);
  return (
    <ol className="flex flex-col">
      {FIGS.map((_, i) => (
        <li key={i} className="grid gap-4 border-t border-[#322e2a]/25 py-7 first:border-t-0 first:pt-0 md:grid-cols-[15rem_1fr] md:items-start md:gap-8">
          <RuleFigure index={i} className="mx-auto w-full max-w-64 md:mx-0 md:max-w-none" />
          <div>
            <h2 className="flex items-baseline gap-2.5 text-xl font-black leading-snug">
              <span className="kt-serif shrink-0 text-lg font-semibold italic text-[#834d36]">{i + 1}.</span>
              <span>{t.howTitles[i]}</span>
            </h2>
            <p className="mt-2 text-base font-bold leading-relaxed">{t.howSteps[i]}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
