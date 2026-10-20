'use client';
import { useState } from 'react';
import Modal from '@/components/Modal';
import { useRouter } from 'next/navigation';
import { useMessages, useLocale } from '@/i18n/LocaleProvider';
import { localePath } from '@/i18n/locales';
import { baghChal } from '@/i18n/routes';
import type { Side } from '@/games/bagh-chal/engine';
import type { Difficulty } from '@/games/bagh-chal/ai';
import { soloHash } from './soloHash';
import { GOAT_SRC, GoatToken, INVITE_SRC, InviteToken, LOCAL_SRC, TIGER_SRC, TigerToken } from './tokens';
import { BaghDifficulty } from './BaghUi';

/** 一般點擊交給呼叫端（走轉場）；修飾鍵與中鍵放行給瀏覽器，「在新分頁開啟」才不會壞 */
const intercept = (fn: () => void) => (e: React.MouseEvent<HTMLAnchorElement>) => {
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
  e.preventDefault();
  fn();
};

/**
 * 四個按鈕之一：紙色卡片、深墨粗框，中間一枚 AI 畫的圓牌，下面兩行字。
 * 有靜態目標的給 href（爬蟲走得進去、cmd 點可以開新分頁），連線要先選邊所以沒有。
 */
function Choice({ src, label, sub, href, onClick }: { src: string; label: string; sub: string; href?: string; onClick: () => void }) {
  const cls = 'group flex flex-col items-center justify-center gap-1 rounded-2xl bg-bagh-paper px-2 py-[max(0.75rem,2dvh)] text-center transition fine:hover:bg-bagh-paper-deep active:scale-[0.97]';
  const inner = (
    <>
      {/* 背景圖、影子用 box-shadow（不用 <img>＋filter，iPhone 的 WebKit 會漏畫，見 BaghBoard） */}
      <span aria-hidden="true" className="mb-1 block size-[min(25vw,11dvh,118px)] rounded-full bg-cover bg-center shadow-[0_3px_0_rgba(74,38,22,0.45)] transition-transform fine:group-hover:-translate-y-0.5"
        style={{ backgroundImage: `url(${src})` }} />
      <span className="text-lg font-black leading-tight">{label}</span>
      <span className="text-xs font-bold leading-snug text-ink-soft">{sub}</span>
    </>
  );
  if (href) return <a href={href} onClick={intercept(onClick)} className={cls}>{inner}</a>;
  return <button type="button" onClick={onClick} className={cls}>{inner}</button>;
}

/**
 * Bagh Chal 首頁的四個按鈕（2026-10-20 Zach：首頁變成四個按鈕 —— 老虎、羊、本地、連線）：
 * 當老虎／當羊跟電腦下（按下去問難度）、兩人同一台、連線對戰（先選自己當哪一邊）。
 * 圖示是 AI 畫的米提拉圓牌，不用剪影圖示。虎羊棋裡面換頁不播轉場（Zach：開門特效只放在平台進虎羊棋那一下），
 * 在點擊當下 router.push —— 仍在使用者手勢裡，WebKit 的返回鍵不會略過這筆紀錄。
 */
export default function BaghHub() {
  const t = useMessages();
  const b = t.baghChal;
  const locale = useLocale();
  const router = useRouter();
  const [side, setSide] = useState<Side | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const go = (path: string) => router.push(localePath(locale, path));

  const startSolo = (difficulty: Difficulty) => {
    if (!side) return;
    setSide(null);
    router.push(localePath(locale, baghChal('/solo')) + soloHash(side, difficulty));
  };

  return (
    <div className="relative z-20 flex w-full flex-col items-center gap-[max(0.75rem,2dvh)]">
      <div className="grid w-full grid-cols-2 gap-2.5">
        <Choice src={TIGER_SRC} label={b.tiger} sub={b.vsAi} href={localePath(locale, baghChal('/solo'))} onClick={() => setSide('tiger')} />
        <Choice src={GOAT_SRC} label={b.goat} sub={b.vsAi} href={localePath(locale, baghChal('/solo'))} onClick={() => setSide('goat')} />
        <Choice src={LOCAL_SRC} label={b.local} sub={b.localSub} href={localePath(locale, baghChal('/local'))} onClick={() => go(baghChal('/local'))} />
        <Choice src={INVITE_SRC} label={b.onlineTitle} sub={b.inviteSub} onClick={() => setInviteOpen(true)} />
      </div>

      <a href={localePath(locale, baghChal('/rules'))} onClick={intercept(() => go(baghChal('/rules')))}
        className="text-sm font-black underline decoration-2 underline-offset-4">
        {b.rulesLink}
      </a>

      <Modal skin="bagh" isOpen={!!side} onClose={() => setSide(null)} title={t.ui.pickLevel}
        kicker={`${b.playAs}：${side === 'goat' ? b.goat : b.tiger}`}
        icon={side === 'goat' ? GoatToken : TigerToken}
        band={side === 'goat' ? { className: 'bg-[#5b6620]', fg: 'text-tile-cream' } : { className: 'bg-[#e3a43c]', fg: 'text-tile-ink' }}>
        <BaghDifficulty onPick={startSolo} />
      </Modal>

      <Modal skin="bagh" isOpen={inviteOpen} onClose={() => setInviteOpen(false)} title={b.pickSide} kicker={b.onlineTitle}
        icon={InviteToken} band={{ className: 'bg-[#4a2616]', fg: 'text-tile-cream' }}>
        <div className="grid grid-cols-2 gap-2.5">
          {(['tiger', 'goat'] as const).map((s) => {
            const Icon = s === 'tiger' ? TigerToken : GoatToken;
            return (
              <button key={s} type="button"
                onClick={() => { setInviteOpen(false); router.push(localePath(locale, baghChal('/online')) + `#new=${s}`); }}
                className="flex flex-col items-center gap-2 rounded-2xl bg-bagh-paper py-5 text-xl font-black text-tile-ink transition hover:bg-bagh-paper-deep active:scale-[0.97]">
                <Icon className="text-6xl" />{s === 'tiger' ? b.tiger : b.goat}
              </button>
            );
          })}
        </div>
      </Modal>
    </div>
  );
}
