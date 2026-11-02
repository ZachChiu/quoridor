/**
 * 社群素材的文字（繁中、英、韓）。能用站上現成的句子就用（app/i18n/content/steps.ts、messages/），
 * 術語照 app/i18n/glossary.md：牆壁圍棋／Wall Go／벽바둑、地盤／territory／영역、築牆、本機／連線／單人對戰。
 * 節目名用通稱（《魔鬼的計謀》、The Devil's Plan、데블스 플랜）—— 這批是為第 3 季開播發的，不綁第 2 季的副標。
 * 不寫「官方」；每一件都帶 disclaimer（messages/*.ts 的 home.disclaimer 原句）。
 */
export const COPY = {
  'zh-TW': {
    lang: 'zh-Hant-TW',
    pill: '牆壁圍棋 Wall Go',
    fan: '非官方粉絲作品',
    disclaimer: '非官方粉絲作品，與 Netflix 及節目製作方無關。',
    url: 'quoridorgame.com',
    video: {
      intro: '《魔鬼的計謀》的牆壁圍棋\n現在線上就能玩',
      place: '開局：輪流把棋子放上盤',
      move: '選一顆棋子，走 0 到 2 格',
      wall: '走完一定要蓋一道牆',
      late: '牆會把盤面切成一塊塊地盤',
      result: '全部圍住就計分\n地盤最多的人贏',
      outro: '免費・免登入・可以跟朋友連線',
    },
    cards: [
      { kicker: '《魔鬼的計謀》裡的那盤棋', title: '牆壁圍棋\n線上就能玩', body: '輪流移動棋子、蓋牆，\n用牆圍出最大的地盤。' },
      { title: '每回合：走一步，蓋一道牆', steps: [
        { label: '① 移動', body: '選一顆自己的棋子，往上下左右走 0 到 2 格。可以直走，也可以轉彎。' },
        { label: '② 築牆', body: '走完在那顆棋子的四邊挑一邊蓋牆。這一步不能跳過。' }] },
      { title: '全部圍住就計分', body: '被牆圍住、裡面只有你的棋子的區域，整塊算你的。所有棋子都被圍住時結束，地盤格數最多的人贏。',
        score: (s) => `藍方 ${s.B} 格　紅方 ${s.A} 格` },
      { title: '小心：牆擋所有人', body: '牆不分是誰蓋的，對所有人都有效，包括你自己。圍住自己地盤的那道牆，也可能把自己的路堵死。棋盤外圍算一圈牆。' },
      { title: '免費、免登入\n跟朋友連線就能下', modes: ['本機對戰', '連線對戰', '單人對戰'] },
    ],
  },
  en: {
    lang: 'en',
    pill: 'Wall Go',
    fan: 'Unofficial fan project',
    // 原句是彎引號 ’；Noto Sans TC 把它畫成全形，看起來像 show’ s，這裡換成直引號
    disclaimer: "Unofficial fan project, not affiliated with Netflix or the show's producers.",
    url: 'quoridorgame.com',
    video: {
      intro: "Wall Go from The Devil's Plan\nnow playable online",
      place: 'Opening: take turns placing pieces',
      move: 'Pick a piece, move 0 to 2 squares',
      wall: 'Then you must build one wall',
      late: 'Walls carve the board into territory',
      result: 'Once everyone is walled in,\nthe most squares wins',
      outro: 'Free · No sign-up · Play friends online',
    },
    cards: [
      { kicker: "The board game from The Devil's Plan", title: 'Wall Go\nPlay it online', body: 'Take turns moving pieces and building walls.\nWall off the most ground to win.' },
      { title: 'Each turn: move, then build a wall', steps: [
        { label: '1 Move', body: 'Pick one of your pieces and move it up, down, left or right, 0 to 2 squares. Go straight or turn a corner.' },
        { label: '2 Wall', body: 'Then build a wall on one of the four sides of its square. You cannot skip this.' }] },
      { title: 'Wall everyone in, then count', body: 'An area enclosed by walls with only your pieces inside is your territory. The game ends once every piece is enclosed, and the most squares wins.',
        score: (s) => `Blue ${s.B} squares   Red ${s.A} squares` },
      { title: 'Careful: walls block everyone', body: 'A wall works against every player, including whoever built it. The wall that closes off your territory can also block your own way out. The edge of the board counts as a wall.' },
      { title: 'Free, no sign-up\nPlay friends online', modes: ['Local play', 'Online play', 'Solo play'] },
    ],
  },
  ko: {
    lang: 'ko',
    pill: '벽바둑 Wall Go',
    fan: '비공식 팬 프로젝트',
    disclaimer: '비공식 팬 프로젝트이며 넷플릭스 및 제작사와 관련이 없습니다.',
    url: 'quoridorgame.com',
    video: {
      intro: '데블스 플랜의 벽바둑\n이제 온라인으로 바로',
      place: '배치: 번갈아 말을 놓기',
      move: '말 하나를 골라 0~2칸 이동',
      wall: '이동 후 벽 하나를 꼭 세우기',
      late: '벽이 판을 영역으로 나눕니다',
      result: '모두 갇히면 점수 계산\n칸이 가장 많은 사람이 승리',
      outro: '무료 · 가입 없이 · 친구와 온라인 대전',
    },
    cards: [
      { kicker: '데블스 플랜의 그 게임', title: '벽바둑\n온라인으로 바로', body: '번갈아 말을 움직이고 벽을 세워\n가장 넓은 영역을 차지하세요.' },
      { title: '매 턴: 이동하고, 벽 하나', steps: [
        { label: '① 이동', body: '자기 말 하나를 골라 상하좌우로 0~2칸 움직입니다. 직선이어도 되고 꺾어도 됩니다.' },
        { label: '② 벽', body: '이동이 끝나면 그 칸의 네 변 중 하나에 벽을 세웁니다. 건너뛸 수 없습니다.' }] },
      { title: '모두 갇히면 점수 계산', body: '벽으로 완전히 둘러싸인 구역 안에 내 말만 있으면 그 구역 전체가 내 영역입니다. 모든 말이 갇히면 끝나고, 칸 수가 가장 많은 사람이 이깁니다.',
        score: (s) => `파랑 ${s.B}칸   빨강 ${s.A}칸` },
      { title: '조심: 벽은 모두를 막는다', body: '벽은 누가 세웠는지와 상관없이 모두에게 적용됩니다. 세운 사람에게도 마찬가지입니다. 내 영역을 둘러싸는 벽이 내 출구를 막기도 합니다.' },
      { title: '무료, 가입 없이\n친구와 온라인 대전', modes: ['로컬 대전', '온라인 대전', '혼자 하기'] },
    ],
  },
};
