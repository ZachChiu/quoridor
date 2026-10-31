'use client';
import type React from 'react';
import { useEffect } from 'react';
import { useTransition } from '@/contexts/TransitionContext';
import { DOORS } from '@/components/WipeOverlay';
import { entranceOf, preloadEntrance } from '@/components/entrances';

/**
 * 從平台進到某款遊戲的連結：按下去由這個元素的位置擴散出那款遊戲的顏色，蓋滿後淡出。
 *
 * 平台（深色＋紅）和遊戲（各自的風格）差很多，直接換頁會很突兀。用 Wall Go 首頁磁磚
 * 同一套轉場把切換包起來，看起來就是「打開這部作品」。
 * 有自己進場的遊戲（entrance，見 components/entrances.ts）改播它自己的；虎羊棋是 doors。
 * 修飾鍵（新分頁開啟）照瀏覽器原本的行為，爬蟲看到的也是普通的 <a href>。
 */
export default function WipeLink({ href, color, radius = 12, doors, entrance, className, children, ...rest }: {
  href: string;
  /** 改走木窗門轉場（虎羊棋），color 就用不到 */
  doors?: boolean;
  /** 這款遊戲自己的進場 id；還沒載好就退回擴散 color */
  entrance?: string;
  /** 擴散的顏色，例如 'rgb(var(--tile-blue))' */
  color: string;
  radius?: number;
  className?: string;
  children: React.ReactNode;
} & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'color' | 'className' | 'children'>) {
  const { navigate } = useTransition();

  // 進場是另外一包（每款各自的），閒置時先載好 —— 點下去才載會有一段沒反應的空窗
  useEffect(() => {
    if (!entrance) return;
    const w = window as Window & { requestIdleCallback?: (cb: () => void) => number; cancelIdleCallback?: (id: number) => void };
    if (typeof w.requestIdleCallback === 'function') {
      const id = w.requestIdleCallback(() => preloadEntrance(entrance));
      return () => w.cancelIdleCallback?.(id);
    }
    const t = window.setTimeout(() => preloadEntrance(entrance), 1200);
    return () => window.clearTimeout(t);
  }, [entrance]);

  return (
    <a
      {...rest}
      href={href}
      className={className}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
        e.preventDefault();
        const r = e.currentTarget.getBoundingClientRect();
        const scene = entrance && entranceOf(entrance) ? entrance : undefined;
        navigate(href, {
          // 蓋滿之後淡出，不縮回來：縮回卡片的位置會像又回到平台（見 Wipe 的 exit）
          wipe: doors ? DOORS
            : scene ? { x: 0, y: 0, color, kind: 'scene', scene }
            : { x: r.left + r.width / 2, y: r.top + r.height / 2, color, from: { width: r.width, height: r.height, radius }, exit: 'fade' },
        });
      }}
    >
      {children}
    </a>
  );
}
