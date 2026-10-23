import { playSynth, type Synth } from '@/utils/sound';

/**
 * 虎羊棋的音效：木魚 —— 有音高的木頭聲，羊高、老虎低（試聽表的 A，Zach 還沒選定前先用這套）。
 * 第一版是銅鈴、手鼓、低吼，Zach 10/24：「你這新音效不喜歡」。全部當場合成，出處見 docs/sound.md。
 */
export type BaghSound = 'place' | 'goat' | 'tiger' | 'capture' | 'turn' | 'win' | 'lose';

/** 一聲木魚：窄頻帶的雜音給「敲」的質感，再疊一點同音高的正弦波與泛音給「音高」 */
function wood(s: Synth, at: number, f: number, vol: number) {
  s.noise(at, 0.045, vol * 3, 'bandpass', f, 12, 2);
  s.tone(at, f, 0.06, vol * 0.22);
  s.tone(at, f * 2.6, 0.025, vol * 0.06);
}

export function playBagh(name: BaghSound) {
  playSynth((s) => {
    const { t } = s;
    switch (name) {
      case 'place': wood(s, t, 1200, 1); break;
      case 'goat': wood(s, t, 1500, 0.7); break;
      case 'tiger': wood(s, t, 560, 1.1); break;
      case 'capture': // 老虎落下、再一聲更低的，加一點三角波的「咚」
        wood(s, t, 560, 1.1);
        wood(s, t + 0.08, 400, 1.2);
        s.tone(t + 0.08, 105, 0.28, 0.35, 'triangle');
        break;
      case 'turn': wood(s, t, 1500, 0.8); wood(s, t + 0.14, 2000, 0.8); break;
      case 'win': [880, 1100, 1320, 1760].forEach((f, i) => wood(s, t + i * 0.1, f, 0.8)); break;
      case 'lose': [880, 660, 440].forEach((f, i) => wood(s, t + i * 0.18, f, 0.7)); break;
    }
  });
}
