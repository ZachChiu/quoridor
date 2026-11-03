'use client';
import { GiRuleBook } from 'react-icons/gi';
import Modal from '@/components/Modal';
import { useTextTable } from '@/i18n/gameText';
import { TEXT } from '@/games/question-and-truth/text';
import { QT_BAND, QT_PANEL } from './palette';
import PlayingCard from './PlayingCard';
import { CIRCLED } from './qtext';

/**
 * 怎麼玩：節目版五步（編號是 A♦ 到 5♦ —— 畫裡老千藏的就是方塊 A），接著 11 題的清單，最後兩種自己的挑戰。
 * 首頁與對局共用；出處（credit）只在首頁那份寫。規則頁（一步一張圖、可以左右滑）留到下一步（docs/question-and-truth.md）。
 */
export default function HowToModal({ open, onClose, credit = false }: { open: boolean; onClose: () => void; credit?: boolean }) {
  const t = useTextTable(TEXT);
  return (
    <Modal isOpen={open} onClose={onClose} title={t.howTo} kicker={t.title} icon={GiRuleBook} band={QT_BAND} panelClassName={`${QT_PANEL} lg:!max-w-[620px]`}>
      <ol className="flex flex-col gap-3.5">
        {t.steps.map((s, i) => (
          <li key={s.title} className="flex gap-3">
            <PlayingCard card={{ rank: i + 1, suit: 2 }} className="mt-0.5 w-8 outline outline-1 outline-[color-mix(in_srgb,var(--qt-ink)_20%,transparent)]" />
            <div className="min-w-0">
              <p className="text-base font-black leading-tight">{s.title}</p>
              <p className="mt-0.5 text-sm font-bold leading-relaxed opacity-80">{s.body}</p>
            </div>
          </li>
        ))}
      </ol>
      <div className="mt-5 grid grid-cols-1 gap-x-4 gap-y-1 rounded-[6px] bg-[color-mix(in_srgb,var(--qt-ink)_6%,transparent)] p-3 text-sm font-bold sm:grid-cols-2">
        {Object.entries(t.q).map(([k, q]) => (
          <p key={k} className="flex gap-1.5"><span className="w-5 shrink-0">{CIRCLED[Number(k)]}</span><span>{q.name}</span></p>
        ))}
      </div>
      <h3 className="mt-5 text-sm font-black opacity-70">{t.challengeLabel}</h3>
      <ul className="mt-2 flex flex-col gap-2.5">
        {t.challengeSteps.map((s) => (
          <li key={s.title}>
            <p className="text-base font-black leading-tight">{s.title}</p>
            <p className="mt-0.5 text-sm font-bold leading-relaxed opacity-80">{s.body}</p>
          </li>
        ))}
      </ul>
      {credit && <p className="mt-5 text-xs font-bold leading-relaxed opacity-60">{t.credit}</p>}
    </Modal>
  );
}
