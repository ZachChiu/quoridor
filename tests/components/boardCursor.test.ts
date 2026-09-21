import { describe, it, expect } from 'vitest';
import { isCursorKey, nextCursor, type Cursor } from '@/components/boardCursor';

const SIZE = 7;
const at = (row: number, col: number): Cursor => ({ row, col });
const go = (c: Cursor, key: string, ctrl = false) => nextCursor(c, key, { size: SIZE, ctrl });

describe('isCursorKey', () => {
  it('方向鍵與 Home / End 算', () => {
    for (const k of ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End']) {
      expect(isCursorKey(k), k).toBe(true);
    }
  });

  it('其他鍵不算 —— 它們不能被 preventDefault 掉', () => {
    for (const k of ['Enter', ' ', 'Tab', 'Escape', 'a', 'PageUp']) {
      expect(isCursorKey(k), k).toBe(false);
    }
  });
});

describe('nextCursor · 方向鍵', () => {
  it('四個方向各走一格', () => {
    expect(go(at(3, 3), 'ArrowUp')).toEqual(at(2, 3));
    expect(go(at(3, 3), 'ArrowDown')).toEqual(at(4, 3));
    expect(go(at(3, 3), 'ArrowLeft')).toEqual(at(3, 2));
    expect(go(at(3, 3), 'ArrowRight')).toEqual(at(3, 4));
  });

  /*
    邊界要停在原地，不繞回另一邊。
    繞回去的話，按住方向鍵的人會突然出現在盤面的另一頭 ——
    那看起來像按錯鍵，而不像功能。
  */
  it('撞到邊界就停住，不繞回另一邊', () => {
    expect(go(at(0, 0), 'ArrowUp')).toEqual(at(0, 0));
    expect(go(at(0, 0), 'ArrowLeft')).toEqual(at(0, 0));
    expect(go(at(6, 6), 'ArrowDown')).toEqual(at(6, 6));
    expect(go(at(6, 6), 'ArrowRight')).toEqual(at(6, 6));
  });
});

describe('nextCursor · Home / End', () => {
  it('Home 到行首、End 到行尾，都留在同一列', () => {
    expect(go(at(4, 3), 'Home')).toEqual(at(4, 0));
    expect(go(at(4, 3), 'End')).toEqual(at(4, 6));
  });

  it('加 Ctrl 是整盤的頭尾', () => {
    expect(go(at(4, 3), 'Home', true)).toEqual(at(0, 0));
    expect(go(at(4, 3), 'End', true)).toEqual(at(6, 6));
  });

  it('已經在行首行尾時按同一顆，位置不變', () => {
    expect(go(at(2, 0), 'Home')).toEqual(at(2, 0));
    expect(go(at(2, 6), 'End')).toEqual(at(2, 6));
  });
});

describe('nextCursor · 其他鍵', () => {
  it('不是移動鍵一律回 null，由呼叫端決定怎麼辦', () => {
    for (const k of ['Enter', ' ', 'Tab', 'x']) {
      expect(nextCursor(at(1, 1), k, { size: SIZE }), k).toBeNull();
    }
  });
});

describe('nextCursor · 不同盤面大小', () => {
  it('3×3 的行尾是 2 不是 6 —— size 真的有被用到', () => {
    expect(nextCursor(at(1, 0), 'End', { size: 3 })).toEqual(at(1, 2));
    expect(nextCursor(at(1, 1), 'End', { size: 3, ctrl: true })).toEqual(at(2, 2));
    expect(nextCursor(at(2, 2), 'ArrowDown', { size: 3 })).toEqual(at(2, 2));
  });
});
