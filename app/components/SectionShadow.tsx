
import React from "react";

export default React.memo(function sectionShadow({ children, className, roundedFull, handleClickEvent, disabled }: { children: React.ReactNode, className?: string, roundedFull?: boolean, handleClickEvent?: () => void, disabled?: boolean }) {
  return (
    <div className={`relative size-full ${className || ''}`} onClick={disabled ? undefined : handleClickEvent}>
      <div className={`absolute inset-0 size-full translate-x-2 translate-y-2 bg-gray-900 ${roundedFull ? 'rounded-full' : 'rounded-xl'}`}></div>
      {children}
    </div>
  );
});
