import type { TutorialBoardProps } from '@/components/TutorialBoard';

/**
 * 逐步教學的**盤面圖**。
 *
 * 文字在 app/i18n/content/steps.ts —— 圖不分語言，跟著文字複製四份
 * 只會讓「改了圖忘記改另外三份」變成常態。兩邊的順序與長度由
 * tests/i18n/content.test.ts 鎖住。
 *
 * 抽成獨立模組是為了能寫測試 —— 盤面裡的領地由規則推導，
 * 所以「這張圖到底在示範什麼」是可以被驗證的，而不是只能用眼睛看。
 */
export interface Step {
  board: TutorialBoardProps;
}

export const STEPS: Step[] = [
  {
    board: {
      size: 4,
      pieces: [{ at: [0, 0], player: 'A' }, { at: [3, 3], player: 'B' }],
      hWalls: [{ at: [1, 0], player: 'A' }, { at: [1, 1], player: 'A' }, { at: [2, 2], player: 'B' }, { at: [2, 3], player: 'B' }],
      vWalls: [{ at: [0, 1], player: 'A' }, { at: [1, 1], player: 'A' }, { at: [3, 1], player: 'B' }],
    },
  },
  {
    board: {
      size: 4,
      /*
        開局階段真實的畫面是**所有空格都有灰點**（見 Chessboard 的
        「開局可放置的位置」）—— 教學卻只點了中央四格，等於在教一個
        不存在的限制：看起來只有那四格能放。

        棋子四角對稱各兩顆（原本紅 1 藍 2，像藍方多下一手），
        其餘十二格全部點上，與真實畫面一致。
        擺放**順序**沒辦法用一張靜態圖表達，那交給文字。
      */
      pieces: [
        { at: [0, 0], player: 'A' }, { at: [3, 0], player: 'A' },
        { at: [0, 3], player: 'B' }, { at: [3, 3], player: 'B' },
      ],
      dots: [
        [0, 1], [0, 2],
        [1, 0], [1, 1], [1, 2], [1, 3],
        [2, 0], [2, 1], [2, 2], [2, 3],
        [3, 1], [3, 2],
      ],
    },
  },
  {
    board: {
      size: 4,
      selected: { at: [1, 1], player: 'A' },
      // 一定要有對手的棋子：盤上只有單一玩家時，整盤會被算成他的領地而全部染色，
      // 看起來像他已經贏了。領地是由規則推導的，圖裡的每顆棋子都會影響結果。
      pieces: [{ at: [1, 1], player: 'A' }, { at: [3, 3], player: 'B' }],
      dots: [[0, 1], [1, 0], [1, 2], [2, 1], [0, 0], [0, 2], [2, 0], [2, 2], [3, 1], [1, 3]],
    },
  },
  {
    board: {
      size: 4,
      selected: { at: [1, 1], player: 'A' },
      pieces: [{ at: [1, 1], player: 'A' }, { at: [3, 3], player: 'B' }],
      ghosts: [
        { at: [1, 1], side: 'top', player: 'A' }, { at: [1, 1], side: 'bottom', player: 'A' },
        { at: [1, 1], side: 'left', player: 'A' }, { at: [1, 1], side: 'right', player: 'A' },
      ],
    },
  },
  {
    board: {
      size: 4,
      /*
        灰點原本只畫一步，但第 3 張畫的是完整兩步 —— 同一個符號兩種意思，
        讀者會以為這裡只能走一步。改成完整的兩步可達範圍。

        這樣反而更能說明這一步要講的事：右邊整片都到不了（牆擋著，
        而且藍棋佔位），其餘方向照常展開。
      */
      pieces: [{ at: [1, 1], player: 'A' }, { at: [1, 2], player: 'B' }],
      vWalls: [{ at: [1, 1], player: 'A' }],
      dots: [[0, 1], [2, 1], [1, 0], [0, 0], [0, 2], [2, 0], [2, 2], [3, 1]],
    },
  },
  {
    board: {
      size: 4,
      pieces: [{ at: [0, 0], player: 'A' }, { at: [0, 3], player: 'A' }, { at: [3, 0], player: 'B' }],
      hWalls: [{ at: [1, 0], player: 'A' }],
      vWalls: [{ at: [0, 0], player: 'A' }, { at: [1, 0], player: 'A' }],
    },
  },
  {
    /*
      破牆（三人局限定）。

      三方都要在盤上 —— 這一步講的是三人局才有的規則，圖裡只畫兩方
      會前後矛盾。紅棋被兩道牆夾住，鐵鎚標在其中一道上：
      那就是「打破它就走得出去」。鐵鎚的樣子與真實棋盤一致。
    */
    board: {
      size: 4,
      selected: { at: [1, 1], player: 'A' },
      pieces: [
        { at: [1, 1], player: 'A' }, { at: [0, 3], player: 'B' }, { at: [3, 0], player: 'C' },
      ],
      hWalls: [{ at: [1, 1], player: 'B' }],
      vWalls: [{ at: [1, 1], player: 'C' }],
      breaks: [{ at: [1, 1], dir: 'v' }],
    },
  },
  {
    board: {
      size: 4,
      // 邊界刻意做成階梯而不是直線：直線會切成 8:8 的平局，
      // 而這一步要示範的是「格數最多的人獲勝」。這樣是紅 10 : 藍 6。
      // 牆的顏色紅藍交錯，順帶呼應前一步的「牆不分敵我」。
      pieces: [{ at: [0, 0], player: 'A' }, { at: [3, 3], player: 'B' }],
      hWalls: [
        { at: [1, 2], player: 'A' }, { at: [1, 3], player: 'B' },
        { at: [2, 0], player: 'A' }, { at: [2, 1], player: 'B' },
      ],
      vWalls: [{ at: [2, 1], player: 'A' }],
    },
  },
];
