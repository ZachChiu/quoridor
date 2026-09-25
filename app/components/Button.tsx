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
        className={`${color ?? 'bg-tile-ink text-tile-cream'} ${roundedFull ? 'rounded-full' : 'rounded-2xl'} relative w-full p-4 text-base font-black tracking-wide transition group-hover:brightness-95 group-active:scale-[0.985] lg:p-5 lg:text-2xl`}
      >
        {children}
      </button>
    </SectionShadow>
    );
};

export default Button;
