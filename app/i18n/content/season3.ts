import type { Locale } from '../locales';
import * as routes from '../routes';

/**
 * 第 3 季頁（/season/3）的內容（docs/season3-page.md，大腦筋 11/3 派工）：介紹、先玩前兩季的遊戲、開播後怎麼更新、常見問題。
 *
 * 只寫有官方來源的事：Netflix 新聞稿（about.netflix.com/en/news/the-devils-plan-dead-again-teaser）寫的是
 * 11/10 全球上線、只在 Netflix、16 位玩家。集數、是不是分週上架都沒寫 —— Reddit 轉述的「14 集」不寫。
 *
 * 開播後每次上架就改這一份（加那幾集的遊戲）並把 UPDATED 改成那一天：頁面上的「最後更新」與 FAQPage 的 dateModified 都讀它。
 * 常見問題同一份資料餵給畫面與 FAQPage（同 faq.ts 的理由）；{n}、{games} 由 jsonld.ts 的 season3Faq 換成現在能玩的遊戲。
 * 區塊順序照字型腳本：'zh-TW' → en → ja → ko → 'zh-Hans' → th。
 */
export const SEASON3_UPDATED = '2026-11-03';

export type Season3Text = {
  intro: string;
  updated: string;
  playTitle: string;
  playNote: string;
  /** 前兩季能玩的遊戲，每款一句（依站內路徑；沒寫的那款只放卡片） */
  lines: Partial<Record<string, string>>;
  updateTitle: string;
  updateBody: string;
  faqTitle: string;
  faq: { q: string; a: string }[];
};

