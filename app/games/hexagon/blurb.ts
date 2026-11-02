import type { TextTable } from '@/i18n/gameText';

/** 平台首頁大卡片上的介紹（寫法同其他款的 blurb.ts：meta 是出自哪一季．幾人．免下載，body 兩三句講怎麼玩） */
export const BLURB = {
  'zh-TW': {
    meta: '第 1 季決賽．1 人．免下載',
    body: '19 格六角形先看 30 秒數字，翻面之後只剩字母：找出一直線上相鄰、加起來等於目標數的三格，答對 +1、答錯 −1。有節目規則 10 回合、每天一樣的每日一題，和慢慢來的練習。',
  },
  en: {
    meta: 'Season 1 final · 1 player · No download',
    body: 'Memorize 19 numbered hexagons for 30 seconds — then they flip to letters. Find three in a straight line that add up to the target: +1 if right, −1 if wrong. Play the show’s 10 rounds, the same daily puzzle as everyone else, or practice at your own pace.',
  },
  ja: {
    meta: 'シーズン1決勝・1人・インストール不要',
    body: '19枚の六角形の数字を30秒で覚えると、裏返ってアルファベットだけに。一直線に並ぶ3枚で目標の数を作れたら +1、まちがえたら −1。番組と同じ10ラウンド、毎日同じ1問、ゆっくり練習も。',
  },
  ko: {
    meta: '시즌1 결승 · 1인 · 설치 없음',
    body: '육각형 19개의 숫자를 30초 동안 외우면 뒤집혀 알파벳만 남습니다. 일직선으로 이웃한 세 칸으로 목표 숫자를 만들면 +1, 틀리면 −1. 방송과 같은 10라운드, 매일 같은 오늘의 문제, 천천히 하는 연습까지.',
  },
  'zh-Hans': {
    meta: '第 1 季决赛·1 人·免下载',
    body: '19 格六角形先看 30 秒数字，翻面之后只剩字母：找出一直线上相邻、加起来等于目标数的三格，答对 +1、答错 −1。有节目规则 10 回合、每天一样的每日一题，和慢慢来的练习。',
  },
  th: {
    meta: 'รอบชิงซีซัน 1 · 1 คน · ไม่ต้องดาวน์โหลด',
    body: 'จำตัวเลขบนหกเหลี่ยม 19 แผ่นใน 30 วินาที แล้วแผ่นจะพลิกเหลือแต่ตัวอักษร หาสามแผ่นที่เรียงเป็นเส้นตรงและรวมได้เท่าเป้าหมาย ถูก +1 ผิด −1 เล่นได้ทั้ง 10 รอบแบบรายการ โจทย์ประจำวันเดียวกันทุกคน หรือฝึกตามสบาย',
  },
} satisfies TextTable<{ meta: string; body: string }>;
