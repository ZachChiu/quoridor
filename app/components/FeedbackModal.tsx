'use client';
import React, { useState } from 'react';
import { GiChatBubble } from 'react-icons/gi';
import Modal from './Modal';
import { InviteToken } from './bagh-chal/tokens';
import Button from './Button';
import { track, type GameSlug } from '@/utils/analytics';
import { useGameText, useMessages } from '@/i18n/LocaleProvider';
import { DEFAULT_CORNER, type CornerTheme } from './cornerTheme';

/**
 * 對局結束後的意見回饋。
 *
 * 出現在冠軍畫面之後，因為那是唯一「剛玩完、還記得剛剛發生什麼」的時刻。
 * 平常擺一顆回報按鈕在角落，按的人幾乎只有已經生氣的人。
 *
 * 表單刻意只有三格心情＋一段文字，聯絡方式選填。多要一個欄位就少一批人送出，
 * 而我們要的是「哪裡怪怪的」，不是完整的問題報告 —— 完整的部分由
 * 自動附上的棋譜補足（見 sendFeedback）。
 *
 * variant="contact" 是首頁右上角的「聯絡我們」：同一個視窗，但不綁某一局 ——
 * 標題、提示與說明換成一般留言用的；評分選填，改成「有寫字才能送」。
 */
type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (rating: 1 | 2 | 3 | null, message: string, contact: string) => Promise<void>;
  variant?: 'game' | 'contact';
  /** 那款遊戲的樣子（見 cornerTheme.ts）。對局後的回饋是 Wall Go 的，不傳 */
  theme?: CornerTheme;
  /** 留言框的範例句。預設是 Wall Go 的（講三人局），其他遊戲的對局回饋要換成自己的 */
  placeholder?: string;
  /** 哪一款遊戲的回饋（GA 的 game 參數）。Wall Go 首頁的聯絡我們也算 Wall Go */
  game: GameSlug;
};

/*
  三個表情不各帶一個顏色：紅黃綠擠在同一塊小面板上就是雜。
  意思由表情本身承擔，選中的那個反成深墨 —— 跟整站「一個面板一個色相＋中性」一致。
*/
const FACES: { value: 1 | 2 | 3; emoji: string }[] = [
  { value: 1, emoji: '😖' },
  { value: 2, emoji: '🙂' },
  { value: 3, emoji: '🤩' },
];

const FeedbackModal: React.FC<Props> = ({ isOpen, onClose, onSubmit, variant = 'game', theme, placeholder, game }) => {
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

  const isContact = variant === 'contact';
  // 各遊戲打開的是那款自己的樣子（Zach 10/24）；虎羊棋的圖示是蠟封信圓牌
  const th = theme ?? DEFAULT_CORNER;
  const bagh = th.skin === 'bagh';
  const soft = th.soft ?? 'text-ink-soft';
  // 對局回饋要選評分；聯絡我們評分選填，但至少要寫點什麼
  const canSend = isContact ? message.trim().length > 0 : rating !== null;
  const copy = isContact
    ? { heading: g.contact.heading, kicker: g.contact.kicker, ratingLabel: g.contact.ratingLabel,
        placeholder: g.contact.placeholder, note: g.contact.note, sentBody: g.contact.sentBody }
    : { heading: g.feedback.heading, kicker: g.feedback.kicker, ratingLabel: g.feedback.ratingLabel,
        placeholder: placeholder ?? g.feedback.placeholder, note: g.feedback.note, sentBody: g.feedback.sentBody };

  const submit = async () => {
    if (!canSend || state === 'sending') return;
    setState('sending');
    track('feedback_send', { game, entry: isContact ? 'contact' : 'game', rating: rating ?? undefined });
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
      skin={th.skin}
      panelClassName={th.panelClassName}
      isOpen={isOpen}
      onClose={onClose}
      title={state === 'sent' ? g.feedback.sent : copy.heading}
      kicker={copy.kicker}
      icon={bagh ? InviteToken : GiChatBubble}
      band={th.band}
      footer={
        state === 'sent' ? (
          <Button color={th.primary} handleClickEvent={onClose}>{closeLabel}</Button>
        ) : (
          <>
            <Button color={theme ? th.secondary : 'text-ink-soft hover:bg-tile-ink/[0.06] bg-transparent'} handleClickEvent={onClose}>
              {g.feedback.later}
            </Button>
            <Button
              color={canSend ? th.primary : theme ? `${th.secondary} opacity-50` : 'bg-tile-ink/20 text-tile-ink/40'}
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
          {copy.sentBody}
        </p>
      ) : (
        <>
          {isContact && <p className={`mb-2 text-sm font-bold ${soft}`}>{copy.ratingLabel}</p>}
          <div className="flex gap-2" role="radiogroup" aria-label={copy.ratingLabel}>
            {FACES.map((f) => (
              <button
                key={f.value}
                type="button"
                role="radio"
                aria-checked={rating === f.value}
                // 聯絡我們的評分是選填：再點一次同一個可以取消
                onClick={() => setRating(isContact && rating === f.value ? null : f.value)}
                className={`flex flex-1 flex-col items-center gap-1 rounded-xl py-3 text-sm font-black transition ${
                  rating === f.value ? th.primary : th.secondary
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
              className={`mt-1.5 w-full resize-none rounded-xl p-3 text-sm ${th.field}`}
              placeholder={copy.placeholder}
            />
          </label>

          <label className="mt-3 block">
            <span className={`text-sm font-bold ${soft}`}>{g.feedback.contactLabel}</span>
            <input
              value={contact}
              onChange={(e) => setContact(e.target.value.slice(0, 120))}
              className={`mt-1.5 w-full rounded-xl p-3 text-sm ${th.field}`}
              placeholder={g.feedback.contactPlaceholder}
            />
          </label>

          <p className={`mt-3 text-xs leading-relaxed ${soft}`}>
            {copy.note}
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
