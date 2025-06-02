'use client'
import React from 'react';
import SectionShadow from './sectionShadow';
import { ButtonHTMLAttributes } from 'react';

interface ChampionModalProps {
  children: React.ReactNode;
  roundedFull?: boolean,
  type?: ButtonHTMLAttributes<HTMLButtonElement>['type'];
  color?: string;
  handleClickEvent: () => void;
}

const Button: React.FC<ChampionModalProps> = ({ type = 'button', handleClickEvent, roundedFull = false, children, color }) => {
  return (
    <SectionShadow roundedFull={roundedFull}>
      <button
        type={type}
        className={`${color ? color : 'bg-white'} ${roundedFull ? 'rounded-full' : 'rounded-xl'} relative w-full border-4 border-gray-900 p-4 text-xl hover:-translate-x-0.5 hover:-translate-y-0.5 focus:translate-x-1 focus:translate-y-1`}
        onClick={handleClickEvent}
      >
        {children}
      </button>
    </SectionShadow>
    );
};

export default Button;
