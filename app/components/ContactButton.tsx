'use client';
import { useState } from 'react';
import { LuMessageCircle } from 'react-icons/lu';
import FeedbackModal from './FeedbackModal';
import { useGameText } from '@/i18n/LocaleProvider';
import { useUser } from '@/contexts/UserContext';
import { sendContact } from '@/utils/gameService';
import { track } from '@/utils/analytics';

/**
 * 首頁右上角的「聯絡我們」，放在語言切換旁邊、同一個尺寸與樣式。
 *
 * 先前只有打完一局才能留言，沒玩完、或只是想提建議的人沒有管道。
 * 打開的是同一個回饋視窗（variant="contact"），存進同一個 feedback，
 * 以 mode: 'contact' 區分，不附棋譜。
 */
export default function ContactButton() {
  const g = useGameText();
  const { ensureUser } = useUser();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => { setOpen(true); track('contact_open', {}); }}
        aria-label={g.contact.button}
        aria-haspopup="dialog"
        className="relative grid size-10 place-items-center rounded-full after:absolute after:-inset-0.5 after:content-[''] bg-tile-ink/[0.06] text-xl text-ink-soft transition hover:bg-tile-ink/[0.12] active:scale-95"
      >
        <LuMessageCircle aria-hidden="true" />
      </button>
      <FeedbackModal
        isOpen={open}
        onClose={() => setOpen(false)}
        variant="contact"
        onSubmit={async (rating, message, contact) =>
          sendContact({
            rating: rating ?? undefined,
            message,
            contact: contact || undefined,
            // 規則限 400 字，App 內建瀏覽器的 UA 會超過
            ua: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 400) : '',
            viewport: typeof window !== 'undefined'
              ? `${window.innerWidth}x${window.innerHeight}@${window.devicePixelRatio}` : '',
          }, await ensureUser())
        }
      />
    </>
  );
}
