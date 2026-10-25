import * as routes from '@/i18n/routes';
import type { NameLettering } from '@/types/lettering';
import { NAME_LETTERING as NINE_MENS_MORRIS } from './nine-mens-morris/nameLettering';
import { NAME_LETTERING as BLIND_GOMOKU } from './blind-gomoku/nameLettering';
import { NAME_LETTERING as KNIGHTS_TOUR } from './knights-tour/nameLettering';
import { NAME_LETTERING as TIME_AUCTION } from './time-auction/nameLettering';
import { NAME_LETTERING as BALANCE_MANCALA } from './balance-mancala/nameLettering';

/**
 * 第二批五款在地名字的字標，依站內路徑查（產物在各款自己的 nameLettering.ts，scripts/build-name-lettering.mjs 產生）。
 * 平台先替每款放一個空的，各款的分支蓋掉自己那一個 —— 合併時不會撞（跟 blurbs.ts 同一個道理）。
 */
export const NAME_LETTERINGS: Partial<Record<string, NameLettering>> = {
  [routes.NINE_MENS_MORRIS]: NINE_MENS_MORRIS,
  [routes.BLIND_GOMOKU]: BLIND_GOMOKU,
  [routes.KNIGHTS_TOUR]: KNIGHTS_TOUR,
  [routes.TIME_AUCTION]: TIME_AUCTION,
  [routes.BALANCE_MANCALA]: BALANCE_MANCALA,
};
