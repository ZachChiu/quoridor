'use client';
import { useState } from 'react';
import type { IconType } from 'react-icons';
import Modal from '@/components/Modal';
import DifficultyButtons from '@/components/DifficultyButtons';
import { DOORS } from '@/components/WipeOverlay';
import { useTransition } from '@/contexts/TransitionContext';
import { useMessages, useLocale } from '@/i18n/LocaleProvider';
import { localePath } from '@/i18n/locales';
import { baghChal } from '@/i18n/routes';
import type { Side } from '@/games/bagh-chal/engine';
import type { Difficulty } from '@/games/bagh-chal/ai';
import { soloHash } from './soloHash';
import { GOAT_SRC, GoatToken, InviteToken, LocalToken, TIGER_SRC, TigerToken } from './tokens';
import { WEAVE_TILE } from './BaghFrame';

/** 一般點擊交給呼叫端（走轉場）；修飾鍵與中鍵放行給瀏覽器，「在新分頁開啟」才不會壞 */
const intercept = (fn: () => void) => (e: React.MouseEvent<HTMLAnchorElement>) => {
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
  e.preventDefault();
  fn();
};

/** 棋子勳章：當老虎／當羊 對電腦。按下去問難度 */
function Medal({ src, label, sub, href, onPick }: { src: string; label: string; sub: string; href: string; onPick: () => void }) {
  return (
    <a href={href} onClick={intercept(onPick)} className="group flex flex-col items-center gap-1.5 text-center">
      {/* 背景圖、影子用 box-shadow（不用 <img>＋filter，iPhone 的 WebKit 會漏畫，見 BaghBoard） */}
      <span aria-hidden="true" className="block size-[min(31vw,15.5dvh,150px)] rounded-full bg-cover bg-center shadow-[0_3px_0_rgba(74,38,22,0.45)] transition-transform group-active:scale-95 fine:group-hover:-translate-y-0.5"
        style={{ backgroundImage: `url(${src})` }} />
      <span className="text-lg font-black leading-tight">{label}</span>
      <span className="text-xs font-bold text-ink-soft">{sub}</span>
    </a>
  );
}

/** 織帶按鈕：左邊一條達卡織紋、AI 圓牌、兩行字、箭頭 */
function Ribbon({ icon: Icon, label, sub, onClick }: { icon: IconType; label: string; sub: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className="flex w-full items-center gap-3 overflow-hidden rounded-xl border-2 border-tile-ink bg-[#fbf4e1] pr-3 text-left transition active:scale-[0.98] fine:hover:bg-[#f4e8cc]">
      <span aria-hidden="true" className="w-3.5 self-stretch border-r-2 border-tile-ink"
        style={{ backgroundImage: WEAVE_TILE, backgroundSize: '100% auto', backgroundRepeat: 'no-repeat round' }} />
      <Icon className="my-2 shrink-0 text-[34px]" />
      <span className="flex min-w-0 flex-1 flex-col py-2">
        <span className="text-base font-black leading-tight">{label}</span>
        <span className="text-xs font-bold text-ink-soft">{sub}</span>
      </span>
      <span aria-hidden="true" className="text-xl font-black">›</span>
    </button>
  );
}

/**
 * Bagh Chal 首頁的選單 —— 「整頁圖騰」提案的平均版（2026-10-20 Zach 選的）：
 * 中間兩枚棋子勳章就是「當老虎／當羊 對電腦」（選邊是這款遊戲最大的決定，兩邊玩法完全不同），
 * 下面兩句勝利條件、兩條織帶按鈕（兩人同一台、邀請朋友），最後是規則連結。
 * 圖示全是 AI 畫的米提拉圓牌，不用剪影圖示；換頁一律是木窗門（DOORS）。
 */
