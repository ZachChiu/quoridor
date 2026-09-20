'use client';
import React, { useState } from 'react';
import { GiChatBubble } from 'react-icons/gi';
import Modal from './Modal';
import Button from './Button';
import { trackButtonClick } from '@/utils/analytics';
import { useGameText, useMessages } from '@/i18n/LocaleProvider';

/**
 * 對局結束後的意見回饋。
 *
 * 出現在冠軍畫面之後，因為那是唯一「剛玩完、還記得剛剛發生什麼」的時刻。
 * 平常擺一顆回報按鈕在角落，按的人幾乎只有已經生氣的人。
 *
 * 表單刻意只有三格心情＋一段文字，聯絡方式選填。多要一個欄位就少一批人送出，
 * 而我們要的是「哪裡怪怪的」，不是完整的問題報告 —— 完整的部分由
 * 自動附上的棋譜補足（見 sendFeedback）。
 */
type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (rating: 1 | 2 | 3, message: string, contact: string) => Promise<void>;
};

const FACES: { value: 1 | 2 | 3; emoji: string; tone: string }[] = [
  { value: 1, emoji: '😖', tone: 'bg-tile-red text-tile-cream' },
  { value: 2, emoji: '🙂', tone: 'bg-tile-amber text-tile-ink' },
  { value: 3, emoji: '🤩', tone: 'bg-tile-forest text-tile-cream' },
];

const FeedbackModal: React.FC<Props> = ({ isOpen, onClose, onSubmit }) => {
  const g = useGameText();
  const t = useMessages();
  const closeLabel = t.ui.close;
  const faceLabels = [g.feedback.bad, g.feedback.ok, g.feedback.good];
  const [rating, setRating] = useState<1 | 2 | 3 | null>(null);
  const [message, setMessage] = useState('');
  const [contact, setContact] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle');

  // 重新打開時清空。留著上次的內容會讓人以為已經送出過了。
  const [wasOpen, setWasOpen] = useState(isOpen);
  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    if (isOpen) { setRating(null); setMessage(''); setContact(''); setState('idle'); }
  }

  const submit = async () => {
    if (!rating || state === 'sending') return;
    setState('sending');
    trackButtonClick('send_feedback');
    try {
      await onSubmit(rating, message.trim(), contact.trim());
      setState('sent');
    } catch {
      // 送不出去要說 —— 靜默失敗比沒有這個功能更糟，
      // 使用者花了時間寫，卻不知道它沒到。
      setState('failed');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={state === 'sent' ? g.feedback.sent : g.feedback.heading}
      kicker={g.feedback.kicker}
      icon={GiChatBubble}
      band={{ className: 'bg-tile-purple', fg: 'text-tile-cream' }}
      footer={
        state === 'sent' ? (
          <Button color="bg-tile-ink text-tile-cream" handleClickEvent={onClose}>{closeLabel}</Button>
        ) : (
          <>
            <Button color="text-ink-soft hover:bg-tile-ink/[0.06] bg-transparent" handleClickEvent={onClose}>
              {g.feedback.later}
            </Button>
            <Button
              color={rating ? 'bg-tile-ink text-tile-cream' : 'bg-tile-ink/20 text-tile-ink/40'}
              handleClickEvent={submit}
            >
              {state === 'sending' ? g.feedback.sending : g.feedback.submit}
            </Button>
          </>
        )
      }
    >
      {state === 'sent' ? (
        <p className="text-sm leading-relaxed">
          {g.feedback.sentBody}
        </p>
      ) : (
        <>
          <div className="flex gap-2" role="radiogroup" aria-label={g.feedback.ratingLabel}>
            {FACES.map((f) => (
              <button
                key={f.value}
                type="button"
                role="radio"
                aria-checked={rating === f.value}
                onClick={() => setRating(f.value)}
                className={`flex flex-1 flex-col items-center gap-1 rounded-xl py-3 text-sm font-black transition ${
                  rating === f.value ? f.tone : 'bg-tile-ink/[0.06] text-ink-soft'
                }`}
              >
                <span className="text-2xl leading-none" aria-hidden="true">{f.emoji}</span>
                {faceLabels[f.value - 1]}
              </button>
            ))}
          </div>

          <label className="mt-4 block">
            <span className="text-sm font-bold">{g.feedback.messageLabel}</span>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, 800))}
              rows={3}
              className="mt-1.5 w-full resize-none rounded-xl bg-primary-50 p-3 text-sm outline-none ring-tile-ink/30 focus:ring-2"
              placeholder={g.feedback.placeholder}
            />
          </label>

          <label className="mt-3 block">
            <span className="text-sm font-bold text-ink-soft">{g.feedback.contactLabel}</span>
            <input
              value={contact}
              onChange={(e) => setContact(e.target.value.slice(0, 120))}
              className="mt-1.5 w-full rounded-xl bg-primary-50 p-3 text-sm outline-none ring-tile-ink/30 focus:ring-2"
              placeholder={g.feedback.contactPlaceholder}
            />
          </label>

          <p className="mt-3 text-xs leading-relaxed text-ink-soft">
            {g.feedback.note}
          </p>

          {state === 'failed' && (
            <p className="mt-3 rounded-xl bg-tile-red/10 p-3 text-sm font-bold text-tile-red">
              {g.feedback.failed}
            </p>
          )}
        </>
      )}
    </Modal>
  );
};

export default FeedbackModal;
