
import React from "react";

export default React.memo(function sectionShadow({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={`relative size-full ${className}`}>
      <div className="absolute inset-0 size-full translate-x-2 translate-y-2 rounded-xl bg-gray-900"></div>
      {children}
    </div>
  );
});
