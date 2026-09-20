"use client"
import React, { useCallback, useEffect, useState } from 'react';
import { GiPlayButton, GiRuleBook } from "react-icons/gi";
import Modal from './Modal';
import Button from './Button';
import TutorialBoard, { type TutorialBoardProps } from './TutorialBoard';
import { useRuleModal } from '@/contexts/RuleModalContext';

/**
 * 逐步教學。
 *
 * 原本是一整面規則文字 —— 第一次玩的人得先讀完才敢下第一手，
 * 而讀完通常也記不得。改成一步一頁，每頁只講一件事，並且配一張
 * 用真實視覺語彙畫出來的小盤面：教學裡看到的形狀，進遊戲認得出來。
 */
interface Step {
  title: string;
  body: string;
  board: TutorialBoardProps;
}

const STEPS: Step[] = [
  {
    title: '目標：圍出最大的地盤',
    body: '用牆把區域封閉起來。封閉區域裡只有你的棋子，那塊地就是你的。最後地盤格數最多的人獲勝。',
    board: {
      size: 4,
      pieces: [{ at: [0, 0], player: 'A' }, { at: [3, 3], player: 'B' }],
      territory: [
        { at: [0, 0], player: 'A' }, { at: [0, 1], player: 'A' }, { at: [1, 0], player: 'A' }, { at: [1, 1], player: 'A' },
        { at: [3, 3], player: 'B' }, { at: [3, 2], player: 'B' },
      ],
      hWalls: [{ at: [1, 0], player: 'A' }, { at: [1, 1], player: 'A' }, { at: [2, 2], player: 'B' }, { at: [2, 3], player: 'B' }],
      vWalls: [{ at: [0, 1], player: 'A' }, { at: [1, 1], player: 'A' }, { at: [3, 1], player: 'B' }],
    },
  },
  {
    title: '開局：輪流放棋子',
    body: '兩人局各有 4 顆棋子，其中 2 顆已在盤上，其餘依「紅、藍、藍、紅」的蛇形順序擺放，先後手才公平。三人局則是每人 2 顆，全部自己擺。',
    board: {
      size: 4,
      pieces: [{ at: [0, 0], player: 'A' }, { at: [3, 3], player: 'B' }, { at: [0, 3], player: 'B' }],
      dots: [[1, 1], [2, 1], [1, 2], [2, 2], [3, 0]],
    },
  },
  {
    title: '移動：每回合走 0 到 2 格',
    body: '選一顆自己的棋子，上下左右移動 0 到 2 格。兩格可以是直線，也可以轉彎走 L 形。灰點就是走得到的位置 —— 不想動也可以，直接築牆。',
    board: {
      size: 4,
      selected: { at: [1, 1], player: 'A' },
      pieces: [{ at: [1, 1], player: 'A' }],
      dots: [[0, 1], [1, 0], [1, 2], [2, 1], [0, 0], [0, 2], [2, 0], [2, 2], [3, 1], [1, 3]],
    },
  },
  {
    title: '築牆：移動後一定要築一道',
    body: '移動結束後，必須在那顆棋子的相鄰邊築一道牆。這是強制的，不能跳過。半透明的預覽就是可以築的位置，滑過去會變成實心。',
    board: {
      size: 4,
      selected: { at: [1, 1], player: 'A' },
      pieces: [{ at: [1, 1], player: 'A' }],
      ghosts: [
        { at: [1, 1], side: 'top', player: 'A' }, { at: [1, 1], side: 'bottom', player: 'A' },
        { at: [1, 1], side: 'left', player: 'A' }, { at: [1, 1], side: 'right', player: 'A' },
      ],
    },
  },
  {
    title: '牆不分敵我',
    body: '任何人築的牆，所有人都擋。你用來圍自己地盤的牆，同時也可能封死自己的退路 —— 每一手都是算計與取捨。棋盤的外圍本身也算牆。',
    board: {
      size: 4,
      pieces: [{ at: [1, 1], player: 'A' }, { at: [1, 2], player: 'B' }],
      vWalls: [{ at: [1, 1], player: 'A' }],
      dots: [[0, 1], [2, 1], [1, 0]],
    },
  },
  {
    title: '圍地：區域裡只能有你的棋子',
    body: '被牆完全封閉的區域，如果裡面只有你的棋子，整塊都算你的。若裡面沒有棋子、或同時有別人的棋子，就是中立區，誰都不計分。',
    board: {
      size: 4,
      pieces: [{ at: [0, 0], player: 'A' }, { at: [0, 3], player: 'A' }, { at: [3, 0], player: 'B' }],
      territory: [{ at: [0, 0], player: 'A' }, { at: [1, 0], player: 'A' }],
      hWalls: [{ at: [1, 0], player: 'A' }],
      vWalls: [{ at: [0, 0], player: 'A' }, { at: [1, 0], player: 'A' }],
    },
  },
  {
    title: '結束與勝負',
    body: '當所有棋子都被封閉在各自的區域裡，遊戲結束。地盤格數最多的人獲勝；同分則並列。三人局每人另有一次破牆機會，可以拆掉一道相鄰的牆再繼續移動。',
    board: {
      size: 4,
      pieces: [{ at: [0, 0], player: 'A' }, { at: [3, 3], player: 'B' }],
      territory: [
        { at: [0, 0], player: 'A' }, { at: [0, 1], player: 'A' }, { at: [1, 0], player: 'A' },
        { at: [1, 1], player: 'A' }, { at: [2, 0], player: 'A' },
        { at: [3, 3], player: 'B' }, { at: [3, 2], player: 'B' }, { at: [2, 3], player: 'B' },
      ],
      hWalls: [{ at: [2, 0], player: 'A' }, { at: [1, 1], player: 'A' }, { at: [1, 3], player: 'B' }],
      vWalls: [{ at: [0, 1], player: 'A' }, { at: [1, 1], player: 'A' }, { at: [2, 1], player: 'B' }, { at: [3, 1], player: 'B' }],
    },
  },
];

