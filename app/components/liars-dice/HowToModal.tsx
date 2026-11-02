'use client';
import { GiRuleBook } from 'react-icons/gi';
import Modal from '@/components/Modal';
import { useTextTable } from '@/i18n/gameText';
import type { Face } from '@/games/liars-dice/engine';
import { TEXT } from '@/games/liars-dice/text';
import Die from './Die';
import { LD_BAND, LD_PANEL } from './palette';

/**
 * 怎麼玩：五步，每一步的編號就是一顆骰子（1 到 5 點）。首頁與對局共用；出處（credit）只在首頁那份寫。
 * 規則頁（一步一張圖、可以左右滑）留到下一步（docs/liars-dice.md）。
 */
export default function HowToModal({ open, onClose, credit = false }: { open: boolean; onClose: () => void; credit?: boolean }) {
  const t = useTextTable(TEXT);
  return (
    <Modal isOpen={open} onClose={onClose} title={t.howTo} kicker={t.title} icon={GiRuleBook} band={LD_BAND} panelClassName={LD_PANEL}>
      <ol className="flex flex-col gap-3.5">
        {t.steps.map((s, i) => (
          <li key={s.title} className="flex gap-3">
            <Die face={(i + 1) as Face} tone="ink" className="mt-0.5 size-7" />
            <div className="min-w-0">
              <p className="text-base font-black leading-tight">{s.title}</p>
              <p className="mt-0.5 text-sm font-bold leading-relaxed opacity-80">{s.body}</p>
            </div>
          </li>
        ))}
      </ol>
      {credit && <p className="mt-5 text-xs font-bold leading-relaxed opacity-60">{t.credit}</p>}
    </Modal>
  );
}