export default function BaghHub() {
  const t = useMessages();
  const b = t.baghChal;
  const locale = useLocale();
  const { navigate } = useTransition();
  const [side, setSide] = useState<Side | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const go = (path: string) => navigate(localePath(locale, path), { wipe: DOORS });

  const startSolo = (difficulty: Difficulty) => {
    if (!side) return;
    setSide(null);
    navigate(localePath(locale, baghChal('/solo')) + soloHash(side, difficulty), { wipe: DOORS });
  };

  return (
    <div className="relative z-20 flex w-full flex-col items-center gap-[max(0.75rem,2.2dvh)]">
      <div className="grid w-full grid-cols-[1fr_auto_1fr] items-start">
        <Medal src={TIGER_SRC} label={b.tiger} sub={b.vsAi} href={localePath(locale, baghChal('/solo'))} onPick={() => setSide('tiger')} />
        <span aria-hidden="true" className="mt-[min(13vw,6.5dvh,62px)] px-1 text-base font-black text-ink-soft">{b.versus}</span>
        <Medal src={GOAT_SRC} label={b.goat} sub={b.vsAi} href={localePath(locale, baghChal('/solo'))} onPick={() => setSide('goat')} />
      </div>

      <p className="text-center text-[13px] font-bold leading-relaxed">{b.goalTiger}<br />{b.goalGoat}</p>

      <div className="flex w-full flex-col gap-2.5">
        <Ribbon icon={LocalToken} label={b.local} sub={b.localSub} onClick={() => go(baghChal('/local'))} />
        {/* 邀請朋友：先問自己當哪一邊，連線頁再開房 */}
        <Ribbon icon={InviteToken} label={b.invite} sub={b.inviteSub} onClick={() => setInviteOpen(true)} />
      </div>

      <a href={localePath(locale, baghChal('/rules'))} onClick={intercept(() => go(baghChal('/rules')))}
        className="flex items-center gap-1.5 text-sm font-black underline decoration-2 underline-offset-4">
        <svg viewBox="-1 -1 2 2" className="size-4" aria-hidden="true">
          {[0, 90, 180, 270].map((a) => <path key={a} transform={`rotate(${a})`} d="M0-1C.28-.5.24-.18 0 0C-.24-.18-.28-.5 0-1Z" fill="#4a2616" />)}
          {[45, 135, 225, 315].map((a) => <path key={a} transform={`rotate(${a})`} d="M0-.72C.22-.4.18-.16 0 0C-.18-.16-.22-.4 0-.72Z" fill="#b8471f" />)}
        </svg>
        {b.rulesLink}
      </a>

      <Modal isOpen={!!side} onClose={() => setSide(null)} title={t.ui.pickLevel}
        kicker={`${b.playAs}：${side === 'goat' ? b.goat : b.tiger}`}
        icon={side === 'goat' ? GoatToken : TigerToken}
        band={side === 'goat' ? { className: 'bg-[#5b6620]', fg: 'text-tile-cream' } : { className: 'bg-[#e3a43c]', fg: 'text-tile-ink' }}>
        <DifficultyButtons onPick={startSolo} />
      </Modal>

      <Modal isOpen={inviteOpen} onClose={() => setInviteOpen(false)} title={b.pickSide} kicker={b.invite}
        icon={InviteToken} band={{ className: 'bg-[#4a2616]', fg: 'text-tile-cream' }}>
        <div className="grid grid-cols-2 gap-3">
          {(['tiger', 'goat'] as const).map((s) => {
            const Icon = s === 'tiger' ? TigerToken : GoatToken;
            return (
              <button key={s} type="button"
                onClick={() => { setInviteOpen(false); navigate(localePath(locale, baghChal('/online')) + `#new=${s}`, { wipe: DOORS }); }}
                className="flex flex-col items-center gap-2 rounded-2xl bg-tile-ink/[0.07] py-5 text-xl font-black text-tile-ink transition hover:bg-tile-ink/[0.12] active:scale-[0.97]">
                <Icon className="text-6xl" />{s === 'tiger' ? b.tiger : b.goat}
              </button>
            );
          })}
        </div>
      </Modal>
    </div>
  );
}
