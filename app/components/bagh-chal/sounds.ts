import { playSynth, type Synth } from '@/utils/sound';

/**
 * 虎羊棋的音效：塔布拉手鼓 —— 羊是高的「答」、老虎是低的「咚」（音往上揚，像手掌壓著鼓皮推上去）。
 * Zach 10/24 從試聽表 A–F 裡選了 E（第一版的銅鈴、手鼓、低吼與 A 木魚都換掉了）。全部當場合成，出處見 docs/sound.md。
 */
export type BaghSound = 'place' | 'goat' | 'tiger' | 'capture' | 'turn' | 'win' | 'lose';

/** 一聲鼓：正弦波從 f0 滑到 f1 給音高，再疊一下高頻雜音給手指拍到鼓皮的「啪」 */
function drum(s: Synth, at: number, f0: number, f1: number, dur: number, vol: number) {
  s.tone(at, f0, dur, vol, 'sine', f1);
  s.noise(at, 0.02, vol * 0.5, 'highpass', 2500, 0.7, 4);
}

export function playBagh(name: BaghSound) {
  playSynth((s) => {
    const { t } = s;
    switch (name) {
      case 'place': drum(s, t, 520, 500, 0.28, 0.3); s.tone(t, 1040, 0.12, 0.06); break;
      case 'goat': drum(s, t, 620, 600, 0.18, 0.2); break;
      case 'tiger': drum(s, t, 85, 125, 0.5, 0.55); break;
      case 'capture': // 老虎的低鼓壓在羊的高鼓上，再一下悶悶的拍擊
        drum(s, t, 80, 130, 0.55, 0.6);
        drum(s, t + 0.06, 520, 500, 0.3, 0.3);
        s.noise(t, 0.06, 0.6, 'bandpass', 400, 1.2, 2);
        break;
      case 'turn': drum(s, t, 520, 500, 0.22, 0.25); drum(s, t + 0.15, 600, 580, 0.25, 0.25); break;
      case 'win': // 四下往上的高鼓，收在一聲老虎的低鼓
        [0, 0.08, 0.16, 0.24].forEach((d, i) => drum(s, t + d, 520 + i * 40, 500 + i * 40, 0.2, 0.22));
        drum(s, t + 0.34, 80, 130, 0.7, 0.6);
        break;
      case 'lose': drum(s, t, 110, 90, 0.5, 0.5); drum(s, t + 0.25, 90, 70, 0.7, 0.5); break;
    }
  });
}
