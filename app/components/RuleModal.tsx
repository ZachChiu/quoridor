"use client"
import React, { useCallback, useEffect, useState } from 'react';
import { GiPlayButton, GiRuleBook } from "react-icons/gi";
import Modal from './Modal';
import Button from './Button';
import TutorialBoard from './TutorialBoard';
import { STEPS } from './tutorialSteps';
import { useRuleModal } from '@/contexts/RuleModalContext';
import { useLocale, useMessages } from '@/i18n/LocaleProvider';
import { STEP_TEXT } from '@/i18n/content/steps';
import { track } from '@/utils/analytics';
import { useSwipePager } from '@/hook/useSwipePager';

/**
 * 逐步教學。
 *
 * 原本是一整面規則文字 —— 第一次玩的人得先讀完才敢下第一手，
 * 而讀完通常也記不得。改成一步一頁，每頁只講一件事，並且配一張
 * 用真實視覺語彙畫出來的小盤面：教學裡看到的形狀，進遊戲認得出來。
 */
const RuleModal: React.FC = () => {
  const { ruleModalState, setRuleModalState } = useRuleModal();
  const locale = useLocale();
  const t = useMessages();
  // 圖不分語言、文字分 —— 兩邊靠索引對齊，長度由測試鎖住
  const text = STEP_TEXT[locale];
  const [step, setStep] = useState(0);
  const goTo = useCallback((n: number) => {
    setStep(Math.min(Math.max(n, 0), STEPS.length - 1));
  }, []);
  const isOpen = ruleModalState.isOpen;
  // 掛在對局頁裡（PlayClient）：開著時離開對局，下次進來不該一進門就是打開的
  useEffect(() => () => setRuleModalState((s) => (s.isOpen ? { ...s, isOpen: false } : s)), [setRuleModalState]);
  const last = step === STEPS.length - 1;

  const close = () => {
    // 讀到第幾步就關掉 —— 看得出規則是在哪一步把人勸退的
    track('tutorial_close', { game: 'wall-go', step: step + 1, steps: STEPS.length, finished: last });
    setRuleModalState({ ...ruleModalState, isOpen: false });
  };

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

  const next = useCallback(() => goTo(step + 1), [goTo, step]);
  const prev = useCallback(() => goTo(step - 1), [goTo, step]);

  // 軌道式滑動（手指拖到哪裡軌道就跟到哪裡，放開才吸附）與左右方向鍵：見 hook/useSwipePager.ts
  const pager = useSwipePager(STEPS.length, step, goTo);

  return (
    <Modal
      isOpen={isOpen}
      onClose={close}
      title={t.rules.kicker}
      kicker={`${step + 1} / ${STEPS.length}`}
      icon={GiRuleBook}
      band={{ className: 'bg-tile-forest', fg: 'text-tile-cream' }}
      onKeyDown={pager.onKeyDown}
      /*
        不要捲軸（Zach 說的）。放不下的時候縮的是盤面，不是讓內容捲：
        盤面寬度跟著可視高度走（見下方軌道裡的 clamp）。
        手機橫放那種矮到連最小盤面都塞不下的，改成盤面在左、文字在右，
        面板順勢加寬。真的還是超出一點時仍可以滑，只是不畫出捲軸。
      */
      panelClassName="short:max-w-2xl"
      bodyClassName="short:py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      footer={
        <>
          {step > 0 && (
            <Button
              color="text-ink-soft hover:bg-tile-ink/[0.06] bg-transparent"
              handleClickEvent={prev}
            >
              {t.ui.prev}
            </Button>
          )}
          {/* 主要按鈕用深墨而非琥珀。Modal 的標題色帶已經帶了一個色相，
              按鈕再帶一個就是兩個不相干的顏色在同一塊小面板上打架
              —— 綠色 header 配黃色按鈕看起來怪，原因就在這。
              深墨不屬於任何色相，放在哪個色帶下面都成立。 */}
          <Button color="bg-tile-ink text-tile-cream" handleClickEvent={last ? close : next}>
            <span className="flex items-center justify-center gap-2">
              {last ? <><GiPlayButton /> {t.ui.startGame}</> : t.ui.next}
            </span>
          </Button>
        </>
      }
    >
      {/*
        軌道。八頁並排，用 translateX 位移到當前頁。
        touch-pan-y 讓垂直捲動照常交給瀏覽器，只有水平歸我們處理。
      */}
      <div {...pager.viewport}>
        <div className="flex items-start" style={pager.trackStyle}>
          {STEPS.map((st, i) => (
            <div key={i} className="w-full shrink-0 px-0.5 short:flex short:items-start short:gap-5">
              {/* 盤面寬度 = 可視高度扣掉色帶、文字、按鈕約 33rem，夾在 120–200px。
                  矮螢幕並排時改扣色帶與按鈕就好。 */}
              <div className="mx-auto w-[clamp(6rem,calc(100svh-33rem),12.5rem)] short:mx-0 short:w-[clamp(6rem,calc(100svh-16rem),10rem)] short:shrink-0">
                <TutorialBoard {...st.board} />
              </div>
              {/* 標題搬進軌道裡 —— 留在色帶上的話，滑動時內容在移動、
                  標題卻是瞬間換掉，兩者對不起來。 */}
              <div className="short:min-w-0 short:flex-1">
                <h3 className="mt-4 text-base font-black leading-snug short:mt-0">{text[i].title}</h3>
                <p className="mt-1.5 min-h-28 whitespace-pre-line text-sm leading-relaxed short:min-h-0">{text[i].body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 進度點。也可以直接點某一步跳過去 —— 回頭查某一條規則時不必一路按。 */}
      <div className="mt-2 flex justify-center gap-2">
        {STEPS.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`${i + 1}. ${text[i].title}`}
            aria-current={i === step ? 'step' : undefined}
            onClick={() => goTo(i)}
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
