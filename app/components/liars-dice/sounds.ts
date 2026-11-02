import { playSynth, type Synth } from '@/utils/sound';

/**
 * 大話骰的音效：全部用 Web Audio 當場合成（utils/sound.ts 的 playSynth），沒有音檔；開關跟全站共用。
 *
 * 這款的世界是安地斯的羊毛織物與皮革骰盅，所以聲音都是「悶的木頭與骨」，不是賭場的塑膠：
 * - **搖骰盅**：十幾下高通的短雜音（骨骰撞皮盅內壁），間隔亂一點、越搖越密，最後一聲盅扣在桌上的低音。
 * - **骰子落桌**：一聲短的帶通雜音（1.8 kHz、喀）＋往下掉的低音，像骨頭碰木桌。
 * - **喊**：一聲輕的木魚（knock），喊得越大音越高。
 * - **開**：盅掀開的一口氣（低通雜音往上掃）＋幾顆骰子滾一下。
 * - **少一顆**：一顆骰子掉進碗裡（低音往下掉兩次）；**拿回一顆**反過來往上。
 * - **贏**：排笛（quena）的五聲上行，正弦帶一點氣聲；**輸**：下行。
 */

function rattle(s: Synth, at: number, vol: number) {
  s.noise(at, 0.025, vol, 'highpass', 2400 + Math.random() * 1600, 1.2, 4);
}

export function playShake() {
  playSynth((s) => {
    let t = s.t;
    for (let i = 0; i < 14; i++) {
      rattle(s, t, 0.22 + Math.random() * 0.12);
      t += 0.055 - i * 0.002 + Math.random() * 0.02;
    }
    s.noise(t + 0.04, 0.09, 0.5, 'lowpass', 300, 0.8, 2.5);
    s.tone(t + 0.04, 110, 0.14, 0.32, 'sine', 70);
  });
}

function clack(s: Synth, at: number, vol: number) {
  s.noise(at, 0.03, vol, 'bandpass', 1800, 3, 4);
  s.tone(at, 240, 0.06, vol * 0.3, 'sine', 150);
}

export function playLand(n = 5) {
  playSynth((s) => {
    for (let i = 0; i < n; i++) clack(s, s.t + i * 0.045 + Math.random() * 0.02, 0.35);
  });
}

/** 喊：count 越大音越高（中央 C 往上最多一個八度） */
export function playBid(count: number) {
  playSynth((s) => {
    const f = s.note(60 + Math.min(12, count));
    s.knock(s.t, f * 2, 0.06, 0.8);
    s.tone(s.t, f, 0.12, 0.2, 'triangle');
  });
}

export function playReveal() {
  playSynth((s) => {
    s.noise(s.t, 0.28, 0.4, 'lowpass', 900, 0.7, 1.5);
    for (let i = 0; i < 6; i++) clack(s, s.t + 0.2 + i * 0.05, 0.25);
  });
}

export function playLose() {
  playSynth((s) => {
    s.tone(s.t, 196, 0.18, 0.35, 'sine', 120);
    s.tone(s.t + 0.16, 160, 0.26, 0.3, 'sine', 90);
  });
}

export function playGain() {
  playSynth((s) => {
    s.tone(s.t, 160, 0.14, 0.3, 'sine', 230);
    s.tone(s.t + 0.13, 230, 0.2, 0.3, 'sine', 330);
  });
}

/** 排笛：正弦＋一點氣聲 */
function quena(s: Synth, at: number, midi: number, dur: number, vol: number) {
  const f = s.note(midi);
  s.tone(at, f, dur, vol, 'sine');
  s.noise(at, dur * 0.6, vol * 0.25, 'bandpass', f * 2, 2, 2);
}

export function playEnd(win: boolean) {
  playSynth((s) => {
    const seq = win ? [69, 72, 74, 76, 81] : [76, 74, 72, 69];
    seq.forEach((n, i) => quena(s, s.t + i * 0.16, n, i === seq.length - 1 ? 0.9 : 0.22, 0.28));
  });
}
