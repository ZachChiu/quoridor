import React, { useMemo } from "react";
import { PLAYER_ON, playerVar, type PlayerKey } from "@/config/players";
import type { Player } from "@/types/chessboard";
import { GiLaurelCrown } from 'react-icons/gi';
import { useGameText } from '@/i18n/LocaleProvider';
import { fmt } from '@/i18n/content/game';

interface Props {
  isPlacingChess: boolean;
  currentPlayer: Player;
  winingStatus: (Player | 'draw')[];
  breakWallCountObj: Record<Exclude<Player, null>, number>;
  /** AI 正在想。困難難度每手要一秒多，沒有提示會讓人以為當掉了。 */
  aiThinking?: boolean;
  /** 有沒有選中棋子 */
  selected?: boolean;
  /** 這一步還能走幾格 */
  remainSteps?: number;
  /** 移動已經結束，現在該蓋牆了 */
  onWallStep?: boolean;
  /** 重新打開結算。只在對局結束後有意義。 */
  onShowResult?: () => void;
  /**
   * 幾人局。改成由 PlayClient 傳進來，不再自己讀 GameContext ——
   * 那邊的值在重整後會掉回預設的兩人，而盤面的真相在 PlayClient 的 state 裡。
   * 同一件事有兩個來源，遲早會對不上。
   */
  playersNum: number;
}

/**
 * 桌機的操作提示。
 *
 * 這塊唯一在講的事情是「現在輪到誰、他該做什麼」，所以整塊就染成那位玩家的顏色 ——
 * 比原本「深墨底 + 一顆彩色小圓點」直接得多，而且每回合都會換色，
 * 畫面不會從頭到尾都是同一塊黑。遊戲結束沒有當前玩家，才回到深墨。
 *
 * 對局進行中分成兩行，和手機控制盤上的步驟標講同一件事、用同一組字：
 *
 *     ① 移動  ›  ② 築牆        ← 現在在哪一步（另一步淡掉）
 *     紅方 · 還可走 2 格         ← 是誰、還能做什麼
 *
 * 手機沒有這塊（控制盤已經把三件事都說了），所以它只在指標是滑鼠時出現。
 *
 * ── 對局結束後它是一顆按鈕 ─────────────────────────────────────────
 * 結算 Modal 關掉之後，畫面上原本沒有任何地方能把它叫回來 ——
 * 按了「看看棋盤」就等於永久失去比分、再來一局與回饋的入口。
 *
 * 入口就放在這裡而不是另外加一顆：這塊本來就是「現在是什麼狀況」，
 * 而結束後的狀況就是結果。手機在結束時控制盤會收起來、這塊才現身，
 * 所以兩邊都找得到，也不必為手機再擺一顆。
 */
export default React.memo(function GameTips({
  isPlacingChess, currentPlayer, winingStatus, breakWallCountObj, aiThinking,
  selected, remainSteps = 0, onWallStep, onShowResult, playersNum,
}: Props) {
  const g = useGameText();
  const over = winingStatus.length > 0;
  const p = currentPlayer as PlayerKey | null;
  // 兩行的形式只在「輪到某人、正常下棋」時成立；開局、AI 思考、結束都沒有步驟可言
  const steps = !over && !isPlacingChess && !aiThinking && !!p;

  const tipText = useMemo(() => {
    if (over) {
      const names = winingStatus.map(w => g.players[w as PlayerKey]).filter(Boolean);
      return winingStatus[0] === 'draw' ? g.tips.over : fmt(g.tips.overWin, { names: names.join(g.players.and) });
    }
    const who = p ? g.players[p] : '';
    if (aiThinking) return fmt(g.tips.thinking, { who });
    if (isPlacingChess) return fmt(g.tips.placing, { who });
    // 還沒選棋子就先講「移動棋子」；選了之後改報還剩幾格，走完再改報該蓋牆了
    if (!selected) return fmt(g.tips.moving, { who });
    return `${who} · ${onWallStep ? g.pad.hintWall : fmt(g.pad.remain, { n: remainSteps })}`;
  }, [isPlacingChess, over, winingStatus, p, aiThinking, selected, onWallStep, remainSteps, g]);

  /*
    手指裝置上不出現：它說的三件事（輪到誰、現在該做什麼、還有沒有破牆）
    控制盤已經全部說了。對局結束後控制盤會收起來，那時才輪到它出場。

    寫在 JSX 外面是因為字型子集的掃描器一進反引號就整段當成字串，
    寫在模板字串裡的註解會被算進子集。
  */
  const hideOnTouch = over ? '' : 'coarse:hidden';

  const breakWallText = useMemo(() => {
    if (over || isPlacingChess || playersNum !== 3 || !p) return null;
    return breakWallCountObj?.[p] > 0 ? g.tips.breakLeft : g.tips.breakNone;
  }, [isPlacingChess, over, playersNum, breakWallCountObj, p, g]);

  /*
    橫式時寬度不能超過「棋盤右邊剩下的空間」。

    棋盤置中、邊長 min(90dvw, 90dvh)（見 PlayClient 的 BOARD_FREE），右邊剩
    (100dvw - 棋盤) / 2；扣掉 right-5 與同樣寬的呼吸空間就是上限。
    沒有這條的話，手機橫放（667×375）對局結束時這塊會壓在棋盤最右欄上；
    桌機把視窗拉成矮寬時更糟，整局的步驟提示都蓋著棋盤。
    直式不需要：那邊棋盤上下有空，這塊落在棋盤下方。
  */
  const fitGutter = 'landscape:max-w-[calc((100dvw_-_min(90dvw,90dvh))/2_-_2.5rem)]';

  const shell = `fixed bottom-5 right-5 flex flex-col items-end gap-2 rounded-2xl px-5 py-4 font-black lg:bottom-[5dvh] ${fitGutter} ${hideOnTouch} ${
    over || !p ? 'bg-tile-ink text-tile-cream' : PLAYER_ON[p]
  }`;

  const body = (
    <>
      {steps && (
        <span className="flex items-center gap-2.5 text-xl leading-none">
          <span className={onWallStep ? 'opacity-55' : ''}>{g.pad.step1}</span>
          <span className="opacity-55">›</span>
          <span className={onWallStep ? '' : 'opacity-55'}>{g.pad.step2}</span>
        </span>
      )}
      <span className={steps ? 'text-[15px] font-bold opacity-85' : 'text-base'}>{tipText}</span>
      {breakWallText && <span className="text-xs font-bold opacity-80">{breakWallText}</span>}
    </>
  );

  if (over && onShowResult) {
    return (
      <button type="button" onClick={onShowResult} className={`${shell} text-right transition hover:brightness-110 active:scale-[0.98]`}>
        {body}
        <span className="flex items-center gap-1.5 text-xs font-bold opacity-80">
          <GiLaurelCrown aria-hidden="true" />
          {g.champion.seeResult}
        </span>
      </button>
    );
  }

  return (
    <div className={shell} style={over || !p ? undefined : { backgroundColor: playerVar(p) }}>
      {body}
    </div>
  );
})
