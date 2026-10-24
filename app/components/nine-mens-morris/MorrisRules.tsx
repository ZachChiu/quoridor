'use client';
import { GiRuleBook } from 'react-icons/gi';
import Modal from '@/components/Modal';
import { useMessages } from '@/i18n/LocaleProvider';
import type { MorrisText } from '@/games/nine-mens-morris/text';
import { MORRIS_BAND, MORRIS_PANEL } from './ui';

/**
 * 「怎麼玩」彈窗：七條短規則＋節目規則的差別。選模式的畫面與對局中共用。
 * 一頁拱頂的羊皮紙（不用色帶）：標題前一個朱紅的段落符；規則一條一段，段首的 ¶ 朱紅、群青交替，
 * 手抄本分段就是這樣標的。節目規則的說明圈一道朱紅細線。最後一段是名字的由來。
 */
export function MorrisRulesModal({ t, open, onClose, showRules }: { t: MorrisText; open: boolean; onClose: () => void; showRules?: boolean }) {
  const m = useMessages();
  return (
    <Modal isOpen={open} onClose={onClose} title={t.rulesHeading} kicker={t.title} icon={GiRuleBook}
      band={MORRIS_BAND} panelClassName={MORRIS_PANEL}
      footer={<button type="button" onClick={onClose} className="nmm-arch is-small is-red flex-1 pb-3 pt-4 font-black">{m.ui.close}</button>}>
      <ol className="flex flex-col gap-3">
        {t.rules.map((r, i) => (
          <li key={i} className="flex gap-2.5 text-sm font-bold leading-relaxed text-[#1e120a]">
            <span aria-hidden="true" className={`shrink-0 text-lg font-black leading-snug ${i % 2 ? 'text-[#4b4577]' : 'text-[#c54915]'}`}>¶</span>
            <span>{r}</span>
          </li>
        ))}
      </ol>
      <p className={`mt-4 rounded-[3px] p-3 text-xs font-bold leading-relaxed shadow-[inset_0_0_0_1.5px_#c54915] ${showRules ? 'bg-[#e3c99c] text-[#1e120a]' : 'text-ink-soft'}`}>
        {t.showRulesDetail}
      </p>
      {/* 名字的由來（節目裡叫什麼、原文是什麼），每款的規則最後一段都有 */}
      <p className="nmm-pilcrow mt-3 text-xs font-bold leading-relaxed text-[#1e120a]/75">{t.nameNote}</p>
    </Modal>
  );
}
