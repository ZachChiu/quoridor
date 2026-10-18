'use client';
import { useState } from 'react';
import PlatformDialog from './PlatformDialog';
import { useGameText } from '@/i18n/LocaleProvider';
import { useUser } from '@/contexts/UserContext';
import { sendContact } from '@/utils/gameService';
import { track } from '@/utils/analytics';

/**
 * 平台頁尾的「聯絡我們」：文字連結開一個深色表單，只有留言與選填的聯絡方式。
 *
 * Wall Go 首頁的聯絡是右上角的圓鈕＋奶油底回饋視窗（含「玩起來的感覺」三個表情）；
 * 平台不綁任何一款遊戲，問「玩起來的感覺」沒有意義，所以只留文字。
 * 送出走同一條路徑（sendContact → feedback/，mode: 'contact'），GA 的 source 記成 platform。
 * Firebase 要按下送出才載入，平台首頁不會因此多載 SDK。
 */
export default function PlatformContact() {
  const g = useGameText();
  const { ensureUser } = useUser();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [contact, setContact] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle');

  const canSend = message.trim().length > 0 && state !== 'sending';

  const openForm = () => {
    setMessage(''); setContact(''); setState('idle');
    setOpen(true);
    track('contact_open', {});
  };

  const submit = async () => {
    if (!canSend) return;
    setState('sending');
    track('feedback_send', { source: 'platform' });
    try {
      const uid = await ensureUser();
      await sendContact({
        message: message.trim(),
        contact: contact.trim() || undefined,
        ua: navigator.userAgent.slice(0, 400),
        viewport: `${window.innerWidth}x${window.innerHeight}`,
      }, uid);
      setState('sent');
    } catch {
      setState('failed');
    }
  };

  const field = 'w-full rounded-md border border-tile-cream/20 bg-plat-bg px-3.5 py-3 text-base text-tile-cream placeholder:text-plat-muted/70 focus:border-tile-cream/60 focus:outline-none';

  return (
    <>
      <button type="button" onClick={openForm} className="font-bold underline underline-offset-2 hover:text-tile-cream">
        {g.contact.button}
      </button>

      <PlatformDialog isOpen={open} onClose={() => setOpen(false)} title={state === 'sent' ? g.feedback.sent : g.contact.heading}>
        {state === 'sent' ? (
          <p className="text-sm leading-relaxed text-plat-muted">{g.contact.sentBody}</p>
        ) : (
          <form className="flex flex-col gap-3" onSubmit={(e) => { e.preventDefault(); void submit(); }}>
            <label className="flex flex-col gap-1.5 text-sm font-bold text-plat-muted">
              {g.feedback.messageLabel}
              <textarea rows={4} maxLength={800} value={message} onChange={(e) => setMessage(e.target.value)} placeholder={g.contact.placeholder} className={`${field} resize-none`} />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-bold text-plat-muted">
              {g.feedback.contactLabel}
              <input type="text" maxLength={120} value={contact} onChange={(e) => setContact(e.target.value)} placeholder={g.feedback.contactPlaceholder} className={field} />
            </label>
            <p className="text-xs leading-relaxed text-plat-muted">{g.contact.note}</p>
            {/* 紅字在深色底上只有約 3.7:1，小字不夠 —— 用紅色淡底襯米白字 */}
            {state === 'failed' && <p role="alert" className="rounded-md bg-brand-red/20 px-3 py-2 text-sm font-bold">{g.feedback.failed}</p>}
            {/* 平台的主要按鈕是紅底白字（Netflix 式），不是 Wall Go 的深墨 */}
            <button
              type="submit"
              disabled={!canSend}
              className="mt-1 h-12 rounded-md bg-brand-red text-base font-black text-white transition disabled:bg-plat-raised disabled:text-plat-muted/70"
            >
              {state === 'sending' ? g.feedback.sending : g.feedback.submit}
            </button>
          </form>
        )}
      </PlatformDialog>
    </>
  );
}
