'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { armAudio, getServerSoundPrefs, getSoundPrefs, setSoundPrefs, subscribeSoundPrefs } from '@/utils/sound';

/** 音效開關（見 utils/sound.ts）。掛著它的頁面才會在第一次點擊時把聲音解鎖 */
export function useSound() {
  const prefs = useSyncExternalStore(subscribeSoundPrefs, getSoundPrefs, getServerSoundPrefs);

  useEffect(() => { armAudio(); }, []);

  return { prefs, setPrefs: setSoundPrefs };
}
