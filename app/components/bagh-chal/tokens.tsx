import type { IconBaseProps, IconType } from 'react-icons';

/**
 * 虎、羊的棋子圖（AI 畫的米提拉彩繪圓牌，public/games/bagh-chal/tiger.webp、goat.webp）。
 *
 * 包成跟 react-icons 一樣的元件（IconType），Modal 的標題圖示、轉場這些只收圖示元件的地方
 * 就能直接用同一張圖，不必另外畫一套剪影。外層是 svg、寬高 1em，大小跟著 font-size 走。
 */
function token(src: string): IconType {
  function Token({ size, className, style, ...rest }: IconBaseProps) {
    return (
      <svg viewBox="0 0 100 100" width={size ?? '1em'} height={size ?? '1em'} className={className} style={style} aria-hidden="true" {...rest}>
        <image href={src} width="100" height="100" />
      </svg>
    );
  }
  return Token;
}

export const TIGER_SRC = '/games/bagh-chal/tiger.webp';
export const GOAT_SRC = '/games/bagh-chal/goat.webp';
export const TigerToken = token(TIGER_SRC);
export const GoatToken = token(GOAT_SRC);
