'use client';
import { useState } from 'react';
import { LuCircleHelp } from 'react-icons/lu';
import Modal from '@/components/Modal';
import { useMessages } from '@/i18n/LocaleProvider';
import { useTextTable } from '@/i18n/gameText';
import { useStep, useSwipePager } from '@/hook/useSwipePager';
import { TEXT, type HexText } from '@/games/hexagon/text';
import { FIGS, RuleFigure } from './RulesSteps';
import { BAND, MODAL_PANEL } from './styles';

/**
 * 怎麼玩（首頁與對局共用）：一步一張小盤面配字，一次一步，可以左右滑（hook/useSwipePager.ts，同 Wall Go 的遊玩方式）。
 * 頁碼是一排小六角磚，目前那頁上鈷藍。每次打開從第一步開始。
 */
export default function HowToPlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useTextTable<HexText>(TEXT);
  const m = useMessages();
  const [i, goTo] = useStep(FIGS.length);
  const pager = useSwipePager(FIGS.length, i, goTo);
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) goTo(0);
  }
  const last = i === FIGS.length - 1;

  return (
    <Modal isOpen={open} onClose={onClose} title={t.howTo} kicker={t.title} icon={LuCircleHelp}
      band={BAND} panelClassName={`${MODAL_PANEL} short:max-w-2xl`} onKeyDown={pager.onKeyDown}
      bodyClassName="short:py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      footer={
        <>
          {i > 0 && <button type="button" className="hx-tile flex-1 font-black" onClick={() => goTo(i - 1)}>{m.ui.prev}</button>}
          <button type="button" className="hx-cobalt flex-1 font-black" onClick={last ? onClose : () => goTo(i + 1)}>
            {last ? t.gotIt : m.ui.next}
          </button>
        </>
      }>
      <div {...pager.viewport}>
        <div className="flex items-start" style={pager.trackStyle}>
          {FIGS.map((_, n) => (
            <div key={n} aria-hidden={n !== i} className="w-full shrink-0 px-0.5 short:flex short:items-start short:gap-5">
              <RuleFigure index={n} className="mx-auto w-[clamp(8rem,calc(100svh-30rem),14rem)] short:mx-0 short:w-[clamp(6rem,calc(100svh-16.5rem),10rem)] short:shrink-0" />
              <div className="short:min-w-0 short:flex-1">
                <h3 className="mt-3 text-base font-black leading-snug short:mt-0">{t.howTitles[n]}</h3>
                <p className="mt-1.5 text-sm font-bold leading-relaxed">{t.howSteps[n]}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-4 flex justify-center gap-1.5 short:mt-2" role="group" aria-label={`${i + 1} / ${FIGS.length}`}>
        {FIGS.map((_, n) => (
          <button key={n} type="button" onClick={() => goTo(n)} aria-label={`${n + 1}. ${t.howTitles[n]}`} aria-current={n === i ? 'step' : undefined}
            className={`hx-hex grid h-8 w-7 place-items-center text-xs font-black tabular-nums ${n === i ? 'bg-[#2a5b8a] text-[#f5e5d3]' : 'bg-[#22283b]/10'}`}>
            {n + 1}
          </button>
        ))}
      </div>
    </Modal>
  );
}
