
import React from "react";

export default React.memo(function sectionShadow({ children, className, roundedFull, handleClickEvent }: { children: React.ReactNode, className?: string, roundedFull?: boolean, handleClickEvent?: () => void }) {
  return (
    <div className={`relative size-full ${className || ''}`} onClick={handleClickEvent}>
      <div className={`absolute inset-0 size-full translate-x-2 translate-y-2 bg-gray-900 ${roundedFull ? 'rounded-full' : 'rounded-xl'}`}></div>
      {children}
    </div>
  );
});
