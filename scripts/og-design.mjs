/**
 * OG 圖的版面。與產生器分開，是因為這裡是**設計**、那裡是流程 ——
 * 想調版面時不必讀下載字型與寫檔的程式。
 *
 * 用的是站上那套平塗撞色：實色底、900 字重、沒有陰影也沒有漸層。
 * satori 只支援 flex 與絕對定位，剛好夠 —— 這套語彙本來就不需要別的。
 */

/* 色票與 app/globals.css 同源。改了那邊記得回來對一次 —— 這裡不能吃 CSS 變數。 */
export const C = {
  cream: '#faf7f0',
  ground: '#e8e1d7',
  ink: '#141010',
  line: '#3a322c',
  A: '#cd4642', A100: '#f0c8c6',
  B: '#2478b7', B100: '#cadfee',
  C3: '#0e8142',
  amber: '#e9af4c', orange: '#df6c3f', blue: '#2478b7',
  red: '#cd4642', forest: '#006944', purple: '#83519c',
};

/**
 * 每一頁一個色相。對應首頁磁磚：規則森綠、連線靛藍、單人陶橘、本機琥珀。
 * `fg` 是那個底色上能過 4.5:1 的字色 —— 琥珀與陶橘要用墨，其餘用米白
 * （數字見 globals.css 的註解，不要憑印象改）。
 */
export const TONES = {
  home:   { bg: C.ground, fg: C.ink,   pill: C.ink,    pillFg: C.cream },
  rules:  { bg: C.forest, fg: C.cream, pill: C.cream,  pillFg: C.forest },
  local:  { bg: C.amber,  fg: C.ink,   pill: C.ink,    pillFg: C.amber },
  online: { bg: C.blue,   fg: C.cream, pill: C.cream,  pillFg: C.blue },
  solo:   { bg: C.orange, fg: C.ink,   pill: C.ink,    pillFg: C.orange },
  replay: { bg: C.ink,    fg: C.cream, pill: C.cream,  pillFg: C.ink },
};

// 格線細、牆粗 —— 兩者同粗的話牆會被讀成格線，盤面就只剩一張網格
const CELL = 54, GAP = 2, STEP = CELL + GAP, N = 7;
const INNER = N * CELL + (N - 1) * GAP;   // 390
const FRAME = 9;                           // 棋盤外緣那圈也是一道牆，不是裝飾邊框

const xy = (r, c) => ({ left: c * STEP, top: r * STEP });

/**
 * 盤面是固定的一手棋，六張圖共用。
 *
 * 刻意不放任何灰色小點 —— 那在盤面上不代表任何規則，只會讓人以為
 * 那些格子有什麼特別之處。要讓人一眼看懂的只有三件事：棋子、牆、地盤。
 */
const RED_T = [[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2], [2, 0], [2, 1], [2, 2]];
const BLUE_T = [[4, 4], [4, 5], [4, 6], [5, 4], [5, 5], [5, 6], [6, 4], [6, 5], [6, 6]];
const RED_P = [[1, 1], [4, 1]];
const BLUE_P = [[1, 4], [5, 5]];
// 牆：['v', r, c] 是格子 (r,c) 右邊那道；['h', r, c] 是下面那道
const WALLS = [
  ['v', 0, 2, C.A], ['v', 1, 2, C.A], ['v', 2, 2, C.A],
  ['h', 2, 0, C.A], ['h', 2, 1, C.A], ['h', 2, 2, C.A],
  ['v', 4, 3, C.B], ['v', 5, 3, C.B], ['v', 6, 3, C.B],
  ['h', 3, 4, C.B], ['h', 3, 5, C.B], ['h', 3, 6, C.B],
];

const div = (style, children) => ({ type: 'div', props: { style: { display: 'flex', ...style }, children } });

function board() {
  const kids = [];
  // 底格
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    const red = RED_T.some(([a, b]) => a === r && b === c);
    const blue = BLUE_T.some(([a, b]) => a === r && b === c);
    kids.push(div({
      position: 'absolute', ...xy(r, c), width: CELL, height: CELL,
      background: red ? C.A100 : blue ? C.B100 : C.cream,
    }));
  }
  // 牆。位移對齊的是格線中心而不是格子邊，兩者差半個格縫（見 CLAUDE.md）
  const W = 10, half = (W - GAP) / 2;
  for (const [dir, r, c, color] of WALLS) {
    kids.push(dir === 'v'
      ? div({ position: 'absolute', left: c * STEP + CELL - half, top: r * STEP, width: W, height: CELL, background: color })
      : div({ position: 'absolute', left: c * STEP, top: r * STEP + CELL - half, width: CELL, height: W, background: color }));
  }
  // 棋子
  for (const [list, color] of [[RED_P, C.A], [BLUE_P, C.B]]) {
    for (const [r, c] of list) {
      const d = 30, o = (CELL - d) / 2;
      kids.push(div({ position: 'absolute', left: c * STEP + o, top: r * STEP + o, width: d, height: d, borderRadius: d, background: color }));
    }
  }
  /*
    外框用外層的 padding，不是 border —— satori 的絕對定位是從 border box
    起算的，所以格子會整體偏移一個邊框寬，上左看得到框、下右被蓋掉。
  */
  return div({ padding: FRAME, background: C.line, borderRadius: 12 }, [
    div({ position: 'relative', width: INNER, height: INNER, background: C.line }, kids),
  ]);
}

/** 一張圖。`copy` 是已經挑好語系的字串。 */
export function poster({ tone, copy }) {
  const t = TONES[tone];
  return div({
    width: 1200, height: 630, background: t.bg, color: t.fg,
    alignItems: 'center', padding: '0 70px',
    fontFamily: 'OG',
  }, [
    div({ flexDirection: 'column', flex: 1, paddingRight: 48 }, [
      div({
        alignSelf: 'flex-start', background: t.pill, color: t.pillFg,
        borderRadius: 999, padding: '10px 24px', fontSize: 26, fontWeight: 700,
        marginBottom: 26,
      }, copy.kicker),
      // 標題下面不放描述句（Zach：「描述我不喜歡，全部拔掉」）—— 圖只講是哪一頁
      ...copy.title.map((line, i) => div({
        fontSize: line.length > 9 ? 76 : 92, fontWeight: 900, lineHeight: 1.08,
        marginBottom: i === copy.title.length - 1 ? 34 : 0,
      }, line)),
      div({ fontSize: 26, fontWeight: 900, opacity: 0.55 }, 'quoridorgame.com'),
    ]),
    board(),
  ]);
}
