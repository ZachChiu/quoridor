import { LEVELS, type Level } from '@/games/liars-dice/ai';
import { MAX_PLAYERS, MIN_PLAYERS, type Options } from '@/games/liars-dice/engine';

/**
 * 對局模式與網址 hash（同盲五子棋的 modeHash：選模式與對局在同一頁，重整不必再選一次）。
 *
 *   #ai-5-normal             對電腦，5 人（自己＋4 個電腦），普通
 *   #local-4                 同一台輪流，4 人
 *   規則開關接在後面：-nowild（1 不萬用）、-exact（可以喊剛好），例如 #ai-3-hard-exact
 */
export type DiceMode =
  | ({ opponent: 'ai'; players: number; level: Level } & Options)
  | ({ opponent: 'local'; players: number } & Options);

export function modeHash(m: DiceMode): string {
  const rules = `${m.wild ? '' : '-nowild'}${m.exact ? '-exact' : ''}`;
  return m.opponent === 'ai' ? `#ai-${m.players}-${m.level}${rules}` : `#local-${m.players}${rules}`;
}

export function readModeHash(hash: string): DiceMode | null {
  const parts = hash.replace(/^#/, '').split('-');
  const [kind, n] = parts;
  const players = Number(n);
  if (!Number.isInteger(players) || players < MIN_PLAYERS || players > MAX_PLAYERS) return null;
  const rest = parts.slice(kind === 'ai' ? 3 : 2);
  if (rest.some((r) => r !== 'nowild' && r !== 'exact')) return null;
  const options = { wild: !rest.includes('nowild'), exact: rest.includes('exact') };
  if (kind === 'local' && players >= 2) return { opponent: 'local', players, ...options };
  if (kind === 'ai' && (LEVELS as readonly string[]).includes(parts[2])) return { opponent: 'ai', players, level: parts[2] as Level, ...options };
  return null;
}

/** 選單頁的 class 與「有 hash 就先藏起選單」的內嵌 script（同盲五子棋） */
export const MENU_CLASS = 'liars-dice-menu';
export const HIDE_MENU_STYLE_ID = 'liars-dice-menu-hide';
export const HIDE_MENU_SCRIPT = `if(/^#(ai|local)-/.test(location.hash)&&!document.getElementById('${HIDE_MENU_STYLE_ID}')){var s=document.createElement('style');s.id='${HIDE_MENU_STYLE_ID}';s.textContent='.${MENU_CLASS}{visibility:hidden}';document.head.appendChild(s)}`;
