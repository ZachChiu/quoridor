import type React from 'react';
import type { Locale } from '@/i18n/locales';
import type { LocalLettering, NameLettering } from '@/types/lettering';

/** 這個語系有字標、而且寫的就是這幾個字才用（改了譯名還沒重新產生時退回一般文字） */
export function letteringOf(data: NameLettering | undefined, locale: Locale, text: string): LocalLettering | undefined {
  const l = data?.[locale];
  return l?.text === text ? l : undefined;
}

/**
 * 遊戲名的字標（各語系用那款自己的字，見 types/lettering.ts）：一段一張單色 SVG 當遮罩、塗上文字色。
 * 平台卡片、大卡片、各款首頁的標題共用。
 *
 * 段排成會換行的一列：放得下就排在同一行，放不下才在切好的地方換行（不會斷在字中間）；
 * 單獨一段還是太寬就整段縮小（寬度最多到整行，高度由 aspect-ratio 跟著）。
 * 本身佔滿整行，對齊由外面給（className 帶 justify-center 之類）。
 * 只是畫出來的字，螢幕報讀要另外放一份 sr-only 的名字。
 */
export default function LocalName({ data, className = '' }: { data: LocalLettering; className?: string }) {
  return (
    <span aria-hidden="true" className={`flex w-full flex-wrap items-end ${className}`} style={{ columnGap: `${data.gap}em`, rowGap: `${data.lead}em` }}>
      {data.pieces.map((p) => {
        const mask = `url(${p.src}) center / contain no-repeat`;
        const style: React.CSSProperties = {
          WebkitMask: mask, mask, aspectRatio: `${p.w} / ${data.h}`, width: `min(100%, ${p.w}em)`,
          marginLeft: p.ml && `${p.ml}em`, marginRight: p.mr && `${p.mr}em`,
        };
        return <span key={p.src} className="block shrink-0 bg-current" style={style} />;
      })}
    </span>
  );
}
