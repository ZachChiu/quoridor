"use client"
import React, { useCallback, useState } from 'react';
import { GiPlayButton, GiRuleBook } from "react-icons/gi";
import Modal from './Modal';
import Button from './Button';
import TutorialBoard from './TutorialBoard';
import { STEPS } from './tutorialSteps';
import { useRuleModal } from '@/contexts/RuleModalContext';
import { useSwipe } from '@/hook/useSwipe';

/**
 * 逐步教學。
 *
 * 原本是一整面規則文字 —— 第一次玩的人得先讀完才敢下第一手，
 * 而讀完通常也記不得。改成一步一頁，每頁只講一件事，並且配一張
 * 用真實視覺語彙畫出來的小盤面：教學裡看到的形狀，進遊戲認得出來。
 */
const RuleModal: React.FC = () => {
  const { ruleModalState, setRuleModalState } = useRuleModal();
  const [step, setStep] = useState(0);
  const isOpen = ruleModalState.isOpen;
  const last = step === STEPS.length - 1;

  const close = () => setRuleModalState({ ...ruleModalState, isOpen: false });

  // 每次重新打開都從第一步開始 —— 上次讀到哪裡對下一次沒有意義，
  // 而停在中間會讓人以為前面幾步已經看過了。
  //
  // 在 render 期間比對前值，而不是用 useEffect：後者會多跑一次 render
  // （先畫出舊的步驟再跳回第一步），也是 react-hooks/set-state-in-effect 在擋的事。
  // 這是 React 官方對「prop 改變時調整 state」的建議寫法。
  const [wasOpen, setWasOpen] = useState(isOpen);
  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    if (isOpen) setStep(0);
  }

  // 左右方向鍵翻頁。Escape 關閉由 Modal 統一處理。
  const onKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'ArrowRight') setStep((s) => Math.min(s + 1, STEPS.length - 1));
    if (e.key === 'ArrowLeft') setStep((s) => Math.max(s - 1, 0));
  }, []);


  const next = useCallback(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), []);
  const prev = useCallback(() => setStep((s) => Math.max(s - 1, 0)), []);
  // 手機上翻頁不該只有底下那顆按鈕 —— 一步一頁的東西，手指預期可以滑。
  const swipe = useSwipe(next, prev);

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
          {/* 主要按鈕用深墨而非琥珀。Modal 的標題色帶已經帶了一個色相，
              按鈕再帶一個就是兩個不相干的顏色在同一塊小面板上打架
              —— 綠色 header 配黃色按鈕看起來怪，原因就在這。
              深墨不屬於任何色相，放在哪個色帶下面都成立。 */}
          <Button color="bg-tile-ink text-tile-cream" handleClickEvent={last ? close : () => setStep(step + 1)}>
            <span className="flex items-center justify-center gap-2">
              {last ? <><GiPlayButton /> 開始遊戲</> : '下一步'}
            </span>
          </Button>
        </>
      }
    >
      {/* 滑動範圍涵蓋圖與文字，不只棋盤 —— 手指會落在哪裡不該由我決定。
          touch-pan-y 讓垂直捲動照常交給瀏覽器，只有水平方向歸我們處理。 */}
      <div className="touch-pan-y" {...swipe}>
        <div className="mx-auto w-full max-w-[240px]">
          <TutorialBoard {...current.board} />
        </div>

        <p className="mt-4 min-h-[5.5rem] text-sm leading-relaxed">{current.body}</p>
      </div>

      {/* 進度點。也可以直接點某一步跳過去 —— 回頭查某一條規則時不必一路按。 */}
      <div className="mt-2 flex justify-center gap-2">
        {STEPS.map((s, i) => (
          <button
            key={s.title}
            type="button"
            aria-label={`第 ${i + 1} 步：${s.title}`}
            aria-current={i === step ? 'step' : undefined}
            onClick={() => setStep(i)}
            // 圓點本身是 8px，當觸控目標太小（WCAG 2.5.8 最低 24px）。
            // 按鈕撐到 24px 但保持透明，看到的仍然只有那顆點。
            className="group grid h-6 min-w-6 place-items-center"
          >
            <span
              className={`block h-2 rounded-full transition-all ${
                i === step ? 'w-6 bg-tile-ink' : 'w-2 bg-tile-ink/25 group-hover:bg-tile-ink/50'
              }`}
            />
          </button>
        ))}
      </div>

    </Modal>
  );
};

export default RuleModal;
