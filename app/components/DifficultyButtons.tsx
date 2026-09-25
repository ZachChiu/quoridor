'use client';
import React from 'react';
import type { Difficulty } from '@/game/ai';
import { useMessages } from '@/i18n/LocaleProvider';

/**
 * 三個難度鈕，首頁的難度 Modal 與 /solo 頁共用同一份。
 *
 * 原本兩邊各寫一套：/solo 是三張並排的中性卡片配點數，首頁 Modal 卻是
 * 三條直排的白色長條。同一個選擇長兩種樣子，Zach 要首頁跟著 /solo 走。
 *
 * 三個難度原本各一個色相（森綠、琥珀、磚紅），並排起來配色過雜。
 * 改成同一種中性卡片，強度用陶橘的點數表示 —— 陶橘是單人對戰這塊磁磚的顏色，
 * 整個畫面只有它一個色相。點數也比顏色好懂：一顆到三顆，不必猜綠色代表什麼。
 *
 * 用「級」而不是簡單／普通／困難：這是圍棋衍生的遊戲，數字級距比形容詞中性。
 * 不附說明文字 —— 真正的差別打一局就知道。
 */
export const LEVELS: Difficulty[] = ['easy', 'normal', 'hard'];

interface Props {
  /** 第二個參數是按鈕中心 —— 首頁的轉場要從那裡擴散出去 */
  onPick: (difficulty: Difficulty, at: { x: number; y: number }) => void;
}

export default function DifficultyButtons({ onPick }: Props) {
  const t = useMessages();
  const labels = [t.solo.level1, t.solo.level2, t.solo.level3];
  return (
    <div className="grid w-full grid-cols-3 gap-3">
      {LEVELS.map((key, i) => (
        <button
          key={key}
          type="button"
          onClick={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            onPick(key, { x: r.left + r.width / 2, y: r.top + r.height / 2 });
          }}
          className="flex flex-col items-center gap-3 rounded-2xl bg-tile-ink/[0.07] py-5 text-xl font-black text-tile-ink transition hover:bg-tile-ink/[0.12] active:scale-[0.97]"
        >
          <span className="flex gap-1.5" aria-hidden="true">
            {LEVELS.map((_, dot) => (
              <span key={dot} className={`size-2.5 rounded-full ${dot <= i ? 'bg-tile-orange' : 'bg-tile-ink/15'}`} />
            ))}
          </span>
          {labels[i]}
        </button>
      ))}
    </div>
  );
}
