import { useState, useCallback, useRef, useEffect } from "react";

/**
 * 以 Promise 形式取得使用者確認的 hook。
 *
 * `confirm()` 會開啟對話框並回傳一個 Promise，使用者按下確認或取消後才 resolve。
 *
 * resolver 存在 ref 而非 state，原因有二：
 * 1. 它不參與畫面渲染，放 state 只會多觸發一次 render
 * 2. 放 state 會讓 handleConfirm / handleCancel 每次都換 identity
 */
export function useConfirm() {
  const [isOpen, setIsOpen] = useState(false);
  const resolverRef = useRef<((v: boolean) => void) | null>(null);

  /** 結清當前等待中的 Promise，確保呼叫端不會永久懸掛。 */
  const settle = useCallback((value: boolean) => {
    const resolve = resolverRef.current;
    resolverRef.current = null;
    resolve?.(value);
  }, []);

  const confirm = useCallback(() => {
    // 前一次尚未結清就再次呼叫時，先以 false 收尾，避免舊 Promise 永遠懸著
    settle(false);
    setIsOpen(true);
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, [settle]);

  const handleConfirm = useCallback(() => {
    setIsOpen(false);
    settle(true);
  }, [settle]);

  const handleCancel = useCallback(() => {
    setIsOpen(false);
    settle(false);
  }, [settle]);

  // 元件卸載時若仍有等待中的 Promise，以 false 結清。
  // 否則 await confirm() 的呼叫端會永久停在該行，連帶讓其 closure 無法回收。
  useEffect(() => () => settle(false), [settle]);

  return {
    isOpen,
    confirm,
    handleConfirm,
    handleCancel,
  };
}
