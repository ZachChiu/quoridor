import type { TextTable } from '@/i18n/gameText';

/** 平台首頁大卡片上的介紹（寫法同其他款的 blurb.ts：meta 是出自哪一季．幾人．免下載，body 兩三句講怎麼玩） */
export const BLURB = {
  'zh-TW': {
    meta: '第 2 季監獄賽．1 人．免下載',
    body: '10 格金字塔，每格一個符號加一個數字：挑 3 格排成算式，等於目標數就對（第一格的符號不算、先乘除後加減）。有節目規則 10 回合跟電腦搶答、全世界同一盤的每日一題，和 15 格的大金字塔。',
  },
  en: {
    meta: 'Season 2 prison match · 1 player · No download',
    body: 'Ten blocks, each a sign and a number: pick 3 in order to make an equation that hits the target (the first sign is ignored, × and ÷ go first). Race the computer over the show’s 10 rounds, solve the daily board everyone shares, or take on the 15-block big pyramid.',
  },
  ja: {
    meta: 'シーズン2 監獄マッチ・1人・インストール不要',
    body: '記号と数字が書かれた 10 枚のピラミッド。3 枚を順番に並べて式を作り、目標の数になれば正解（1 枚目の記号は無視、かけ算・わり算が先）。番組と同じ 10 ラウンドをコンピューターと早押し、世界共通の毎日の1問、15 枚の大ピラミッドも。',
  },
  ko: {
    meta: '시즌2 감옥 매치 · 1인 · 설치 없음',
    body: '부호와 숫자가 적힌 10칸 피라미드. 세 칸을 순서대로 놓아 식을 만들어 목표 숫자가 되면 정답(첫 칸의 부호는 무시, 곱셈·나눗셈 먼저). 방송과 같은 10라운드를 컴퓨터와 빨리 맞히기, 전 세계 같은 오늘의 문제, 15칸 큰 피라미드까지.',
  },
  'zh-Hans': {
    meta: '第 2 季监狱赛·1 人·免下载',
    body: '10 格金字塔，每格一个符号加一个数字：挑 3 格排成算式，等于目标数就对（第一格的符号不算、先乘除后加减）。有节目规则 10 回合跟电脑抢答、全世界同一盘的每日一题，和 15 格的大金字塔。',
  },
  th: {
    meta: 'แมตช์คุก ซีซัน 2 · 1 คน · ไม่ต้องดาวน์โหลด',
    body: 'พีระมิด 10 ช่อง แต่ละช่องมีเครื่องหมายกับตัวเลข เลือก 3 ช่องเรียงเป็นสมการให้เท่าเป้าหมาย (ไม่นับเครื่องหมายช่องแรก คูณหารก่อน) แข่งกดตอบกับคอมพิวเตอร์ 10 รอบแบบรายการ โจทย์ประจำวันเดียวกันทั่วโลก หรือพีระมิดใหญ่ 15 ช่อง',
  },
} satisfies TextTable<{ meta: string; body: string }>;
