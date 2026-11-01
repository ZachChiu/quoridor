import { useId } from 'react';
import { KNIGHT_ART } from './knightArt';

/** 照 knightArt.ts 的圖層畫成 SVG（結算分享圖用同一份圖層畫在 Canvas 上）。對局的棋盤、首頁練習模式那顆按鈕共用 */
export default function KnightSvg({ className }: { className?: string }) {
  const id = `kt-knight-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  return (
    <svg aria-hidden="true" viewBox="0 0 100 100" overflow="visible" className={className}>
      <defs>
        {KNIGHT_ART.flatMap((layer, i) => (layer.clip ?? []).map((d, j) => (
          <clipPath key={`${i}-${j}`} id={`${id}-${i}-${j}`}><path d={d} /></clipPath>
        )))}
      </defs>
      {KNIGHT_ART.map((layer, i) => {
        let el = (
          <path d={layer.d} fill={layer.fill ?? 'none'} stroke={layer.stroke} strokeWidth={layer.width} opacity={layer.opacity}
            strokeLinecap="round" strokeLinejoin="round" />
        );
        (layer.clip ?? []).forEach((_, j) => { el = <g clipPath={`url(#${id}-${i}-${j})`}>{el}</g>; });
        return <g key={i}>{el}</g>;
      })}
    </svg>
  );
}
