import { MiniBoard } from './BaghBoard';
import { MotifStrip } from './BaghFrame';
import BaghWordmark from './BaghWordmark';

/** 封面上那盤棋：四角老虎、中間一圈羊（放羊階段的樣子） */
const ROWS = ['T...T', '..G..', '.G.G.', '..G..', 'T...T'];

/**
 * 平台卡片上的虎羊棋封面（PlatformView 的 GameCard）。版型照設計總表裡平台頁的虎羊棋卡片：
 * 上緣一條老虎追羊的飾帶、右邊斜擺一張棋盤、左下天城體字標加名字。
 *
 * 每一樣都是遊戲裡真的零件 —— 同一個泰奶底、同一條摳圖飾帶、同一張奶油紙棋盤與米提拉圓牌（MiniBoard），
 * 從卡片開門進去看到的就是同一個世界。先前是另一張 AI 插畫（key-art.webp）：棋子是立體的虎羊小雕像、
 * 格線每一格都有斜線（不是虎羊棋的棋盤），跟遊戲越來越不像（2026-10-21 Zach）。
 */
export default function BaghCover({ name }: { name: string }) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden bg-bagh-field">
      <div className="absolute right-[-46px] top-[26px] w-[150px] -rotate-12">
        <MiniBoard rows={ROWS} />
      </div>
      <div className="absolute inset-x-0 top-0 h-[26px] border-b-2 border-[#736922] bg-[#eaa42c]">
        <MotifStrip size="24px" />
      </div>
      <div className="absolute bottom-2.5 left-3 flex flex-col items-start gap-1">
        <BaghWordmark className="h-[15px] w-auto" />
        <span className="text-[22px] font-black leading-none text-tile-ink">{name}</span>
      </div>
    </div>
  );
}