export const SEASON3_TEXT: Record<Locale, Season3Text> = {
  'zh-TW': {
    intro: '《魔鬼的計謀》第 3 季《Dead Again》11/10 在 Netflix 全球上線。副標講的是「死過一次的人再回來」，這一季由 16 位玩家參戰。有幾集、會不會分週上架，Netflix 還沒公布。',
    updated: '最後更新：{date}',
    playTitle: '先玩前兩季的遊戲',
    playNote: '開播前，先把前兩季做好的遊戲玩一輪：都在瀏覽器裡開打，免下載、免註冊。',
    lines: {
      [routes.WALL_GO]: '7×7 的棋盤上走棋、蓋牆，把地圍起來。',
      [routes.BAGH_CHAL]: '4 隻老虎對 20 隻羊，第 2 季決賽的那盤棋。',
      [routes.KNIGHTS_TOUR]: '騎士走「日」字，把每一格都踩過一次。',
      [routes.BLIND_GOMOKU]: '看不出哪顆是誰的五子棋，連成五子才翻開。',
      [routes.NINE_MENS_MORRIS]: '連成一排三顆，就能拿走對方一顆子的古老棋戲。',
    },
    updateTitle: '開播後怎麼更新',
    updateBody: '11/10 開播後，每次有新的集數上架，一兩天內這一頁會整理那幾集出現的遊戲：名稱、目標、主要規則。能做成線上版的會標「之後會做」，做好了就直接連過去玩。',
    faqTitle: '常見問題',
    faq: [
      { q: '第 3 季什麼時候上線？',
        a: '2026 年 11 月 10 日在 Netflix 全球上線。集數與上架方式 Netflix 還沒公布，公布後會更新在這裡。' },
      { q: '第 3 季有哪些遊戲？',
        a: '節目還沒播，目前還不知道。開播後每次有新的集數上架，這一頁會在一兩天內整理出那幾集的遊戲與規則。' },
      { q: '在哪裡可以玩節目裡的遊戲？',
        a: '就在這個網站。前兩季已經做好 {n} 款：{games}。打開網頁就能玩，免下載、免註冊；依遊戲不同，可以一個人玩、跟電腦下，或傳連結找朋友。' },
      { q: '這個網站跟 Netflix 有關係嗎？',
        a: '沒有。這是非官方的粉絲作品，與 Netflix 及節目製作方無關。網站上的遊戲是照節目的規則自己做的線上版，不使用節目的影像與標誌。' },
    ],
  },
  en: {
    intro: "Season 3 of The Devil's Plan, Dead Again, premieres worldwide on Netflix on November 10. The subtitle is about players who have already been knocked out once coming back for more, and 16 players take part. Netflix hasn't said how many episodes there are or whether they'll be released weekly.",
    updated: 'Last updated: {date}',
    playTitle: 'Play the games from Seasons 1 and 2',
    playNote: "While you wait, try the games we've already built from the first two seasons. They run in your browser, free, with no download or sign-up.",
    lines: {
      [routes.WALL_GO]: 'Move, build a wall, and fence off the most ground on a 7×7 board.',
      [routes.BAGH_CHAL]: 'Four tigers against twenty goats — the board game from the Season 2 finale.',
      [routes.KNIGHTS_TOUR]: 'Hop a knight in its L-shape and land on every square exactly once.',
      [routes.BLIND_GOMOKU]: "Five in a row, except nobody can tell whose stones are whose until the end.",
      [routes.NINE_MENS_MORRIS]: "Line up three to take one of the other side's pieces — a game played since the Middle Ages.",
    },
    updateTitle: 'How this page will be updated',
    updateBody: "After the premiere on November 10, every time new episodes come out we'll write up their games here within a day or two: what they're called, the goal, and the main rules. Games we can turn into an online version are marked 'coming later', and once they're ready they link straight to the game.",
    faqTitle: 'FAQ',
    faq: [
      { q: 'When does Season 3 come out?',
        a: "November 10, 2026, worldwide on Netflix. Netflix hasn't said how many episodes there are or how they'll be released; we'll update this once it does." },
      { q: 'What games are in Season 3?',
        a: "Nobody knows yet — the show hasn't aired. Once new episodes are out, this page lists their games and rules within a day or two." },
      { q: 'Where can I play the games from the show?',
        a: 'Right here. {n} games from the first two seasons are ready: {games}. They open in your browser, free, with no download or sign-up. Depending on the game, you can play solo, against the computer, or send a link to a friend.' },
      { q: 'Is this site connected to Netflix?',
        a: "No. It's an unofficial fan project, not affiliated with Netflix or the show's producers. The games are our own online versions built from the show's rules, and we don't use the show's footage or logos." },
    ],
  },
  ja: {
    intro: '『悪魔の計略 ～デビルズ・プラン～』シーズン3『Dead Again』は 11/10 に Netflix で全世界配信。サブタイトルのとおり、一度「脱落」を味わったプレイヤーたちが戻ってくるシーズンで、16人が参加します。話数や毎週配信かどうかは、Netflix からまだ発表されていません。',
    updated: '最終更新：{date}',
    playTitle: 'シーズン1・2のゲームを先に遊ぶ',
    playNote: '配信を待つあいだに、前の2シーズンから作ったゲームをどうぞ。ブラウザですぐ遊べて、インストールも登録も不要です。',
    lines: {
      [routes.WALL_GO]: '7×7 の盤でコマを動かし、壁を立てて陣地を囲います。',
      [routes.BAGH_CHAL]: 'トラ4匹とヤギ20匹。シーズン2決勝のボードゲームです。',
      [routes.KNIGHTS_TOUR]: 'ナイトの動きで、盤のすべてのマスを一度ずつ回ります。',
      [routes.BLIND_GOMOKU]: 'どの石が誰のものか分からないまま打つ五目並べ。',
      [routes.NINE_MENS_MORRIS]: '3つ並べると相手のコマを1つ取れる、中世から続くボードゲーム。',
    },
    updateTitle: '配信後の更新について',
    updateBody: '11/10 の配信開始後、新しいエピソードが出るたびに、1～2日以内にこのページでその回のゲーム（名前、目的、主なルール）をまとめます。オンライン版にできるものは「制作予定」と書き、できあがったらゲームへのリンクにします。',
    faqTitle: 'よくある質問',
    faq: [
      { q: 'シーズン3はいつ配信されますか？',
        a: '2026年11月10日に Netflix で全世界配信されます。話数や配信の形式は Netflix からまだ発表されていません。発表されしだい、ここを更新します。' },
      { q: 'シーズン3にはどんなゲームが出ますか？',
        a: 'まだ配信前なので分かりません。エピソードが出たら、1～2日以内にこのページでその回のゲームとルールをまとめます。' },
      { q: '番組のゲームはどこで遊べますか？',
        a: 'このサイトで遊べます。前の2シーズンから {n} 本のゲームを作りました：{games}。ブラウザですぐ遊べて、インストールも登録も不要です。ゲームによって、ひとりで、コンピューター相手に、またはリンクを送って友だちと遊べます。' },
      { q: 'このサイトは Netflix と関係がありますか？',
        a: 'ありません。非公式のファン作品で、Netflix および番組制作会社とは関係ありません。ゲームは番組のルールをもとに独自に作ったオンライン版で、番組の映像やロゴは使っていません。' },
    ],
  },
  ko: {
    intro: '『데블스 플랜』 시즌3 『데드 어게인』은 11월 10일 넷플릭스에서 전 세계 동시 공개됩니다. 부제처럼 한 번 \'탈락\'을 맛본 플레이어들이 다시 돌아오는 시즌으로, 16명이 참가합니다. 회차 수와 매주 공개 여부는 넷플릭스가 아직 발표하지 않았습니다.',
    updated: '최종 업데이트: {date}',
    playTitle: '시즌1·2 게임 먼저 해 보기',
    playNote: '공개를 기다리는 동안 앞선 두 시즌에서 만든 게임을 즐겨 보세요. 브라우저에서 바로, 설치도 가입도 없이 할 수 있습니다.',
    lines: {
      [routes.WALL_GO]: '7×7 판에서 말을 움직이고 벽을 세워 땅을 차지합니다.',
      [routes.BAGH_CHAL]: '호랑이 4마리 대 염소 20마리, 시즌2 결승의 보드게임입니다.',
      [routes.KNIGHTS_TOUR]: '나이트의 움직임으로 판의 모든 칸을 한 번씩만 밟습니다.',
      [routes.BLIND_GOMOKU]: '어느 돌이 누구 것인지 모른 채 두는 오목입니다.',
      [routes.NINE_MENS_MORRIS]: '세 개를 한 줄로 놓으면 상대 말을 하나 가져오는, 중세부터 이어진 보드게임입니다.',
    },
    updateTitle: '공개 후 업데이트 방식',
    updateBody: '11월 10일 공개 후 새 회차가 나올 때마다 1~2일 안에 이 페이지에 그 회차의 게임(이름, 목표, 주요 규칙)을 정리합니다. 온라인으로 만들 수 있는 게임은 \'제작 예정\'으로 표시하고, 완성되면 바로 게임으로 연결합니다.',
    faqTitle: '자주 묻는 질문',
    faq: [
      { q: '시즌3는 언제 공개되나요?',
        a: '2026년 11월 10일 넷플릭스에서 전 세계 동시 공개됩니다. 회차 수와 공개 방식은 아직 발표되지 않았으며, 발표되면 이곳에 업데이트합니다.' },
      { q: '시즌3에는 어떤 게임이 나오나요?',
        a: '아직 공개 전이라 알 수 없습니다. 새 회차가 공개되면 1~2일 안에 이 페이지에 게임과 규칙을 정리합니다.' },
      { q: '방송에 나온 게임은 어디서 할 수 있나요?',
        a: '이 사이트에서 할 수 있습니다. 앞선 두 시즌의 게임 {n}개를 만들었습니다: {games}. 브라우저에서 바로, 설치도 가입도 없이 할 수 있고, 게임에 따라 혼자, 컴퓨터와, 또는 링크를 보내 친구와 함께 할 수 있습니다.' },
      { q: '이 사이트는 넷플릭스와 관련이 있나요?',
        a: '아니요. 비공식 팬 프로젝트이며 넷플릭스 및 제작사와 관련이 없습니다. 게임은 방송 규칙을 바탕으로 직접 만든 온라인 버전이며, 방송 영상이나 로고는 사용하지 않습니다.' },
    ],
  },
  'zh-Hans': {
    intro: '《魔鬼的计谋》第 3 季《Dead Again》11/10 在 Netflix 全球上线。副标题讲的是“死过一次的人再回来”，这一季由 16 位玩家参赛。有几集、会不会分周上线，Netflix 还没公布。',
    updated: '最后更新：{date}',
    playTitle: '先玩前两季的游戏',
    playNote: '开播前，先把前两季做好的游戏玩一轮：都在浏览器里开玩，免下载、免注册。',
    lines: {
      [routes.WALL_GO]: '7×7 的棋盘上走棋、盖墙，把地围起来。',
      [routes.BAGH_CHAL]: '4 只老虎对 20 只羊，第 2 季决赛的那盘棋。',
      [routes.KNIGHTS_TOUR]: '骑士走“日”字，把每一格都踩过一次。',
      [routes.BLIND_GOMOKU]: '看不出哪颗是谁的五子棋，连成五子才翻开。',
      [routes.NINE_MENS_MORRIS]: '连成一排三颗，就能拿走对方一颗子的古老棋戏。',
    },
    updateTitle: '开播后怎么更新',
    updateBody: '11/10 开播后，每次有新的集数上线，一两天内这一页会整理那几集出现的游戏：名称、目标、主要规则。能做成线上版的会标“之后会做”，做好了就直接链接过去玩。',
    faqTitle: '常见问题',
    faq: [
      { q: '第 3 季什么时候上线？',
        a: '2026 年 11 月 10 日在 Netflix 全球上线。集数与上线方式 Netflix 还没公布，公布后会更新在这里。' },
      { q: '第 3 季有哪些游戏？',
        a: '节目还没播，目前还不知道。开播后每次有新的集数上线，这一页会在一两天内整理出那几集的游戏与规则。' },
      { q: '在哪里可以玩节目里的游戏？',
        a: '就在这个网站。前两季已经做好 {n} 款：{games}。打开网页就能玩，免下载、免注册；依游戏不同，可以一个人玩、跟电脑下，或发链接找朋友。' },
      { q: '这个网站跟 Netflix 有关系吗？',
        a: '没有。这是非官方的粉丝作品，与 Netflix 及节目制作方无关。网站上的游戏是照节目的规则自己做的线上版，不使用节目的影像与标志。' },
    ],
  },
  th: {
    intro: "The Devil's Plan ซีซัน 3 ชื่อซีซัน Dead Again ออกฉายทั่วโลกทาง Netflix วันที่ 10 พ.ย. ตามชื่อซีซัน ผู้เล่นที่เคย \"ตกรอบ\" มาแล้วจะกลับมาสู้อีกครั้ง โดยมีผู้เล่น 16 คน ส่วนจำนวนตอนและจะทยอยปล่อยทุกสัปดาห์หรือไม่ Netflix ยังไม่ได้ประกาศ",
    updated: 'อัปเดตล่าสุด: {date}',
    playTitle: 'เล่นเกมจากซีซัน 1 และ 2 ก่อน',
    playNote: 'ระหว่างรอ ลองเล่นเกมที่เราทำจากสองซีซันแรกได้เลย เล่นบนเบราว์เซอร์ได้ทันที ฟรี ไม่ต้องดาวน์โหลด ไม่ต้องสมัครสมาชิก',
    lines: {
      [routes.WALL_GO]: 'เดินหมากและสร้างกำแพงบนกระดาน 7×7 เพื่อล้อมพื้นที่ให้ได้มากที่สุด',
      [routes.BAGH_CHAL]: 'เสือ 4 ตัวสู้กับแพะ 20 ตัว เกมกระดานจากรอบชิงของซีซัน 2',
      [routes.KNIGHTS_TOUR]: 'พาอัศวินเดินเป็นรูปตัว L ให้เหยียบทุกช่องบนกระดานช่องละครั้ง',
      [routes.BLIND_GOMOKU]: 'หมากห้าที่ไม่มีใครรู้ว่าหมากตัวไหนเป็นของใครจนจบเกม',
      [routes.NINE_MENS_MORRIS]: 'เรียงหมากครบสามตัวเป็นแถวเพื่อเก็บหมากของอีกฝ่าย เกมกระดานที่เล่นกันมาตั้งแต่ยุคกลาง',
    },
    updateTitle: 'หน้านี้จะอัปเดตอย่างไร',
    updateBody: 'หลังออกฉายวันที่ 10 พ.ย. ทุกครั้งที่มีตอนใหม่ เราจะสรุปเกมจากตอนเหล่านั้นไว้ในหน้านี้ภายใน 1–2 วัน ทั้งชื่อเกม เป้าหมาย และกติกาหลัก เกมที่ทำเป็นเวอร์ชันออนไลน์ได้จะเขียนว่า "กำลังจะทำ" และเมื่อเสร็จแล้วจะลิงก์ไปที่เกมโดยตรง',
    faqTitle: 'คำถามที่พบบ่อย',
    faq: [
      { q: 'ซีซัน 3 ออกฉายเมื่อไหร่',
        a: 'วันที่ 10 พฤศจิกายน 2026 ทั่วโลกทาง Netflix ส่วนจำนวนตอนและรูปแบบการปล่อยตอน Netflix ยังไม่ได้ประกาศ เมื่อประกาศแล้วเราจะอัปเดตที่นี่' },
      { q: 'ซีซัน 3 มีเกมอะไรบ้าง',
        a: 'ยังไม่มีใครรู้ เพราะรายการยังไม่ออกฉาย เมื่อมีตอนใหม่ หน้านี้จะสรุปเกมและกติกาภายใน 1–2 วัน' },
      { q: 'เล่นเกมจากรายการได้ที่ไหน',
        a: 'ที่เว็บไซต์นี้เลย เราทำเกมจากสองซีซันแรกไว้แล้ว {n} เกม: {games} เล่นบนเบราว์เซอร์ได้ทันที ฟรี ไม่ต้องดาวน์โหลด ไม่ต้องสมัครสมาชิก แล้วแต่เกม จะเล่นคนเดียว เล่นกับคอมพิวเตอร์ หรือส่งลิงก์ชวนเพื่อนก็ได้' },
      { q: 'เว็บไซต์นี้เกี่ยวข้องกับ Netflix ไหม',
        a: 'ไม่เกี่ยวข้อง นี่เป็นผลงานของแฟนที่ไม่เป็นทางการ ไม่มีความเกี่ยวข้องกับ Netflix หรือผู้ผลิตรายการ เกมทั้งหมดเป็นเวอร์ชันออนไลน์ที่เราทำขึ้นเองตามกติกาในรายการ และไม่ได้ใช้ภาพหรือโลโก้ของรายการ' },
    ],
  },
};
