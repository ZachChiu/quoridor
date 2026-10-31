'use client';
import { useEffect, useRef, useState } from 'react';
import { GiRuleBook } from 'react-icons/gi';
import Modal from '@/components/Modal';
import { useMessages } from '@/i18n/LocaleProvider';
import { useTextTable } from '@/i18n/gameText';
import { useStep, useSwipePager } from '@/hook/useSwipePager';
import { TEXT, type KnightsText } from '@/games/knights-tour/text';
import { FIGS, RuleFigure } from './RulesSteps';
import { BAND_CHALK, MODAL_PANEL } from './styles';
import { track } from '@/utils/analytics';

/**
 * 對局中的說明彈窗（節目挑戰與練習模式共用）：跟規則頁同一份步驟（RulesSteps.tsx），一次一步。
 * 六張並排在一條軌道上，手指左右拖（hook/useSwipePager.ts，同 Wall Go 的遊玩方式）、按底下的上一步／下一步、
 * 點頁碼，或用左右方向鍵（Modal 只在開著時把按鍵交過來）。每次打開從第一步開始。
 *
 * 樣子照這款的圖版：紙色面板、紅粉筆標題下一道雙線（styles.ts），頁碼是一排小的壓痕方塊、目前那頁是紅粉筆，
 * 下一步紅粉筆、上一步壓痕框。這裡不放出處與署名（在規則頁），也不放會離開對局的連結。
 */
export default function HowToPlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useTextTable<KnightsText>(TEXT);
  const m = useMessages();
  const [i, goTo] = useStep(FIGS.length);
  const pager = useSwipePager(FIGS.length, i, goTo);
  // 每次打開都從第一步開始：在 render 期間比對前值（同 RuleModal、BaghRulesSteps）
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) goTo(0);
  }
  const last = i === FIGS.length - 1;
  // 關掉時讀到第幾步（GA 的 tutorial_close，同 Wall Go 的遊玩方式）：按完成、按 ×、點遮罩都算
  const seen = useRef(i);
  useEffect(() => { seen.current = i; }, [i]);
  useEffect(() => {
    if (!open) return;
    return () => track('tutorial_close', { game: 'knights-tour', step: seen.current + 1, steps: FIGS.length, finished: seen.current === FIGS.length - 1 });
  }, [open]);

  return (
    <Modal isOpen={open} onClose={onClose} title={t.rules} kicker={t.title} icon={GiRuleBook}
      band={BAND_CHALK} panelClassName={`${MODAL_PANEL} short:max-w-2xl`} onKeyDown={pager.onKeyDown}
      bodyClassName="short:py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      footer={
        <>
          {i > 0 && <button type="button" className="kt-plate flex-1 font-black" onClick={() => goTo(i - 1)}>{m.ui.prev}</button>}
          <button type="button" className="kt-chalk flex-1 font-black" onClick={last ? onClose : () => goTo(i + 1)}>
            {last ? t.gotIt : m.ui.next}
          </button>
        </>
      }>
      <div {...pager.viewport}>
        <div className="flex items-start" style={pager.trackStyle}>
          {FIGS.map((_, n) => (
            <div key={n} aria-hidden={n !== i} className="w-full shrink-0 px-0.5 short:flex short:items-start short:gap-5">
              {/* 圖的寬度跟著可視高度走（扣掉標題、文字、按鈕約 30rem），不讓彈窗出現捲軸。
                  矮的橫放手機改成圖在左、字在右，只留棋盤（圖說、練習的狀態列拿掉）、頁碼縮小，扣掉標題列、按鈕列、頁碼約 16.5rem */}
              <RuleFigure index={n} shortCompact
                className="mx-auto w-[clamp(7.5rem,calc(100svh-30rem),13rem)] short:mx-0 short:w-[clamp(5.5rem,calc(100svh-16.5rem),9rem)] short:shrink-0" />
              <div className="short:min-w-0 short:flex-1">
                <h3 className="mt-3 text-base font-black leading-snug short:mt-0">{t.howTitles[n]}</h3>
                <p className="mt-1.5 text-sm font-bold leading-relaxed">{t.howSteps[n]}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 頁碼：每一步一顆小壓痕方塊，點了直接跳過去；目前那頁紅粉筆 */}
      <div className="mt-4 flex justify-center gap-1.5 short:mt-2" role="group" aria-label={`${i + 1} / ${FIGS.length}`}>
        {FIGS.map((_, n) => (
          <button key={n} type="button" onClick={() => goTo(n)} aria-label={`${n + 1}. ${t.howTitles[n]}`} aria-current={n === i ? 'step' : undefined}
            className={`kt-serif grid size-7 place-items-center text-sm font-semibold tabular-nums short:size-6 short:text-xs ${n === i ? 'kt-chalk' : 'kt-plate'}`}>
            {n + 1}
          </button>
        ))}
      </div>
    </Modal>
  );
}
