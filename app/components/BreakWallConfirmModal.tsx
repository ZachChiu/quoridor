"use client"
import React from 'react';
import { GiCancel, GiHazardSign, GiPauseButton, GiPlayButton } from "react-icons/gi";
import SectionShadow from './SectionShadow';
import Button from './Button';
import IconButton from './IconButton';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCheck: () => void;
}

const BreakWallConfirmModal: React.FC<Props> = ({ isOpen, onClose, onCheck }) => {

  return (
    <div className={`fixed inset-0 z-50 flex w-full  items-center justify-center px-4 ${isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'} transition-opacity duration-300`}>
      <div className="fixed inset-0 bg-black/50" onClick={() => onClose()}></div>
      <div className='min-w-80 max-w-md'>
        <SectionShadow >
          <div className={`relative w-full rounded-xl bg-primary p-6 font-[family-name:var(--font-app)]`}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-2xl font-bold"><GiHazardSign className="text-2xl" />破牆確認</h2>
              <IconButton handleClickEvent={onClose} label="關閉">
                <GiCancel />
              </IconButton>
            </div>
            <div className='scrollbar-hide mb-6 max-h-[45dvh] space-y-4 overflow-y-auto pr-2 lg:max-h-[60dvh]'>
              <div>
                <p className="text-lg leading-relaxed">
                  打破這面牆將可繼續移動
                  <br />
                  但您的破牆機會將歸零
                </p>
              </div>

            </div>

            <div className='flex gap-4'>
              <Button
                color='text-ink-soft hover:bg-tile-ink/[0.06] bg-transparent'
                handleClickEvent={() => onClose()}
              >
                <span className="flex items-center justify-center gap-2"><GiPauseButton />取消</span>
              </Button>
              <Button
                color='bg-tile-red text-tile-cream'
                handleClickEvent={() => onCheck()}
              >
                <span className="flex items-center justify-center gap-2"><GiPlayButton />確認</span>
              </Button>
            </div>
          </div>
        </SectionShadow>
      </div>
    </div>
  );
};

export default BreakWallConfirmModal;
