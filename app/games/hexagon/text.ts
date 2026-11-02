import type { Locale } from '@/i18n/locales';

/**
 * 六角數字盤的文案（六個語系）。寫法照 app/i18n/gameText.ts 的規定：語系 key 在兩格縮排、
 * 依 'zh-TW' → en → ja → ko → 'zh-Hans' → th 排，字型子集腳本靠這個切字。
 *
 * 遊戲名（glossary〈六角數字盤〉）：繁中「六角數字盤」、簡中「六角数字盘」（catalog 原本就這樣寫）、韓文「헥사곤」（節目原名，catalog 的 LOCAL_NAMES）；
 * 英日泰照英文官方名 Hexagon（日文沒查到一致的寫法，不自己音譯）。
 * 術語：目標數 target、組合（一直線相鄰的三格）、回合 round、翻面 flip。畫面上不寫「你」（同全站）。
 *
 * 模板變數：{i} 第幾回合、{n} 總數或目標數、{k} 找到幾組、{s} 秒數、{score} 分數、{date} 日期。
 */
export type HexText = {
  title: string;
  /** 標題下的小字（英文名）；英文本身不需要 */
  subtitle?: string;
  metaTitle: string;
  metaDescription: string;
  tagline: string;
  daily: string;
  dailyKicker: string;
  dailyDone: string;
  show: string;
  showKicker: string;
  practice: string;
  practiceKicker: string;
  pickLevel: string;
  levels: Record<'easy' | 'normal' | 'hard', { name: string; note: string }>;
  howTo: string;
  menu: string;
  round: string;
  roundOf: string;
  score: string;
  target: string;
  memorize: string;
  memorizeHint: string;
  ready: string;
  pickHint: string;
  clear: string;
  submit: string;
  done: string;
  idle: string;
  correct: string;
  notLine: string;
  wrongSum: string;
  repeat: string;
  revealTitle: string;
  foundOf: string;
  next: string;
  finish: string;
  resultTitle: string;
  found: string;
  wrong: string;
  again: string;
  viewResult: string;
  gotIt: string;
  howTitles: readonly string[];
  howSteps: readonly string[];
};

