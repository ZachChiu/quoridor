import type { TextTable } from '@/i18n/gameText';

/**
 * 平台首頁大卡片上的介紹（寫法同其他款的 blurb.ts：兩格縮排、語系依序）。
 */
export const BLURB = {
  'zh-TW': {
    meta: '第 2 季．決賽．1–2 人．免下載',
    body: '兩人各藏 8 張撲克牌，秘密出價搶提問權，從 11 題裡問，報出對方 8 張的點數就贏。可以對電腦、同一台兩人，或挑戰全世界同一手的每日一手。',
  },
  en: {
    meta: 'Season 2 · Final · 1–2 players · No download',
    body: 'Each side hides 8 playing cards, bids in secret for the right to ask, picks from 11 questions, and wins by naming all 8 ranks. Play the computer, pass and play, or take on the daily hand.',
  },
  ja: {
    meta: 'シーズン2・決勝・1〜2人・インストール不要',
    body: '8枚のトランプを隠し、秘密の入札で質問権を取り、11の質問から選ぶ。相手の8枚の数字を当てたら勝ち。コンピューター対戦、1台で2人、毎日の1手。',
  },
  ko: {
    meta: '시즌2 · 결승 · 1~2인 · 설치 없음',
    body: '트럼프 8장을 숨기고 비밀 입찰로 질문권을 따내 11개 질문 중에서 고른다. 상대 8장의 숫자를 맞히면 승리. 컴퓨터와, 한 대로 둘이, 매일의 한 패.',
  },
  'zh-Hans': {
    meta: '第 2 季·决赛·1–2 人·免下载',
    body: '两人各藏 8 张扑克牌，秘密出价抢提问权，从 11 题里问，报出对方 8 张的点数就赢。可以对电脑、同一台两人，或挑战全世界同一手的每日一手。',
  },
  th: {
    meta: 'ซีซัน 2 · รอบชิง · 1–2 คน · ไม่ต้องดาวน์โหลด',
    body: 'ต่างฝ่ายซ่อนไพ่ 8 ใบ ประมูลลับชิงสิทธิ์ถาม เลือกจาก 11 คำถาม บอกแต้มไพ่ 8 ใบของอีกฝ่ายให้ถูกก็ชนะ เล่นกับคอมพิวเตอร์ สองคนเครื่องเดียว หรือไพ่ประจำวัน',
  },
} satisfies TextTable<{ meta: string; body: string }>;
