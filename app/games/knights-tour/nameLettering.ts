// 由 scripts/build-name-lettering.mjs 產生（npm run name:build -- knights-tour），不要手改；各語系挑的字在 scripts/name-lettering/knights-tour.mjs。
import type { NameLettering } from '@/types/lettering';

export const NAME_LETTERING: NameLettering = {
  'zh-TW': { text: '騎士巡遊', h: 0.963, gap: 0.04, lead: 0.137, fit: 4.13, pieces: [{ src: '/games/knights-tour/name/zh-TW-0.svg', w: 4.12 }] },
  'zh-Hans': { text: '骑士巡游', h: 0.967, gap: 0.04, lead: 0.133, fit: 4.13, pieces: [{ src: '/games/knights-tour/name/zh-Hans-0.svg', w: 4.12 }] },
  ja: { text: 'ナイトツアー', h: 0.864, gap: 0.04, lead: 0.236, fit: 6.11, pieces: [{ src: '/games/knights-tour/name/ja-0.svg', w: 6.1 }] },
  ko: { text: '기사의 여행', h: 1.002, gap: 0.335, lead: 0.098, fit: 2.988, pieces: [{ src: '/games/knights-tour/name/ko-0.svg', w: 2.978 }, { src: '/games/knights-tour/name/ko-1.svg', w: 1.972 }] },
  th: { text: 'ทางเดินม้า', h: 0.916, gap: 0.04, lead: 0.184, fit: 4.77, pieces: [{ src: '/games/knights-tour/name/th-0.svg', w: 4.76 }] },
};
