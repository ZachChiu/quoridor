import type { TextTable } from '@/i18n/gameText';

/**
 * 平台首頁大卡片上的介紹（寫法同其他款的 blurb.ts：兩格縮排、語系依序）。
 * 卡片上的名字是節目裡的 Doubt and Bet（疑心下注），點進去玩的是它的原型大話骰，body 第一句先講清楚。
 */
export const BLURB = {
  'zh-TW': {
    meta: '第 2 季．2–6 人．免下載',
    body: '節目裡 Doubt and Bet 的原型是大話骰：每人五顆骰子藏在骰盅裡，輪流喊「全桌至少有幾個幾」，不信就開，輸的人少一顆。可以跟電腦玩，或同一台輪流。',
  },
  en: {
    meta: 'Season 2 · 2–6 players · No download',
    body: 'Doubt and Bet is built on Liar’s Dice: five dice under every cup, claim how many of a face are on the table, or call the bluff — whoever is wrong loses a die. Play against the computer, or pass and play.',
  },
  ja: {
    meta: 'シーズン2・2〜6人・インストール不要',
    body: 'Doubt and Bet の原型はライアーズダイス。全員5個のサイコロをカップに隠し、場にある目の数を宣言、疑うなら開ける。外れた側が1個失う。コンピューター相手や1台で回して遊べます。',
  },
  ko: {
    meta: '시즌2 · 2~6인 · 설치 없음',
    body: 'Doubt and Bet의 원형은 라이어스 다이스. 모두 주사위 다섯 개를 컵에 숨기고 판에 있는 눈의 수를 외치고, 못 믿겠으면 연다. 틀린 쪽이 하나 잃는다. 컴퓨터와, 또는 한 대로 돌려 가며.',
  },
  'zh-Hans': {
    meta: '第 2 季·2–6 人·免下载',
    body: '节目里 Doubt and Bet 的原型是大话骰：每人五颗骰子藏在骰盅里，轮流喊“全桌至少有几个几”，不信就开，输的人少一颗。可以跟电脑玩，或同一台轮流。',
  },
  th: {
    meta: 'ซีซัน 2 · 2–6 คน · ไม่ต้องดาวน์โหลด',
    body: 'ต้นแบบของ Doubt and Bet คือ Liar’s Dice ทุกคนซ่อนลูกเต๋าห้าลูกใต้ถ้วย บอกว่าบนโต๊ะมีหน้านี้กี่ลูก ถ้าไม่เชื่อก็เปิด ฝ่ายที่ผิดเสียหนึ่งลูก เล่นกับคอมพิวเตอร์หรือผลัดกันในเครื่องเดียว',
  },
} satisfies TextTable<{ meta: string; body: string }>;
