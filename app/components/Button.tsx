'use client'
import React from 'react';
import SectionShadow from './SectionShadow';
import { ButtonHTMLAttributes } from 'react';

interface ChampionModalProps {
  children: React.ReactNode;
  roundedFull?: boolean,
  type?: ButtonHTMLAttributes<HTMLButtonElement>['type'];
  color?: string;
  handleClickEvent?: () => void;
}

const Button: React.FC<ChampionModalProps> = ({ type = 'button', handleClickEvent, roundedFull = false, children, color }) => {
  return (
    <SectionShadow className='group cursor-pointer' roundedFull={roundedFull} handleClickEvent={handleClickEvent}>
      <button
        type={type}
        className={`${color ? color : 'bg-white'} ${roundedFull ? 'rounded-full' : 'rounded-xl'} relative w-full border-4 border-gray-900 p-3 text-sm group-hover:-translate-x-0.5 group-hover:-translate-y-0.5 group-active:translate-x-1 group-active:translate-y-1 lg:p-4 lg:text-xl`}
      >
        {children}
      </button>
    </SectionShadow>
    );
};

export default Button;
