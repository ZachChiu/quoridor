import type { TutorialBoardProps } from '@/components/TutorialBoard';

/**
 * 逐步教學的內容。
 *
 * 抽成獨立模組是為了能寫測試 —— 盤面裡的領地由規則推導，
 * 所以「這張圖到底在示範什麼」是可以被驗證的，而不是只能用眼睛看。
 */
export interface Step {
  title: string;
  body: string;
  board: TutorialBoardProps;
}

export const STEPS: Step[] = [
  {
    title: '目標：圍出最大的地盤',
    body: '用牆把區域封閉起來。封閉區域裡只有你的棋子，那塊地就是你的。最後地盤格數最多的人獲勝。',
    board: {
      size: 4,
      pieces: [{ at: [0, 0], player: 'A' }, { at: [3, 3], player: 'B' }],
      hWalls: [{ at: [1, 0], player: 'A' }, { at: [1, 1], player: 'A' }, { at: [2, 2], player: 'B' }, { at: [2, 3], player: 'B' }],
      vWalls: [{ at: [0, 1], player: 'A' }, { at: [1, 1], player: 'A' }, { at: [3, 1], player: 'B' }],
    },
  },
  {
    title: '開局：輪流放棋子',
    body: '兩人局各有 4 顆棋子，其中 2 顆已在盤上，其餘依「紅、藍、藍、紅」的蛇形順序擺放，先後手才公平。三人局則是每人 2 顆，全部自己擺。',
    board: {
      size: 4,
      pieces: [{ at: [0, 0], player: 'A' }, { at: [3, 3], player: 'B' }, { at: [0, 3], player: 'B' }],
      dots: [[1, 1], [2, 1], [1, 2], [2, 2], [3, 0]],
    },
  },
  {
    title: '移動：每回合走 0 到 2 格',
    body: '選一顆自己的棋子，上下左右移動 0 到 2 格。兩格可以是直線，也可以轉彎走 L 形。灰點就是走得到的位置 —— 不想動也可以，直接築牆。',
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
    title: '築牆：移動後一定要築一道',
    body: '移動結束後，必須在那顆棋子的相鄰邊築一道牆。這是強制的，不能跳過。半透明的預覽就是可以築的位置，滑過去會變成實心。',
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
    title: '牆不分敵我',
    body: '任何人築的牆，所有人都擋。你用來圍自己地盤的牆，同時也可能封死自己的退路 —— 每一手都是算計與取捨。棋盤的外圍本身也算牆。',
    board: {
      size: 4,
      pieces: [{ at: [1, 1], player: 'A' }, { at: [1, 2], player: 'B' }],
      vWalls: [{ at: [1, 1], player: 'A' }],
      dots: [[0, 1], [2, 1], [1, 0]],
    },
  },
  {
    title: '圍地：區域裡只能有你的棋子',
    body: '被牆完全封閉的區域，如果裡面只有你的棋子，整塊都算你的。若裡面沒有棋子、或同時有別人的棋子，就是中立區，誰都不計分。',
    board: {
      size: 4,
      pieces: [{ at: [0, 0], player: 'A' }, { at: [0, 3], player: 'A' }, { at: [3, 0], player: 'B' }],
      hWalls: [{ at: [1, 0], player: 'A' }],
      vWalls: [{ at: [0, 0], player: 'A' }, { at: [1, 0], player: 'A' }],
    },
  },
  {
    title: '結束與勝負',
    body: '當所有棋子都被封閉在各自的區域裡，遊戲結束。地盤格數最多的人獲勝；同分則並列。三人局每人另有一次破牆機會，可以拆掉一道相鄰的牆再繼續移動。',
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
