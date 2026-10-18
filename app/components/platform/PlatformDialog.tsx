'use client';
import React from 'react';
import { createPortal } from 'react-dom';
import { LuX } from 'react-icons/lu';
import { useDialog } from '@/hook/useDialog';
import { useMessages } from '@/i18n/LocaleProvider';

/**
 * 平台（`/`）的對話框：深色面板、米白字、右上角圓形關閉鈕。
 *
 * 平台不用 Wall Go 的 Modal：那是奶油底配色帶（規則森綠、連線靛藍…），
 * 放在 Netflix 式的黑紅外殼上會像打開了另一個網站（Zach：平台要有自己的元件）。
 * **行為**跟 Modal 共用同一份（useDialog：捲動鎖、Esc、焦點鎖、portal），只有長相分開。
 *
 * 層級與遮罩跟 Modal 一致：z-[55]（頁面最高 z-50、換頁轉場 z-[60]），
 * 遮罩用 .cover-viewport 往外多蓋，關閉時 display:none（iOS 26 Safari 會拿 fixed 元素染工具列）。
 */
export default function PlatformDialog({ isOpen, onClose, title, children }: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  const { panelRef, portalReady } = useDialog(isOpen, onClose);
  const t = useMessages();

  const node = (
    <div
      className={`fixed inset-0 z-[55] flex items-center justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] transition-opacity duration-200 ${
        isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
      }`}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      {...(isOpen ? {} : { inert: true, 'aria-hidden': true })}
    >
      <div className={`cover-viewport bg-black/70 ${isOpen ? '' : 'hidden'}`} onClick={onClose}></div>
      <div
        ref={panelRef}
        tabIndex={-1}
        className="relative flex max-h-full w-full max-w-md flex-col overflow-hidden rounded-xl bg-plat-surface font-[family-name:var(--font-app)] text-tile-cream outline-none"
      >
        <div className="flex shrink-0 items-center justify-between gap-3 px-6 pb-2 pt-5">
          <h2 className="text-xl font-black">{title}</h2>
          <button
            type="button"
            aria-label={t.ui.close}
            onClick={onClose}
            className="-mr-2 grid size-11 shrink-0 place-items-center rounded-full bg-plat-raised text-xl transition hover:brightness-125"
          >
            <LuX aria-hidden="true" />
          </button>
        </div>
        <div className="min-h-0 overflow-y-auto overscroll-contain px-6 pb-6 pt-2">{children}</div>
      </div>
    </div>
  );

  return portalReady ? createPortal(node, document.body) : node;
}
