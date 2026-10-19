'use client';
import { useState } from 'react';
import type { IconType } from 'react-icons';
import type { TileOrigin } from '@/components/GameTile';
import Modal from '@/components/Modal';
import DifficultyButtons from '@/components/DifficultyButtons';
import { useTransition } from '@/contexts/TransitionContext';
import { useMessages, useLocale } from '@/i18n/LocaleProvider';
import { localePath } from '@/i18n/locales';
import { baghChal } from '@/i18n/routes';
import type { Side } from '@/games/bagh-chal/engine';
import type { Difficulty } from '@/games/bagh-chal/ai';
import { soloHash } from './soloHash';
import { GoatToken, InviteToken, LocalToken, RulesToken, TigerToken } from './tokens';

const INK = 'rgb(var(--tile-ink))';
const CREAM = 'rgb(var(--tile-cream))';
/** 印刷棋盤的配色（跟 BaghBoard 同一組） */
const SAFFRON = '#e3a43c';
const OLIVE = '#5b6620';
const TERRACOTTA = '#b8471f';
const BROWN = '#4a2616';
const PAPER = '#fbf4e1';

const wipeFrom = ({ rect, color, icon, iconSize, label, kicker, row, iconColor, fg }: TileOrigin) => ({
  x: rect.left + rect.width / 2,
  y: rect.top + rect.height / 2,
  color,
  from: { width: rect.width, height: rect.height, radius: 16 },
  icon, iconSize, label, kicker, row, iconColor, fg,
});

/**
 * 選單的一塊。行為跟 Wall Go 首頁的 GameTile 一樣（有 href 給爬蟲、按下去把位置交給轉場），
 * 長相是虎羊棋自己的：印刷棋盤的配色、內縮一道細框（像那張棋盤的雙線外框）、AI 畫的圓牌。
 */
function BaghTile({ icon: Icon, kicker, label, bg, fg, wide, href, onClick }: {
  icon: IconType; kicker?: string; label: string; bg: string; fg: string; wide?: boolean; href?: string;
  onClick: (origin: TileOrigin) => void;
}) {
  const fire = (e: React.MouseEvent<HTMLElement>) => onClick({
    rect: e.currentTarget.getBoundingClientRect(), color: bg, icon: Icon, label, kicker, row: wide,
    iconSize: e.currentTarget.querySelector('svg')?.getBoundingClientRect().height, iconColor: fg, fg,
  });
  // 深色磁磚的內框用淡奶油線，淺色磁磚用淡褐線
  const line = fg === CREAM ? 'rgba(250,247,240,0.4)' : 'rgba(74,38,22,0.3)';
  const props = {
    style: { background: bg, color: fg, boxShadow: `inset 0 0 0 6px ${bg}, inset 0 0 0 8px ${line}` },
    className: `${wide ? 'col-span-2 flex-row gap-3 py-4' : 'aspect-square flex-col gap-2'}
      group flex items-center justify-center rounded-2xl p-3 transition hover:brightness-[0.96] active:scale-[0.97]`,
  };
  const inner = (
    <>
      <Icon className={`tile-icon tile-icon-anim drop-shadow-[0_2px_0_rgba(20,16,16,0.35)] ${wide ? 'shrink-0 text-5xl' : 'text-[5.5rem] md:text-8xl'}`} />
      <span className={wide ? 'text-lg font-black' : 'flex flex-col items-center'}>
        {!wide && kicker && <span className="text-xs font-bold opacity-80 md:text-sm">{kicker}</span>}
        <span className={wide ? '' : 'text-lg font-black leading-tight md:text-xl'}>{label}</span>
      </span>
    </>
  );
  if (href) {
    return (
      <a href={href} {...props} onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
        e.preventDefault();
        fire(e);
      }}>{inner}</a>
    );
  }
  return <button type="button" {...props} onClick={fire}>{inner}</button>;
}

/**
 * Bagh Chal 首頁的選單。
 *
 * 跟電腦下分成「當老虎」「當羊」兩塊：選邊是這款遊戲最大的決定（兩邊玩法完全不同），
 * 藏進選單裡就看不出來。按下去再問難度（同一個難度 Modal 的樣子）。
 * 圖示全是 AI 畫的米提拉圓牌（棋子兩枚＋選單三枚），不用剪影圖示（Zach：不要直接用某種 ICON）。
 */
export default function BaghHub() {
  const t = useMessages();
  const b = t.baghChal;
  const locale = useLocale();
  const { navigate } = useTransition();
  const [side, setSide] = useState<Side | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);

  const startSolo = (difficulty: Difficulty, at: { x: number; y: number }) => {
    if (!side) return;
    setSide(null);
    navigate(localePath(locale, baghChal('/solo')) + soloHash(side, difficulty), { wipe: { ...at, color: '#f1e6cd' } });
  };

  return (
    <div className="relative z-20 grid w-full grid-cols-2 gap-3 md:gap-4">
      <BaghTile icon={TigerToken} bg={SAFFRON} fg={INK} kicker={b.vsAi} label={b.tiger}
        href={localePath(locale, baghChal('/solo'))} onClick={() => setSide('tiger')} />
      <BaghTile icon={GoatToken} bg={OLIVE} fg={CREAM} kicker={b.vsAi} label={b.goat}
        href={localePath(locale, baghChal('/solo'))} onClick={() => setSide('goat')} />
      <BaghTile icon={LocalToken} bg={TERRACOTTA} fg={CREAM} label={b.local}
        href={localePath(locale, baghChal('/local'))}
        onClick={(o) => navigate(localePath(locale, baghChal('/local')), { wipe: wipeFrom(o) })} />
      {/* 邀請朋友：先問自己當哪一邊，連線頁再開房 */}
      <BaghTile icon={InviteToken} bg={BROWN} fg={CREAM} label={b.invite} onClick={() => setInviteOpen(true)} />
      <BaghTile icon={RulesToken} bg={PAPER} fg={INK} label={t.home.rules} wide
        href={localePath(locale, baghChal('/rules'))}
        onClick={(o) => navigate(localePath(locale, baghChal('/rules')), { wipe: wipeFrom(o) })} />

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
                onClick={(e) => {
                  const r = e.currentTarget.getBoundingClientRect();
                  setInviteOpen(false);
                  navigate(localePath(locale, baghChal('/online')) + `#new=${s}`, { wipe: { x: r.left + r.width / 2, y: r.top + r.height / 2, color: '#f1e6cd' } });
                }}
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
