import { playSynth, type Synth } from '@/utils/sound';

/**
 * 方程式金字塔的音效：彩陶磚與古埃及的豎琴、叉鈴（sistrum）。全部用 Web Audio 當場合成（playSynth），沒有音檔；開關跟全站共用。
 *
 * 配方：
 * - 點一格（tap）：彩陶磚互碰 —— 很短的 bandpass 雜音（3.2 kHz）＋一聲收得很快的 sine（1.6 kHz），比六角數字盤的瓷磚悶、低一點。
 * - 拿掉一格（untap）／清除（clear）：同一聲，音高往下。
 * - 公布目標數（target）：叉鈴搖一下（十幾聲很短的高頻雜音，3–8 kHz 之間抖）＋豎琴一個主音。
 * - 豎琴的一聲（harp）：弦上撥一下 —— 三角波＋高八度的 sine，起音快、尾巴長，沒有撥片聲（用手指撥的弓形豎琴）。
 * - 答對：豎琴往上兩個音（D 調五聲：D E G A C）；找完這一盤：整段往上滾。
 * - 答錯：手鼓（framedrum）悶的一聲＋低的 sine 往下滑。
 * - 電腦按鈴（cpu）：叉鈴搖兩下 —— 一聽就知道是另一邊答的。
 * - 最後 10 秒：每秒一聲很輕的磚碰磚。
 * - 回合結束：豎琴往下走；整局結束：五聲音階琶音＋低八度主音。
 */
export type EpSound = 'tap' | 'untap' | 'clear' | 'target' | 'correct' | 'wrong' | 'cpu' | 'cpuWrong' | 'tick' | 'reveal' | 'allFound' | 'over';

function harp(s: Synth, at: number, midi: number, vol = 1, len = 0.9) {
  const f = s.note(midi);
  s.tone(at, f, len, 0.14 * vol, 'triangle');
  s.tone(at, f * 2, len * 0.45, 0.035 * vol, 'sine');
  s.tone(at, f * 1.003, len * 0.8, 0.04 * vol, 'triangle');
}

function clink(s: Synth, at: number, vol = 1, pitch = 1600) {
  s.noise(at, 0.012, 0.16 * vol, 'bandpass', 3200, 1.6, 5);
  s.tone(at, pitch, 0.06, 0.04 * vol, 'sine');
}

function sistrum(s: Synth, at: number, vol = 1, shakes = 12) {
  for (let k = 0; k < shakes; k++) {
    const dt = k * 0.022 + (k % 2) * 0.006;
    s.noise(at + dt, 0.018, 0.07 * vol * (1 - k / (shakes + 2)), 'bandpass', 4200 + (k % 3) * 1500, 3, 4);
  }
}

// D 調五聲：D4 E4 G4 A4 C5 D5 E5 G5
const PENTA = [62, 64, 67, 69, 72, 74, 76, 79];

export function playEp(name: EpSound) {
  playSynth((s) => {
    const t = s.t;
    switch (name) {
      case 'tap': clink(s, t); break;
      case 'untap': clink(s, t, 0.7, 1250); break;
      case 'clear': clink(s, t, 0.6, 1400); clink(s, t + 0.05, 0.5, 1150); break;
      case 'tick': clink(s, t, 0.4, 1900); break;
      case 'target': sistrum(s, t, 0.9); harp(s, t + 0.05, 62, 0.8, 1.2); break;
      case 'correct': harp(s, t, 69); harp(s, t + 0.09, 74, 1, 1.1); break;
      case 'allFound': PENTA.slice(3).forEach((m, i) => harp(s, t + 0.22 + i * 0.07, m + 12, 0.75, i === 4 ? 1.3 : 0.4)); break;
      case 'wrong':
        s.tone(t, s.note(38), 0.28, 0.16, 'sine', s.note(33));
        s.noise(t, 0.14, 0.32, 'lowpass', 320, 0.8, 2);
        break;
      case 'cpu': sistrum(s, t, 1, 10); sistrum(s, t + 0.28, 0.8, 8); harp(s, t + 0.3, 67, 0.6, 0.6); break;
      case 'cpuWrong': sistrum(s, t, 0.8, 8); s.noise(t + 0.2, 0.12, 0.25, 'lowpass', 300, 0.8, 2); break;
      case 'reveal': [74, 72, 69, 67, 62].forEach((m, i) => harp(s, t + i * 0.12, m, 0.85, i === 4 ? 1.5 : 0.5)); break;
      case 'over':
        PENTA.forEach((m, i) => harp(s, t + i * 0.07, m, 0.85, i === PENTA.length - 1 ? 1.6 : 0.45));
        harp(s, t + PENTA.length * 0.07 + 0.1, 50, 0.8, 2);
        sistrum(s, t + PENTA.length * 0.07 + 0.1, 0.6);
        break;
    }
  });
}
