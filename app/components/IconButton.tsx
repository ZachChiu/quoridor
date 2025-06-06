'use client'
import React from 'react';
import SectionShadow from './SectionShadow';
import { ButtonHTMLAttributes } from 'react';

interface ChampionModalProps {
  children: React.ReactNode;
  type?: ButtonHTMLAttributes<HTMLButtonElement>['type'];
  color?: string;
  handleClickEvent?: () => void;
}

const IconButton: React.FC<ChampionModalProps> = ({ type = 'button', handleClickEvent, children, color }) => {
  return (
    <SectionShadow roundedFull className='!size-auto' handleClickEvent={handleClickEvent}>
      <button
        type={type}
        className={`${color ? color : 'bg-white'} relative rounded-full border-4 border-gray-900 p-3 text-xl group-hover:-translate-x-0.5 group-hover:-translate-y-0.5 group-active:translate-x-1 group-active:translate-y-1`}
      >
        {children}
      </button>
    </SectionShadow>
    );
};

export default IconButton;
