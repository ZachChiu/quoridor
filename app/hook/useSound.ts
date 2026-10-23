'use client';

import { useEffect, useSyncExternalStore } from 'react';
import {
  armAudio, getServerSoundPrefs, getSoundPrefs, setSoundPrefs, startMusic, stopMusic, subscribeSoundPrefs,
} from '@/utils/sound';

/**
 * 音效／音樂的開關（見 utils/sound.ts）。掛著它的頁面才會放音樂，離開就停。
 * musicOn：這一頁現在適合放音樂嗎（例如對局中）—— 偏好是開的也要這裡是 true 才放。
 */
export function useSound(musicOn = true) {
  const prefs = useSyncExternalStore(subscribeSoundPrefs, getSoundPrefs, getServerSoundPrefs);

  useEffect(() => { armAudio(); }, []);

  useEffect(() => {
    if (prefs.music && musicOn) startMusic();
    else stopMusic();
    return () => stopMusic();
  }, [prefs.music, musicOn]);

  return { prefs, setPrefs: setSoundPrefs };
}