export const TEXT = {
  'zh-TW': {
    title: '六角數字盤',
    subtitle: 'Hexagon',
    metaTitle: '六角數字盤 Hexagon｜魔鬼的計謀 決賽記憶算術，線上免下載',
    metaDescription: '《魔鬼的計謀》第 1 季決賽的 Hexagon：19 格六角形先看 30 秒數字，翻面後找出一直線上相鄰、加起來等於目標數的三格。有節目規則、每日一題與練習，免下載、免註冊。',
    tagline: '先看 30 秒數字，翻面之後，找出一直線上相鄰、加起來等於目標數的三格。',
    daily: '每日一題',
    dailyKicker: '{date}・5 回合',
    dailyDone: '{date} 已完成・{score} 分',
    show: '節目規則',
    showKicker: '10 回合・答對 +1、答錯 −1',
    practice: '練習',
    practiceKicker: '選難度，一題接一題',
    pickLevel: '練習難度',
    levels: {
      easy: { name: '簡單', note: '看 60 秒・數字 1～5・找到的留在盤上' },
      normal: { name: '普通', note: '看 30 秒・數字 1～7（同節目）' },
      hard: { name: '困難', note: '看 20 秒・數字 1～10' },
    },
    howTo: '怎麼玩？',
    menu: '回選單',
    round: '回合',
    roundOf: '{i} / {n}',
    score: '分數',
    target: '目標數',
    memorize: '記住數字',
    memorizeHint: '翻面後才公布目標數',
    ready: '記好了，翻面',
    pickHint: '點一直線上相鄰的三格',
    clear: '清除',
    submit: '送出',
    done: '這回合找完了',
    idle: '{s} 秒沒送出就換下一回合',
    correct: '答對 +1',
    notLine: '不是一直線上相鄰的三格 −1',
    wrongSum: '加起來不是 {n} −1',
    repeat: '這組答過了 −1',
    revealTitle: '這回合有 {n} 組',
    foundOf: '找到 {k} / {n}',
    next: '下一回合',
    finish: '看結算',
    resultTitle: '{score} 分',
    found: '找到',
    wrong: '答錯',
    again: '再玩一次',
    viewResult: '看結算',
    gotIt: '知道了',
    howTitles: ['盤面', '先記數字', '找出三格', '計分', '換回合'],
    howSteps: [
      '19 格六角形排成 3-4-5-4-3，正面是數字，背面是 A 到 S 的字母。',
      '每回合先看 30 秒數字，時間到就翻面（練習的簡單看 60 秒、困難 20 秒）。記好了也可以先翻。',
      '翻面後公布目標數：找出一直線上相鄰的三格（橫的、兩個斜的方向都算），加起來剛好等於目標數。點三格再送出，順序不拘。',
      '答對 +1、答錯 −1。不是一直線、加起來不對、答過的組合再答一次，都算答錯。一回合有幾組不公布。',
      '全部找到、按「這回合找完了」，或 90 秒沒送出，就翻回數字公布答案。節目規則 10 回合，每日一題 5 回合。',
    ],
  },
  en: {
    title: 'Hexagon',
    metaTitle: "Hexagon — The Devil's Plan final memory-math game, play online",
    metaDescription: "Play Hexagon from the Season 1 final of The Devil's Plan: memorize 19 numbered hexagons for 30 seconds, then find three in a straight line that add up to the target. Show rules, a daily puzzle and practice — free, no download.",
    tagline: 'Memorize the numbers for 30 seconds. Then the tiles flip — find three in a straight line that add up to the target.',
    daily: 'Daily puzzle',
    dailyKicker: '{date} · 5 rounds',
    dailyDone: '{date} done · {score} pts',
    show: 'Show rules',
    showKicker: '10 rounds · right +1, wrong −1',
    practice: 'Practice',
    practiceKicker: 'Pick a level, one board after another',
    pickLevel: 'Practice level',
    levels: {
      easy: { name: 'Easy', note: '60 s to look · numbers 1–5 · found lines stay marked' },
      normal: { name: 'Normal', note: '30 s to look · numbers 1–7 (as on the show)' },
      hard: { name: 'Hard', note: '20 s to look · numbers 1–10' },
    },
    howTo: 'How to play',
    menu: 'Menu',
    round: 'Round',
    roundOf: '{i} / {n}',
    score: 'Score',
    target: 'Target',
    memorize: 'Memorize',
    memorizeHint: 'The target appears after the flip',
    ready: 'Ready — flip',
    pickHint: 'Tap three adjacent tiles in a line',
    clear: 'Clear',
    submit: 'Submit',
    done: 'Done with this round',
    idle: 'Round ends after {s} s without an answer',
    correct: 'Correct +1',
    notLine: 'Not three in a line −1',
    wrongSum: "Doesn't add up to {n} −1",
    repeat: 'Already found −1',
    revealTitle: '{n} answers this round',
    foundOf: 'Found {k} / {n}',
    next: 'Next round',
    finish: 'See result',
    resultTitle: '{score} pts',
    found: 'Found',
    wrong: 'Wrong',
    again: 'Play again',
    viewResult: 'See result',
    gotIt: 'Got it',
    howTitles: ['The board', 'Memorize', 'Find three', 'Scoring', 'Next round'],
    howSteps: [
      '19 hexagons in rows of 3-4-5-4-3. The front shows numbers, the back shows letters A to S.',
      'Each round you see the numbers for 30 seconds, then the tiles flip (Easy practice gives 60 s, Hard 20 s). You can flip early.',
      'After the flip the target is announced. Find three adjacent tiles in a straight line — across or along either diagonal — that add up to it. Tap the three and submit, in any order.',
      'Right +1, wrong −1. Not a line, the wrong sum, or a line already found all count as wrong. The number of answers is never told.',
      'When every line is found, you tap “Done with this round”, or 90 s pass without an answer, the numbers flip back with the answers. Show rules last 10 rounds, the daily puzzle 5.',
    ],
  },
  ja: {
    title: 'Hexagon',
    subtitle: '六角形の数字盤',
    metaTitle: 'Hexagon（ヘキサゴン）｜デビルズ・プラン決勝の記憶×計算ゲーム、無料で遊べる',
    metaDescription: '『デビルズ・プラン』シーズン1決勝のHexagon。19枚の六角形の数字を30秒で覚え、裏返ったあと一直線に並ぶ3枚で目標の数を作ります。番組ルール・毎日の1問・練習。無料・インストール不要。',
    tagline: '30秒で数字を覚えて、裏返ったら一直線に並ぶ3枚で目標の数を作る。',
    daily: '毎日の1問',
    dailyKicker: '{date}・5ラウンド',
    dailyDone: '{date} クリア・{score}点',
    show: '番組ルール',
    showKicker: '10ラウンド・正解 +1、不正解 −1',
    practice: '練習',
    practiceKicker: '難易度を選んで、次々に',
    pickLevel: '練習の難易度',
    levels: {
      easy: { name: 'かんたん', note: '60秒・数字 1〜5・見つけた線は残る' },
      normal: { name: 'ふつう', note: '30秒・数字 1〜7（番組と同じ）' },
      hard: { name: 'むずかしい', note: '20秒・数字 1〜10' },
    },
    howTo: '遊び方',
    menu: 'メニュー',
    round: 'ラウンド',
    roundOf: '{i} / {n}',
    score: '得点',
    target: '目標の数',
    memorize: '数字を覚える',
    memorizeHint: '目標の数は裏返したあとに出ます',
    ready: '覚えた、裏返す',
    pickHint: '一直線に並ぶ3枚をタップ',
    clear: 'クリア',
    submit: '答える',
    done: 'このラウンドは終わり',
    idle: '{s}秒答えないと次のラウンドへ',
    correct: '正解 +1',
    notLine: '一直線の3枚ではありません −1',
    wrongSum: '合計が{n}ではありません −1',
    repeat: 'もう答えた組み合わせ −1',
    revealTitle: 'このラウンドの答えは{n}組',
    foundOf: '{k} / {n} 組',
    next: '次のラウンド',
    finish: '結果を見る',
    resultTitle: '{score}点',
    found: '見つけた',
    wrong: '不正解',
    again: 'もう一度',
    viewResult: '結果を見る',
    gotIt: 'わかった',
    howTitles: ['盤', 'まず覚える', '3枚を探す', '得点', '次のラウンド'],
    howSteps: [
      '19枚の六角形が3-4-5-4-3に並び、表は数字、裏はAからSのアルファベット。',
      '毎ラウンド、数字を30秒見たら裏返ります（練習のかんたんは60秒、むずかしいは20秒）。覚えたら先に裏返してもOK。',
      '裏返すと目標の数が出ます。一直線に隣り合う3枚（横と斜め2方向）で、合計がちょうど目標の数になるものを探します。3枚をタップして答える、順番は自由。',
      '正解 +1、不正解 −1。一直線でない、合計が違う、答えた組み合わせをもう一度、はすべて不正解。答えが何組あるかは教えません。',
      '全部見つける、「このラウンドは終わり」を押す、または90秒答えないと、数字に戻って答えが出ます。番組ルールは10ラウンド、毎日の1問は5ラウンド。',
    ],
  },
  ko: {
    title: '헥사곤',
    subtitle: 'Hexagon',
    metaTitle: '헥사곤 Hexagon｜데블스 플랜 결승 기억력 계산 게임, 무료 온라인',
    metaDescription: '데블스 플랜 시즌 1 결승의 헥사곤. 19개 육각형의 숫자를 30초 동안 외우고, 뒤집힌 뒤 일직선으로 이웃한 세 칸으로 목표 숫자를 만드세요. 방송 규칙·오늘의 문제·연습. 무료, 설치 없음.',
    tagline: '30초 동안 숫자를 외우고, 뒤집힌 뒤 일직선으로 이웃한 세 칸으로 목표 숫자를 만든다.',
    daily: '오늘의 문제',
    dailyKicker: '{date} · 5라운드',
    dailyDone: '{date} 완료 · {score}점',
    show: '방송 규칙',
    showKicker: '10라운드 · 정답 +1, 오답 −1',
    practice: '연습',
    practiceKicker: '난이도를 골라 계속',
    pickLevel: '연습 난이도',
    levels: {
      easy: { name: '쉬움', note: '60초 · 숫자 1~5 · 찾은 줄은 남음' },
      normal: { name: '보통', note: '30초 · 숫자 1~7 (방송과 같음)' },
      hard: { name: '어려움', note: '20초 · 숫자 1~10' },
    },
    howTo: '게임 방법',
    menu: '메뉴',
    round: '라운드',
    roundOf: '{i} / {n}',
    score: '점수',
    target: '목표 숫자',
    memorize: '숫자 외우기',
    memorizeHint: '목표 숫자는 뒤집은 뒤 공개',
    ready: '다 외웠다, 뒤집기',
    pickHint: '일직선으로 이웃한 세 칸을 누르기',
    clear: '지우기',
    submit: '제출',
    done: '이번 라운드 끝',
    idle: '{s}초 동안 제출이 없으면 다음 라운드',
    correct: '정답 +1',
    notLine: '일직선으로 이웃한 세 칸이 아님 −1',
    wrongSum: '합이 {n}이 아님 −1',
    repeat: '이미 맞힌 조합 −1',
    revealTitle: '이번 라운드 정답 {n}개',
    foundOf: '{k} / {n}개',
    next: '다음 라운드',
    finish: '결과 보기',
    resultTitle: '{score}점',
    found: '찾음',
    wrong: '오답',
    again: '다시 하기',
    viewResult: '결과 보기',
    gotIt: '알겠어요',
    howTitles: ['판', '먼저 외우기', '세 칸 찾기', '점수', '다음 라운드'],
    howSteps: [
      '육각형 19개가 3-4-5-4-3으로 놓여 있고, 앞면은 숫자, 뒷면은 A부터 S까지의 알파벳.',
      '라운드마다 숫자를 30초 본 뒤 뒤집힘(연습 쉬움 60초, 어려움 20초). 다 외웠으면 먼저 뒤집어도 됨.',
      '뒤집으면 목표 숫자 공개. 일직선(가로, 대각선 두 방향)으로 이웃한 세 칸 중 합이 딱 목표 숫자인 것을 찾기. 세 칸을 누르고 제출, 순서는 자유.',
      '정답 +1, 오답 −1. 일직선이 아니거나, 합이 틀리거나, 맞힌 조합을 다시 내면 모두 오답. 정답이 몇 개인지는 알려 주지 않음.',
      '모두 찾거나, ‘이번 라운드 끝’을 누르거나, 90초 동안 제출이 없으면 숫자로 돌아가 정답 공개. 방송 규칙은 10라운드, 오늘의 문제는 5라운드.',
    ],
  },
  'zh-Hans': {
    title: '六角数字盘',
    subtitle: 'Hexagon',
    metaTitle: '六角数字盘 Hexagon｜魔鬼的计谋 决赛记忆算术，在线免下载',
    metaDescription: '《魔鬼的计谋》第 1 季决赛的 Hexagon：19 格六角形先看 30 秒数字，翻面后找出一直线上相邻、加起来等于目标数的三格。有节目规则、每日一题与练习，免下载、免注册。',
    tagline: '先看 30 秒数字，翻面之后，找出一直线上相邻、加起来等于目标数的三格。',
    daily: '每日一题',
    dailyKicker: '{date}・5 回合',
    dailyDone: '{date} 已完成・{score} 分',
    show: '节目规则',
    showKicker: '10 回合・答对 +1、答错 −1',
    practice: '练习',
    practiceKicker: '选难度，一题接一题',
    pickLevel: '练习难度',
    levels: {
      easy: { name: '简单', note: '看 60 秒・数字 1～5・找到的留在盘上' },
      normal: { name: '普通', note: '看 30 秒・数字 1～7（同节目）' },
      hard: { name: '困难', note: '看 20 秒・数字 1～10' },
    },
    howTo: '怎么玩？',
    menu: '回菜单',
    round: '回合',
    roundOf: '{i} / {n}',
    score: '分数',
    target: '目标数',
    memorize: '记住数字',
    memorizeHint: '翻面后才公布目标数',
    ready: '记好了，翻面',
    pickHint: '点一直线上相邻的三格',
    clear: '清除',
    submit: '提交',
    done: '这回合找完了',
    idle: '{s} 秒没提交就换下一回合',
    correct: '答对 +1',
    notLine: '不是一直线上相邻的三格 −1',
    wrongSum: '加起来不是 {n} −1',
    repeat: '这组答过了 −1',
    revealTitle: '这回合有 {n} 组',
    foundOf: '找到 {k} / {n}',
    next: '下一回合',
    finish: '看结算',
    resultTitle: '{score} 分',
    found: '找到',
    wrong: '答错',
    again: '再玩一次',
    viewResult: '看结算',
    gotIt: '知道了',
    howTitles: ['盘面', '先记数字', '找出三格', '计分', '换回合'],
    howSteps: [
      '19 格六角形排成 3-4-5-4-3，正面是数字，背面是 A 到 S 的字母。',
      '每回合先看 30 秒数字，时间到就翻面（练习的简单看 60 秒、困难 20 秒）。记好了也可以先翻。',
      '翻面后公布目标数：找出一直线上相邻的三格（横的、两个斜的方向都算），加起来刚好等于目标数。点三格再提交，顺序不拘。',
      '答对 +1、答错 −1。不是一直线、加起来不对、答过的组合再答一次，都算答错。一回合有几组不公布。',
      '全部找到、按「这回合找完了」，或 90 秒没提交，就翻回数字公布答案。节目规则 10 回合，每日一题 5 回合。',
    ],
  },
  th: {
    title: 'Hexagon',
    subtitle: 'แผ่นหกเหลี่ยมตัวเลข',
    metaTitle: "Hexagon｜เกมจำและบวกเลขรอบชิง The Devil's Plan เล่นออนไลน์ฟรี",
    metaDescription: "เล่น Hexagon จากรอบชิงซีซัน 1 ของ The Devil's Plan: จำตัวเลขบนหกเหลี่ยม 19 แผ่นใน 30 วินาที แล้วหาสามแผ่นที่เรียงเป็นเส้นตรงและรวมได้เท่าเป้าหมาย มีกติกาแบบรายการ โจทย์ประจำวัน และโหมดฝึก ฟรี ไม่ต้องดาวน์โหลด",
    tagline: 'จำตัวเลข 30 วินาที พอแผ่นพลิกแล้ว หาสามแผ่นที่เรียงเป็นเส้นตรงและรวมได้เท่าเป้าหมาย',
    daily: 'โจทย์ประจำวัน',
    dailyKicker: '{date} · 5 รอบ',
    dailyDone: '{date} เสร็จแล้ว · {score} คะแนน',
    show: 'กติกาแบบรายการ',
    showKicker: '10 รอบ · ถูก +1 ผิด −1',
    practice: 'ฝึก',
    practiceKicker: 'เลือกระดับ แล้วเล่นต่อเนื่อง',
    pickLevel: 'ระดับการฝึก',
    levels: {
      easy: { name: 'ง่าย', note: 'ดู 60 วินาที · เลข 1–5 · เส้นที่เจอแล้วยังแสดงอยู่' },
      normal: { name: 'ปกติ', note: 'ดู 30 วินาที · เลข 1–7 (เหมือนในรายการ)' },
      hard: { name: 'ยาก', note: 'ดู 20 วินาที · เลข 1–10' },
    },
    howTo: 'วิธีเล่น',
    menu: 'เมนู',
    round: 'รอบ',
    roundOf: '{i} / {n}',
    score: 'คะแนน',
    target: 'เป้าหมาย',
    memorize: 'จำตัวเลข',
    memorizeHint: 'เป้าหมายจะประกาศหลังพลิกแผ่น',
    ready: 'จำได้แล้ว พลิกเลย',
    pickHint: 'แตะสามแผ่นที่ติดกันเป็นเส้นตรง',
    clear: 'ล้าง',
    submit: 'ส่งคำตอบ',
    done: 'รอบนี้พอแล้ว',
    idle: 'ไม่ส่งคำตอบ {s} วินาทีจะไปรอบถัดไป',
    correct: 'ถูก +1',
    notLine: 'ไม่ใช่สามแผ่นติดกันเป็นเส้นตรง −1',
    wrongSum: 'รวมไม่ได้ {n} −1',
    repeat: 'ชุดนี้ตอบไปแล้ว −1',
    revealTitle: 'รอบนี้มี {n} ชุด',
    foundOf: 'เจอ {k} / {n}',
    next: 'รอบถัดไป',
    finish: 'ดูผล',
    resultTitle: '{score} คะแนน',
    found: 'เจอ',
    wrong: 'ผิด',
    again: 'เล่นอีกครั้ง',
    viewResult: 'ดูผล',
    gotIt: 'เข้าใจแล้ว',
    howTitles: ['กระดาน', 'จำก่อน', 'หาสามแผ่น', 'คะแนน', 'รอบถัดไป'],
    howSteps: [
      'หกเหลี่ยม 19 แผ่นเรียงเป็น 3-4-5-4-3 ด้านหน้าเป็นตัวเลข ด้านหลังเป็นตัวอักษร A ถึง S',
      'ทุกรอบจะได้ดูตัวเลข 30 วินาที แล้วแผ่นจะพลิก (ฝึกระดับง่าย 60 วินาที ยาก 20 วินาที) จำได้แล้วพลิกก่อนก็ได้',
      'พอพลิกแล้วจะประกาศเป้าหมาย หาสามแผ่นที่ติดกันเป็นเส้นตรง (แนวนอนหรือแนวทแยงทั้งสองทิศ) ที่รวมได้เท่าเป้าหมายพอดี แตะสามแผ่นแล้วส่ง ลำดับไหนก็ได้',
      'ถูก +1 ผิด −1 ไม่เป็นเส้นตรง ผลรวมผิด หรือส่งชุดที่ตอบไปแล้วซ้ำ นับเป็นผิดทั้งหมด ไม่บอกว่ารอบนี้มีกี่ชุด',
      'เมื่อเจอครบ กด “รอบนี้พอแล้ว” หรือไม่ส่งคำตอบ 90 วินาที แผ่นจะพลิกกลับเป็นตัวเลขพร้อมเฉลย กติกาแบบรายการมี 10 รอบ โจทย์ประจำวัน 5 รอบ',
    ],
  },
} satisfies Record<Locale, HexText>;
