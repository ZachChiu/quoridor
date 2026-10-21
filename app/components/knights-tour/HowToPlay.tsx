'use client';
import { GiRuleBook } from 'react-icons/gi';
import Modal from '@/components/Modal';
import Button from '@/components/Button';
import { useMessages } from '@/i18n/LocaleProvider';
import { useTextTable } from '@/i18n/gameText';
import { knightMoves } from '@/games/knights-tour/engine';
import { TEXT, type KnightsText } from '@/games/knights-tour/text';
import TourBoard from './TourBoard';
import { BAND_CHALK, MODAL_PANEL } from './GameFrame';

/** 示意圖：5×5 正中央的騎士與它跳得到的八格 */
const DEMO_PATH = [12];
const DEMO_TARGETS = new Set(knightMoves(5, 12));

/** 遊戲規則彈窗（選單與對局中共用）。色帶照全站慣例用森綠 */
export default function HowToPlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useTextTable<KnightsText>(TEXT);
  const m = useMessages();
  return (
    <Modal isOpen={open} onClose={onClose} title={t.rules} kicker={t.title} icon={GiRuleBook}
      band={BAND_CHALK} panelClassName={MODAL_PANEL}
      footer={<Button color="bg-[#322e2a] text-[#edddc7]" handleClickEvent={onClose}>{t.gotIt}</Button>}>
      <div className="flex flex-col gap-4">
        <div className="mx-auto w-full max-w-[180px]"><TourBoard n={5} path={DEMO_PATH} targets={DEMO_TARGETS} /></div>
        <ol className="flex flex-col gap-2.5 text-sm font-bold leading-relaxed">
          {t.howSteps.map((step, i) => (
            <li key={i} className="flex gap-2"><span className="font-black tabular-nums">{i + 1}.</span><span>{step}</span></li>
          ))}
        </ol>
        <p className="text-xs font-bold leading-relaxed text-ink-soft">{t.source}</p>
        <p className="text-[11px] leading-relaxed text-ink-soft">
          {m.credits.prefix}{' '}
          <a className="underline" href="https://game-icons.net" target="_blank" rel="noopener noreferrer">game-icons.net</a>
          {m.credits.middle}{' '}
          <a className="underline" href="https://lucide.dev" target="_blank" rel="noopener noreferrer">Lucide</a>
          {m.credits.suffix}
        </p>
      </div>
    </Modal>
  );
}
