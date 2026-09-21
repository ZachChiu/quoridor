'use client';
import React from 'react';
import { useTransition } from '@/contexts/TransitionContext';

/**
 * 會走換場動畫的連結。
 *
 * 首頁的磁磚是按鈕，所以走得到 navigate()；規則頁用的是 next/link，
 * 於是那些按鈕換頁時整個站只有這幾個入口是「啪」一下硬切的。
 *
 * 底層仍然是真的 `<a href>`：爬蟲走得過去，而且 cmd／ctrl／中鍵點擊
 * 一律放行給瀏覽器 —— 攔截那些等於把「在新分頁開啟」弄壞，
 * 那是使用者不會回報、只會覺得這個網站怪怪的那種問題。
 */
type Props = {
  href: string;
  /** 換場色塊的顏色，通常就是這顆按鈕自己的底色 */
  color: string;
  radius?: number;
  className?: string;
  'aria-label'?: string;
  hrefLang?: string;
  'aria-current'?: React.AriaAttributes['aria-current'];
  children: React.ReactNode;
};

export default function TransitionLink({ href, color, radius = 16, className, children, ...rest }: Props) {
  const { navigate } = useTransition();
  return (
    <a
      href={href}
      className={className}
      {...rest}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
        e.preventDefault();
        const r = e.currentTarget.getBoundingClientRect();
        navigate(href, {
          wipe: {
            x: r.left + r.width / 2,
            y: r.top + r.height / 2,
            color,
            from: { width: r.width, height: r.height, radius },
          },
        });
      }}
    >
      {children}
    </a>
  );
}
