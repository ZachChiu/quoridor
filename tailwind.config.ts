import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      /*
        斷點順序就是優先順序 —— Tailwind 依這裡的宣告順序決定同名工具類誰蓋誰，
        所以 coarse 那三個放在 md / landscape 後面，才蓋得掉它們。

        **「是不是手指裝置」一律用這組 CSS 斷點判，不要用 JS。**
        這站是靜態匯出，HTML 在建置時就固定了，裡面不可能知道待會兒是誰打開它；
        JS 的 matchMedia 要等 hydration 之後才成立，於是手機重整會先畫一次
        桌機版面再整個跳成手機版。media query 從第一幀就是對的，不會跳。
        （JS 只留給「按下去要有什麼行為」那種判斷，那時早就 hydrate 完了。）
      */
      screens: {
        'portrait': {'raw': '(orientation: portrait)'},
        'landscape': {'raw': '(orientation: landscape)'},
        'coarse': {'raw': '(pointer: coarse)'},
        'coarse-port': {'raw': '(pointer: coarse) and (orientation: portrait)'},
        'coarse-land': {'raw': '(pointer: coarse) and (orientation: landscape)'},
        'fine': {'raw': '(pointer: fine)'},
        // 矮到直向排版放不下的橫向畫面（手機橫放）。遊玩方式 Modal 改成左右並排
        'short': {'raw': '(orientation: landscape) and (max-height: 32rem)'},
      },
      colors: {
        // Tailwind 預設的 gray-900 是帶藍的 #111827，壓在奶油底上偏冷。
        // 描邊與硬陰影全站都吃這一階，換成暖黑就整體對齊了。
        gray: { 900: "#141010" },
        "ink-soft": "var(--ink-soft)",
        tile: {
          amber: "rgb(var(--tile-amber) / <alpha-value>)",
          orange: "rgb(var(--tile-orange) / <alpha-value>)",
          blue: "rgb(var(--tile-blue) / <alpha-value>)",
          purple: "rgb(var(--tile-purple) / <alpha-value>)",
          red: "rgb(var(--tile-red) / <alpha-value>)",
          forest: "rgb(var(--tile-forest) / <alpha-value>)",
          ink: "rgb(var(--tile-ink) / <alpha-value>)",
          cream: "rgb(var(--tile-cream) / <alpha-value>)",
        },
        "board-line": "rgb(var(--board-line) / <alpha-value>)",
        background: "var(--background)",
        foreground: "var(--foreground)",
        "player-A": {
          DEFAULT: "var(--player-A)",
          50: "var(--player-A-50)",
          100: "var(--player-A-100)",
          200: "var(--player-A-200)",
          300: "var(--player-A-300)",
          400: "var(--player-A-400)",
          500: "var(--player-A-500)",
          600: "var(--player-A-600)",
          700: "var(--player-A-700)",
          800: "var(--player-A-800)",
          900: "var(--player-A-900)",
        },
        "player-B": {
          DEFAULT: "var(--player-B)",
          50: "var(--player-B-50)",
          100: "var(--player-B-100)",
          200: "var(--player-B-200)",
          300: "var(--player-B-300)",
          400: "var(--player-B-400)",
          500: "var(--player-B-500)",
          600: "var(--player-B-600)",
          700: "var(--player-B-700)",
          800: "var(--player-B-800)",
          900: "var(--player-B-900)",
        },
        "player-C": {
          DEFAULT: "var(--player-C)",
          50: "var(--player-C-50)",
          100: "var(--player-C-100)",
          200: "var(--player-C-200)",
          300: "var(--player-C-300)",
          400: "var(--player-C-400)",
          500: "var(--player-C-500)",
          600: "var(--player-C-600)",
          700: "var(--player-C-700)",
          800: "var(--player-C-800)",
          900: "var(--player-C-900)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          50: "var(--primary-50)",
          100: "var(--primary-100)",
          200: "var(--primary-200)",
          300: "var(--primary-300)",
          400: "var(--primary-400)",
          500: "var(--primary-500)",
          600: "var(--primary-600)",
          700: "var(--primary-700)",
          800: "var(--primary-800)",
          900: "var(--primary-900)",
        },
      },
    },
  },
  // 動態拼接的 class 一律改走 inline style 或 CSS 變數，
  // 所以這裡不再需要列舉 grid-cols-* / grid-rows-*。
  safelist: [
  ],
  plugins: [],
} satisfies Config;
