
import React from "react";

/**
 * 面板外框容器。
 *
 * 原本這裡畫的是一塊往右下位移的純黑方塊（硬陰影）。改版後整套視覺走
 * 「厚描邊、純平面、不打光」—— 陰影是在模擬光源，與這個方向相反，因此拔掉。
 * 立體感改由厚描邊與撞色本身承擔。
 *
 * 保留元件而非刪掉：仍有數個 Modal 與版面靠它做定位。
 * Button 與 IconButton 已改為自帶樣式，不再經過它。
 */
export default React.memo(function SectionShadow({
  children,
  className,
  handleClickEvent,
  disabled,
}: {
  children: React.ReactNode;
  className?: string;
  /** 保留以相容既有呼叫端；圓角現在由內層面板自己決定。 */
  roundedFull?: boolean;
  handleClickEvent?: () => void;
  disabled?: boolean;
}) {
  return (
    <div
      className={`relative size-full ${className || ""}`}
      onClick={disabled ? undefined : handleClickEvent}
    >
      {children}
    </div>
  );
});
