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
  disabled?: boolean;
}

const Button: React.FC<ChampionModalProps> = ({ type = 'button', handleClickEvent, roundedFull = false, children, color, disabled }) => {
  return (
    <SectionShadow className={`group ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`} roundedFull={roundedFull} handleClickEvent={handleClickEvent} disabled={disabled}>
      <button
        type={type}
        disabled={disabled}
        className={`${color ? color : 'bg-white'} ${roundedFull ? 'rounded-full' : 'rounded-xl'} relative w-full border-4 border-gray-900 p-3 text-sm group-hover:-translate-x-0.5 group-hover:-translate-y-0.5 group-active:translate-x-1 group-active:translate-y-1 lg:p-4 lg:text-xl`}
      >
        {children}
      </button>
    </SectionShadow>
    );
};

export default Button;
