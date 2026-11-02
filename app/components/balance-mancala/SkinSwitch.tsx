'use client';
import { useEffect, useLayoutEffect } from 'react';
import { SKINS, SKIN_IDS, applySkin, clearSkin, setSkin, useMclSkin } from './skins';

/**
 * 試做用的換皮開關（explore/mancala-skins）：畫面最下方一排三顆，選的存在 localStorage 'mcl-style'。
 * 離開這款時把寫在 <html> 上的變數清掉（--ink-soft 是全站共用的名字）。
 */
export default function SkinSwitch() {
  const skin = useMclSkin();
  useLayoutEffect(() => { applySkin(skin); }, [skin]);
  useEffect(() => () => clearSkin(), []);
  return (
    <div className="fixed bottom-2 left-1/2 z-50 flex -translate-x-1/2 gap-1 rounded-full bg-black/70 p-1 text-xs font-bold text-white print:hidden" data-skin-switch>
      {SKIN_IDS.map((id) => (
        <button key={id} type="button" onClick={() => setSkin(id)}
          className={`rounded-full px-3 py-1.5 ${skin === id ? 'bg-white text-black' : 'opacity-80 fine:hover:opacity-100'}`}>
          {SKINS[id].label}
        </button>
      ))}
    </div>
  );
}
