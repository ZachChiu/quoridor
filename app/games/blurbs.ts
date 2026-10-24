import * as routes from '@/i18n/routes';
import { BLURB as NINE_MENS_MORRIS } from './nine-mens-morris/blurb';
import { BLURB as BLIND_GOMOKU } from './blind-gomoku/blurb';
import { BLURB as KNIGHTS_TOUR } from './knights-tour/blurb';
import { BLURB as TIME_AUCTION } from './time-auction/blurb';
import { BLURB as BALANCE_MANCALA } from './balance-mancala/blurb';

/**
 * 第二批五款在平台大卡片上的介紹，依站內路徑查（文案在各款自己的 blurb.ts）。
 * Wall Go 與尼泊爾虎棋的在 messages 的 platform.heroMeta／baghHeroMeta（先做的，留在原處）。
 */
export const BLURBS: Partial<Record<string, typeof NINE_MENS_MORRIS>> = {
  [routes.NINE_MENS_MORRIS]: NINE_MENS_MORRIS,
  [routes.BLIND_GOMOKU]: BLIND_GOMOKU,
  [routes.KNIGHTS_TOUR]: KNIGHTS_TOUR,
  [routes.TIME_AUCTION]: TIME_AUCTION,
  [routes.BALANCE_MANCALA]: BALANCE_MANCALA,
};
