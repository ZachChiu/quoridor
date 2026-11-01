'use client';
import { useEffect, useState } from 'react';

/**
 * 試看用的切換鈕：選單按鈕的三種置中做法、桌機的版面（11/1 Zach：「ABC 選不出來，做上去給一個切換鈕試試看」）。
 * 只在 beta、本機出現（正式站 quoridorgame.com 不畫）；選好之後連同 globals.css 裡 [data-nmm-btn]／[data-nmm-layout] 沒選上的那幾段一起拿掉。
 * 存在 localStorage，重新整理、換語言都還是同一種。
 */
const BTN = [['', '現在'], ['a', 'A 只留字'], ['b', 'B 首字在上'], ['c', 'C 左右對稱']] as const;
const LAYOUT = [['', '現在'], ['c', '上下對齊'], ['top', '標題置中']] as const;
const KEYS = { btn: 'nmm-trial-btn', layout: 'nmm-trial-layout' } as const;

function read(key: string) { try { return localStorage.getItem(key) ?? ''; } catch { return ''; } }
function write(key: string, v: string) { try { localStorage.setItem(key, v); } catch { /* 私密視窗 */ } }

export default function StyleTrial() {
  const [on, setOn] = useState(false);
  const [btn, setBtn] = useState('');
  const [layout, setLayout] = useState('');
  useEffect(() => {
    if (location.hostname === 'quoridorgame.com') return;
    /* eslint-disable react-hooks/set-state-in-effect -- 只在掛載時讀一次 localStorage（靜態 HTML 沒有） */
    setOn(true);
    setBtn(read(KEYS.btn));
    setLayout(read(KEYS.layout));
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);
  useEffect(() => {
    if (!on) return;
    const html = document.documentElement;
    if (btn) html.dataset.nmmBtn = btn; else delete html.dataset.nmmBtn;
    if (layout) html.dataset.nmmLayout = layout; else delete html.dataset.nmmLayout;
    return () => { delete html.dataset.nmmBtn; delete html.dataset.nmmLayout; };
  }, [on, btn, layout]);
  if (!on) return null;
  const group = (label: string, items: readonly (readonly [string, string])[], value: string, set: (v: string) => void, key: string) => (
    <div className="flex items-center gap-1">
      <span className="w-9 shrink-0 text-[11px] font-black text-[#eee0c4]/80">{label}</span>
      {items.map(([v, name]) => (
        <button key={v} type="button" onClick={() => { set(v); write(key, v); }}
          className={`rounded-full px-2.5 py-1 text-xs font-black ${value === v ? 'bg-[#c54915] text-[#eee0c4]' : 'bg-[#eee0c4] text-[#1e120a]'}`}>
          {name}
        </button>
      ))}
    </div>
  );
  return (
    <div className="fixed bottom-[calc(var(--nmm-frame,12px)+8px)] left-[calc(var(--nmm-frame,12px)+8px)] z-50 flex flex-col gap-1.5 rounded-xl bg-[#1e120a]/85 p-2 shadow-lg">
      {group('按鈕', BTN, btn, setBtn, KEYS.btn)}
      {group('版面', LAYOUT, layout, setLayout, KEYS.layout)}
    </div>
  );
}
