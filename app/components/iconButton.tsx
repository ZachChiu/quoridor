'use client'
import React from 'react';
import SectionShadow from './sectionShadow';
import { ButtonHTMLAttributes } from 'react';

interface ChampionModalProps {
  children: React.ReactNode;
  type?: ButtonHTMLAttributes<HTMLButtonElement>['type'];
  color?: string;
  handleClickEvent: () => void;
}

const IconButton: React.FC<ChampionModalProps> = ({ type = 'button', handleClickEvent, children, color }) => {
  return (
    <SectionShadow roundedFull className='!size-auto'>
      <button
        type={type}
        className={`${color ? color : 'bg-white'} relative rounded-full border-4 border-gray-900 p-3 text-xl hover:-translate-x-0.5 hover:-translate-y-0.5 focus:translate-x-1 focus:translate-y-1`}
        onClick={handleClickEvent}
      >
        {children}
      </button>
    </SectionShadow>
    );
};

export default IconButton;
