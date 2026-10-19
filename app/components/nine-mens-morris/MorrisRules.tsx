'use client';
import { GiRuleBook } from 'react-icons/gi';
import Modal from '@/components/Modal';
import Button from '@/components/Button';
import { useMessages } from '@/i18n/LocaleProvider';
import type { MorrisText } from '@/games/nine-mens-morris/text';

/**
 * 「怎麼玩」彈窗：七條短規則＋節目規則的差別。選模式的畫面與對局中共用。
 * 色帶用遊戲主色（不是 Wall Go 首頁規則磁磚的森綠）：整頁只留一個色相。
 */
export function MorrisRulesModal({ t, open, onClose, showRules }: { t: MorrisText; open: boolean; onClose: () => void; showRules?: boolean }) {
  const m = useMessages();
  return (
    <Modal isOpen={open} onClose={onClose} title={t.rulesHeading} kicker={t.title} icon={GiRuleBook}
      band={{ className: 'bg-[#1d3b8a]', fg: 'text-tile-cream' }}
      footer={<Button handleClickEvent={onClose}>{m.ui.close}</Button>}>
      <ol className="flex flex-col gap-3">
        {t.rules.map((r, i) => (
          <li key={i} className="flex gap-3 text-sm font-bold leading-relaxed">
            <span className="grid size-6 shrink-0 place-items-center rounded-full bg-tile-ink text-xs font-black tabular-nums text-tile-cream">{i + 1}</span>
            <span>{r}</span>
          </li>
        ))}
      </ol>
      <p className={`mt-4 rounded-xl p-3 text-xs font-bold leading-relaxed ${showRules ? 'bg-[#1d3b8a] text-tile-cream' : 'bg-tile-ink/[0.06] text-ink-soft'}`}>
        {t.showRulesDetail}
      </p>
    </Modal>
  );
}
