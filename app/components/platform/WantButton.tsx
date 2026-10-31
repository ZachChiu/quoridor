'use client';

import { useEffect, useState } from 'react';
import { LuHeart } from 'react-icons/lu';
import { useUser } from '@/contexts/UserContext';
import { setWant, wantCounts, wantedHere } from '@/utils/wants';

/** 還沒做的遊戲卡左上角的「想玩」（utils/wants.ts）。按下去先亮、數字先加，寫入被拒再退回 */
export default function WantButton({ wantKey: key, label, name }: { wantKey: string; label: string; name: string }) {
  const { ensureUser } = useUser();
  const [wanted, setWanted] = useState(false);
  const [count, setCount] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 靜態 HTML 不知道這台裝置按過沒，hydration 之後才讀得到 localStorage
    setWanted(wantedHere(key));
    let live = true;
    wantCounts().then((all) => { if (live && all) setCount(all[key] ?? 0); });
    return () => { live = false; };
  }, [key]);

  const toggle = async () => {
    if (busy) return;
    const on = !wanted;
    setBusy(true);
    setWanted(on);
    setCount((n) => (n === null ? n : Math.max(0, n + (on ? 1 : -1))));
    const ok = await ensureUser().then((uid) => setWant(key, uid, on), () => false);
    if (!ok) {
      setWanted(!on);
      setCount((n) => (n === null ? n : Math.max(0, n + (on ? -1 : 1))));
    }
    setBusy(false);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={wanted}
      aria-label={`${label}：${name}`}
      className={`relative flex items-center gap-1.5 self-start rounded-full px-2.5 py-1 text-xs font-black transition active:scale-95 ${
        wanted ? 'bg-brand-red text-white' : 'bg-plat-raised text-tile-cream fine:hover:bg-white/20'
      }`}
    >
      <LuHeart aria-hidden="true" className={`text-sm ${wanted ? 'fill-current' : ''}`} />
      {label}
      {count !== null && count > 0 && <span className="tabular-nums opacity-80">{count}</span>}
    </button>
  );
}
