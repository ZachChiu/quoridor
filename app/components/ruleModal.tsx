'use client'
import React from 'react';
import SectionShadow from './sectionShadow';
import Button from './button';
import IconButton from './iconButton';
import { MdClose, MdRule, MdEmojiEvents, MdGavel, MdTouchApp, MdMilitaryTech, MdArrowRight, MdPlayArrow, MdMovie, MdInfo, MdStarRate } from "react-icons/md";

interface ChampionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const RuleModal: React.FC<ChampionModalProps> = ({ isOpen, onClose }) => {
  return (
    <div className={`fixed inset-0 z-50 flex w-full  items-center justify-center px-4 ${isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'} transition-opacity duration-300`}>
      <div className="fixed inset-0 bg-black/50" onClick={onClose}></div>
      <div className='max-w-md'>
        <SectionShadow>
          <div className={`relative w-full rounded-xl border-2 border-gray-900 bg-tertiary p-6 font-[family-name:var(--font-geist-sans)]`}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-2xl font-bold"><MdRule className="text-2xl" /> 遊玩方式</h2>
              <IconButton
                handleClickEvent={onClose}
              >
                <MdClose />
              </IconButton>
            </div>
            <div className='content scrollbar-hide mb-6 max-h-[45dvh] space-y-4 overflow-y-auto pr-2 lg:max-h-[60dvh]'>
              <style jsx>{`
                .content::-webkit-scrollbar {
                  display: none;
                }
              `}</style>
              <div>
                <h3 className="mb-2 flex items-center gap-2 text-xl font-bold"><MdMovie className="text-xl text-red-500" />《魔鬼的計謀2》中的智力對決</h3>
                <p className="text-sm leading-relaxed">
                  圍牆圍棋是一款源自法國的策略棋盤遊戲，在 Netflix 熱門影集《魔鬼的計謀2》中被巧妙地融入劇情。劇中主角們透過這種智力對決展現了精湛的戰略思維與計謀能力，正如他們在現實生活中的心理博弈般扣人心弦。
                </p>
              </div>

              <div>
                <h3 className="mb-2 flex items-center gap-2 text-xl font-bold"><MdInfo className="text-xl text-blue-500" /> 遊戲背景</h3>
                <p className="text-sm leading-relaxed">
                  在《魔鬼的計謀2》中，圍牆圍棋成為角色間智力較量的完美象徵，展現了如何透過策略性地設置障礙與路徑規劃來達成目標，這與劇中人物之間錯綜複雜的心理戰不謀而合。
                </p>
              </div>

              <div>
                <h3 className="mb-2 flex items-center gap-2 text-xl font-bold"><MdGavel className="text-xl text-amber-500" /> 基本規則</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2"><MdArrowRight className="mt-0.5 shrink-0 text-lg text-amber-500" /> 遊戲在一個 7×7 的棋盤上進行</li>
                  <li className="flex items-start gap-2"><MdArrowRight className="mt-0.5 shrink-0 text-lg text-amber-500" /> 遊戲開始時，雙方各有兩顆固定位置的棋子已放置在棋盤上</li>
                  <li className="flex items-start gap-2"><MdArrowRight className="mt-0.5 shrink-0 text-lg text-amber-500" /> 接著依序進行佈局：紅方先放置一顆棋子，藍方放置兩顆，紅方再放置一顆，然後紅方開始進攻，接著藍方進攻，依此類推</li>
                  <li className="flex items-start gap-2"><MdArrowRight className="mt-0.5 shrink-0 text-lg text-amber-500" /> 遊戲目標是圍住最多的領地區域</li>
                </ul>
              </div>

              <div>
                <h3 className="mb-2 flex items-center gap-2 text-xl font-bold"><MdTouchApp className="text-xl text-green-500" />操作規則</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2"><MdArrowRight className="mt-0.5 shrink-0 text-lg text-green-500" /> <div className="flex-1"><strong>棋子移動</strong>：每回合可將棋子向上、下、左、右任一方向移動最多兩格</div></li>
                  <li className="flex items-start gap-2"><MdArrowRight className="mt-0.5 shrink-0 text-lg text-green-500" /> <div className="flex-1"><strong>圍牆設置</strong>：圍牆只能設置在尚未有圍牆的格子之間</div></li>
                </ul>
              </div>

              <div>
                <h3 className="mb-2 flex items-center gap-2 text-xl font-bold"><MdStarRate className="text-xl text-purple-500" /> 圍牆規則</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2"><MdArrowRight className="mt-0.5 shrink-0 text-lg text-purple-500" /> 圍牆放置在格子之間，可阻擋棋子移動</li>
                  <li className="flex items-start gap-2"><MdArrowRight className="mt-0.5 shrink-0 text-lg text-purple-500" /> 圍牆不分敵友，可用來圍住己方領地</li>
                  <li className="flex items-start gap-2"><MdArrowRight className="mt-0.5 shrink-0 text-lg text-purple-500" /> 只有完全封閉的區域且區域內僅有一方陣營的棋子，才算作該方佔領的領地</li>
                  <li className="flex items-start gap-2"><MdArrowRight className="mt-0.5 shrink-0 text-lg text-purple-500" /> 棋盤邊界也視為圍牆的一部分</li>
                </ul>
              </div>

              <div>
                <h3 className="mb-2 flex items-center gap-2 text-xl font-bold"><MdMilitaryTech className="text-xl text-yellow-500" /> 勝利條件</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2"><MdArrowRight className="mt-0.5 shrink-0 text-lg text-yellow-500" /> 當所有可能的領地都已形成，且每個領地內只有單一陣營的棋子</li>
                  <li className="flex items-start gap-2"><MdArrowRight className="mt-0.5 shrink-0 text-lg text-yellow-500" /> 佔領領地數量最多的一方獲勝</li>
                </ul>
              </div>

              <div>
                <h3 className="mb-2 flex items-center gap-2 text-xl font-bold"><MdEmojiEvents className="text-xl text-orange-500" /> 策略要點</h3>
                <p className="mb-2 text-sm leading-relaxed">
                  如同《魔鬼的計謀2》中角色們精心設計的計謀，圍牆圍棋要求玩家：
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2"><MdArrowRight className="mt-0.5 shrink-0 text-lg text-orange-500" /> 巧妙平衡進攻與防守策略</li>
                  <li className="flex items-start gap-2"><MdArrowRight className="mt-0.5 shrink-0 text-lg text-orange-500" /> 預測並應對對手的戰術動向</li>
                  <li className="flex items-start gap-2"><MdArrowRight className="mt-0.5 shrink-0 text-lg text-orange-500" /> 策略性地放置圍牆以限制對手的活動範圍</li>
                  <li className="flex items-start gap-2"><MdArrowRight className="mt-0.5 shrink-0 text-lg text-orange-500" /> 靈活佈局，最大化己方佔領的領地</li>
                </ul>
              </div>
            </div>

            <div className="flex justify-center gap-4">
              <Button
                color='bg-tertiary-400'
                handleClickEvent={onClose}
              >
                <span className="flex items-center gap-2"><MdPlayArrow /> 回到遊戲</span>
              </Button>
            </div>
          </div>
        </SectionShadow>
      </div>
    </div>
  );
};

export default RuleModal;
