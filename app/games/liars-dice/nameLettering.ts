// 由 scripts/build-name-lettering.mjs 產生（npm run name:build -- liars-dice），不要手改；各語系挑的字在 scripts/name-lettering/liars-dice.mjs。
import type { NameLettering } from '@/types/lettering';

export const NAME_LETTERING: NameLettering = {
  'zh-TW': { text: '大話骰', h: 0.99, gap: 0.02, lead: 0.11, fit: 3.05, pieces: [{ src: '/games/liars-dice/name/zh-TW-0.svg', w: 3.04 }] },
  'zh-Hans': { text: '大话骰', h: 0.99, gap: 0.02, lead: 0.11, fit: 3.05, pieces: [{ src: '/games/liars-dice/name/zh-Hans-0.svg', w: 3.04 }] },
  ja: { text: 'ライアーズダイス', h: 0.998, gap: 0.02, lead: 0.102, fit: 7.98, pieces: [{ src: '/games/liars-dice/name/ja-0.svg', w: 7.97 }] },
  ko: { text: '라이어스 다이스', h: 1.011, gap: 0.287, lead: 0.089, fit: 3.934, pieces: [{ src: '/games/liars-dice/name/ko-0.svg', w: 3.924 }, { src: '/games/liars-dice/name/ko-1.svg', w: 2.938 }] },
};
