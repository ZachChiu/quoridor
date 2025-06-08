import { useState, useCallback } from "react";

export function useConfirm() {
  const [isOpen, setIsOpen] = useState(false);
  const [resolver, setResolver] = useState<(v: boolean) => void>();

  const confirm = useCallback(() => {
    setIsOpen(true);
    return new Promise<boolean>((resolve) => {
      setResolver(() => resolve);
    });
  }, []);

  const handleConfirm = useCallback(() => {
    setIsOpen(false);
    resolver?.(true);
  }, [resolver]);

  const handleCancel = useCallback(() => {
    setIsOpen(false);
    resolver?.(false);
  }, [resolver]);

  return {
    isOpen,
    confirm,
    handleConfirm,
    handleCancel,
  };
}