const RuleModal: React.FC = () => {
  const { ruleModalState, setRuleModalState } = useRuleModal();
  const [step, setStep] = useState(0);
  const isOpen = ruleModalState.isOpen;
  const last = step === STEPS.length - 1;

  const close = () => setRuleModalState({ ...ruleModalState, isOpen: false });

  // 每次重新打開都從第一步開始 —— 上次讀到哪裡對下一次沒有意義，
  // 而停在中間會讓人以為前面幾步已經看過了。
  useEffect(() => { if (isOpen) setStep(0); }, [isOpen]);

  // 左右方向鍵翻頁。Escape 關閉由 Modal 統一處理。
  const onKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'ArrowRight') setStep((s) => Math.min(s + 1, STEPS.length - 1));
    if (e.key === 'ArrowLeft') setStep((s) => Math.max(s - 1, 0));
  }, []);

  const current = STEPS[step];

  return (
    <Modal
      isOpen={isOpen}
      onClose={close}
      title={current.title}
      kicker={`遊玩方式 · ${step + 1} / ${STEPS.length}`}
      icon={GiRuleBook}
      band={{ className: 'bg-tile-forest', fg: 'text-tile-cream' }}
      onKeyDown={onKeyDown}
      footer={
        <>
          {step > 0 && (
            <Button
              color="text-ink-soft hover:bg-tile-ink/[0.06] bg-transparent"
              handleClickEvent={() => setStep(step - 1)}
            >
              上一步
            </Button>
          )}
          <Button handleClickEvent={last ? close : () => setStep(step + 1)}>
            <span className="flex items-center justify-center gap-2">
              {last ? <><GiPlayButton /> 開始遊戲</> : '下一步'}
            </span>
          </Button>
        </>
      }
    >
      <div className="mx-auto w-full max-w-[240px]">
        <TutorialBoard {...current.board} />
      </div>

      <p className="mt-4 min-h-[5.5rem] text-sm leading-relaxed">{current.body}</p>

      {/* 進度點。也可以直接點某一步跳過去 —— 回頭查某一條規則時不必一路按。 */}
      <div className="mt-2 flex justify-center gap-2">
        {STEPS.map((s, i) => (
          <button
            key={s.title}
            type="button"
            aria-label={`第 ${i + 1} 步：${s.title}`}
            aria-current={i === step ? 'step' : undefined}
            onClick={() => setStep(i)}
            className={`h-2 rounded-full transition-all ${
              i === step ? 'w-6 bg-tile-ink' : 'w-2 bg-tile-ink/25 hover:bg-tile-ink/50'
            }`}
          />
        ))}
      </div>

      {/* CC BY 3.0 要求署名。放這裡而不是頁尾，是因為這個站沒有頁尾，
          而遊玩方式是唯一每個玩家都會打開一次的地方。 */}
      <p className="mt-5 text-center text-[11px] text-ink-soft">
        圖示來自 game-icons.net 與 Lucide，依 CC BY 3.0 / ISC 授權使用
      </p>
    </Modal>
  );
};

export default RuleModal;
