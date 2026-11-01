// 由 scripts/build-name-lettering.mjs 產生（npm run name:build -- nine-mens-morris），不要手改；各語系挑的字在 scripts/name-lettering/nine-mens-morris.mjs。
import type { NameLettering } from '@/types/lettering';

export const NAME_LETTERING: NameLettering = {
  'zh-TW': { text: '九子棋', h: 0.953, gap: 0.06, lead: 0.147, fit: 3.13, pieces: [{ src: '/games/nine-mens-morris/name/zh-TW-0.svg', w: 3.12 }] },
  'zh-Hans': { text: '九子棋', h: 0.953, gap: 0.06, lead: 0.147, fit: 3.13, pieces: [{ src: '/games/nine-mens-morris/name/zh-Hans-0.svg', w: 3.12 }] },
  ja: { text: 'ナイン・メンズ・モリス', h: 0.89, gap: 0.06, lead: 0.21, fit: 7.37, pieces: [{ src: '/games/nine-mens-morris/name/ja-0.svg', w: 4.18 }, { src: '/games/nine-mens-morris/name/ja-1.svg', w: 4.18 }, { src: '/games/nine-mens-morris/name/ja-2.svg', w: 3.12 }] },
  ko: { text: '나인 멘스 모리스', h: 0.901, gap: 0.346, lead: 0.199, fit: 3.996, pieces: [{ src: '/games/nine-mens-morris/name/ko-0.svg', w: 1.82 }, { src: '/games/nine-mens-morris/name/ko-1.svg', w: 1.841, ml: -0.021 }, { src: '/games/nine-mens-morris/name/ko-2.svg', w: 2.783, ml: -0.023 }] },
};
