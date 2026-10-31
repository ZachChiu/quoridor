import { LEVELS, type Level } from '@/games/blind-gomoku/ai';

/**
 * 對局模式與網址 hash。開局選模式與對局在同一頁（/blind-gomoku），模式放在 hash：
 * 重整不必再選一次、連結貼出去就是那一局的模式（跟 Bagh Chal 的 `#tiger-normal` 同一個做法）。
 *
 *   #blind-show、#blind-normal、#blind-hard        盲棋對電腦
 *   #classic-show、#classic-normal、#classic-hard  一般五子棋對電腦
 *   #local-blind、#local-classic                   兩人同機
 */
export type GomokuMode =
  | { opponent: 'ai'; blind: boolean; level: Level }
  | { opponent: 'local'; blind: boolean };

export function modeHash(m: GomokuMode): string {
  const look = m.blind ? 'blind' : 'classic';
  return m.opponent === 'local' ? `#local-${look}` : `#${look}-${m.level}`;
}

export function readModeHash(hash: string): GomokuMode | null {
  const [a, b] = hash.replace(/^#/, '').split('-');
  if (a === 'local' && (b === 'blind' || b === 'classic')) return { opponent: 'local', blind: b === 'blind' };
  if ((a === 'blind' || a === 'classic') && (LEVELS as readonly string[]).includes(b)) {
    return { opponent: 'ai', blind: a === 'blind', level: b as Level };
  }
  return null;
}

/** 選單頁的 class 與「有 hash 就先藏起選單」的內嵌 script（見 GomokuMenu） */
export const MENU_CLASS = 'blind-gomoku-menu';
export const HIDE_MENU_STYLE_ID = 'blind-gomoku-menu-hide';
export const HIDE_MENU_SCRIPT = `if(/^#(blind|classic|local)-/.test(location.hash)&&!document.getElementById('${HIDE_MENU_STYLE_ID}')){var s=document.createElement('style');s.id='${HIDE_MENU_STYLE_ID}';s.textContent='.${MENU_CLASS}{visibility:hidden}';document.head.appendChild(s)}`;
