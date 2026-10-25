import type { Viewport } from "next";

export const siteViewport: Viewport = {
  width: 'device-width',
  initialScale: 1,

  /*
    themeColor 必須與 globals.css 的 --background 同一個值。

    Safari 會拿它染 iOS 的狀態列與網址列。原本寫死 #ffffff 而頁面底色是
    #e8e1d7，於是畫面最上面永遠掛著一條白邊，捲動時特別明顯。

    改這個值時 globals.css 的 --background 要一起改 —— 兩邊分開寫死
    遲早會漂掉，而症狀只是「有點怪」，不會有人回報。
  */
  themeColor: '#e8e1d7',

  // 明確宣告是淺色配色。不宣告的話，部分瀏覽器在系統深色模式下會自行
  // 反轉表單控制項與捲軸，跟這套刻意平塗的配色對不起來。
  colorScheme: 'light',

  /*
    原本有 maximumScale: 1 與 userScalable: false。拿掉了 ——
    iOS Safari 從 iOS 10 起就直接忽略這兩個值，所以它們實際上只在
    Android 生效，效果是把縮放整個關掉，低視力使用者放不大
    （WCAG 1.4.4 要求能放大到 200%）。

    也就是說：想擋的平台擋不到，擋到的平台是不該擋的那個。
  */
};

