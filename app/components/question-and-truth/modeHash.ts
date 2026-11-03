import { LEVELS, type Level } from '@/games/question-and-truth/ai';

/**
 * 模式放在網址 hash（同大話骰、盲五子棋：選模式與對局在同一頁，重整不必再選一次、返回鍵回選單）。
 *
 *   #ai-normal   節目版對電腦（easy／normal／hard）
 *   #local       節目版同一台兩人
 *   #daily       每日一手
 *   #six         六問一猜
 */
export type QtMode = { kind: 'ai'; level: Level } | { kind: 'local' } | { kind: 'daily' } | { kind: 'six' };

export function modeHash(m: QtMode): string {
  return m.kind === 'ai' ? `#ai-${m.level}` : `#${m.kind}`;
}

export function readModeHash(hash: string): QtMode | null {
  const h = hash.replace(/^#/, '');
  if (h === 'local' || h === 'daily' || h === 'six') return { kind: h };
  const m = /^ai-(\w+)$/.exec(h);
  if (m && (LEVELS as readonly string[]).includes(m[1])) return { kind: 'ai', level: m[1] as Level };
  return null;
}

/** 選單頁的 class 與「有 hash 就先藏起選單」的內嵌 script（同大話骰） */
export const MENU_CLASS = 'qt-menu';
export const HIDE_MENU_STYLE_ID = 'qt-menu-hide';
export const HIDE_MENU_SCRIPT = `if(/^#(ai-|local$|daily$|six$)/.test(location.hash)&&!document.getElementById('${HIDE_MENU_STYLE_ID}')){var s=document.createElement('style');s.id='${HIDE_MENU_STYLE_ID}';s.textContent='.${MENU_CLASS}{visibility:hidden}';document.head.appendChild(s)}`;
