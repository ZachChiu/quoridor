
import React from "react";

export default React.memo(function sectionShadow({ children, className, roundedFull }: { children: React.ReactNode, className?: string, roundedFull?: boolean }) {
  return (
    <div className={`relative size-full ${className || ''}`}>
      <div className={`absolute inset-0 size-full translate-x-2 translate-y-2 bg-gray-900 ${roundedFull ? 'rounded-full' : 'rounded-xl'}`}></div>
      {children}
    </div>
  );
});
