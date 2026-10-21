'use client';
import { GiRuleBook } from 'react-icons/gi';
import Modal from '@/components/Modal';
import Button from '@/components/Button';
import { useMessages } from '@/i18n/LocaleProvider';
import type { MorrisText } from '@/games/nine-mens-morris/text';

/**
 * 「怎麼玩」彈窗：七條短規則＋節目規則的差別。選模式的畫面與對局中共用。
 * 羊皮紙面板、群青色帶（《遊戲之書》插圖的底色）：整頁只留一個色相。
 */
export function MorrisRulesModal({ t, open, onClose, showRules }: { t: MorrisText; open: boolean; onClose: () => void; showRules?: boolean }) {
  const m = useMessages();
  return (
    <Modal isOpen={open} onClose={onClose} title={t.rulesHeading} kicker={t.title} icon={GiRuleBook}
      band={{ className: 'bg-[#4b4577]', fg: 'text-[#eee0c4]' }} panelClassName="!bg-[#eee0c4]"
      footer={<Button handleClickEvent={onClose}>{m.ui.close}</Button>}>
      <ol className="flex flex-col gap-3">
        {t.rules.map((r, i) => (
          <li key={i} className="flex gap-3 text-sm font-bold leading-relaxed text-[#1e120a]">
            <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[#1e120a] text-xs font-black tabular-nums text-[#eee0c4]">{i + 1}</span>
            <span>{r}</span>
          </li>
        ))}
      </ol>
      <p className={`mt-4 rounded-xl p-3 text-xs font-bold leading-relaxed ${showRules ? 'bg-[#4b4577] text-[#eee0c4]' : 'bg-[#1e120a]/[0.07] text-ink-soft'}`}>
        {t.showRulesDetail}
      </p>
    </Modal>
  );
}
