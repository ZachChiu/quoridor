import { playSynth, type Synth } from '@/utils/sound';

/**
 * 提問與真相的音效：全部用 Web Audio 當場合成（utils/sound.ts 的 playSynth），沒有音檔；開關跟全站共用。
 *
 * 這款的世界是〈方塊 A 的老千〉那張燭光下的牌桌：紙牌、金幣、絲絨桌布、一只玻璃杯。
 * - **放一張牌**：短促的紙擦過布（帶通雜音，3 kHz、很快收掉）。
 * - **交代幣**：金幣落在桌布上 —— 兩個不協和的高泛音（金屬）＋一點悶的碰撞，交越多枚響越多下。
 * - **得標**：指甲輕敲玻璃杯（高的正弦帶一點泛音、長尾音）。
 * - **提問**：翻一張牌（雜音往上掃）；**回答**：一聲木桌上的輕敲。
 * - **說中**：魯特琴的上行分解和弦（三角波撥弦、快速衰減）；**說錯**：低音的悶響往下滑。
 */

function paper(s: Synth, at: number, vol: number) {
  s.noise(at, 0.06, vol, 'bandpass', 2800 + Math.random() * 800, 1.4, 6);
}

export function playPlace() {
  playSynth((s) => paper(s, s.t, 0.28));
}

function coin(s: Synth, at: number, vol: number) {
  const f = 2400 + Math.random() * 300;
  s.tone(at, f, 0.18, vol * 0.35, 'sine');
  s.tone(at, f * 1.47, 0.12, vol * 0.2, 'sine');
  s.noise(at, 0.02, vol * 0.6, 'bandpass', 5200, 3, 8);
}

/** 交 n 枚代幣：一枚一聲，最多響 6 下（0 枚就只有手放下來那一聲布） */
export function playBid(n: number) {
  playSynth((s) => {
    if (n === 0) { s.noise(s.t, 0.08, 0.18, 'lowpass', 700, 0.8, 3); return; }
    for (let i = 0; i < Math.min(n, 6); i++) coin(s, s.t + i * 0.07 + Math.random() * 0.02, 0.5);
  });
}

export function playWonBid() {
  playSynth((s) => {
    s.tone(s.t, 1760, 0.9, 0.16, 'sine');
    s.tone(s.t, 2640, 0.5, 0.06, 'sine');
  });
}

export function playAsk() {
  playSynth((s) => {
    s.noise(s.t, 0.12, 0.3, 'bandpass', 1500, 0.9, 2.5);
    paper(s, s.t + 0.1, 0.22);
  });
}

export function playAnswer() {
  playSynth((s) => s.knock(s.t, 520, 0.05, 0.7));
}

function lute(s: Synth, at: number, midi: number, vol: number) {
  const f = s.note(midi);
  s.tone(at, f, 0.7, vol, 'triangle');
  s.tone(at, f * 2, 0.25, vol * 0.25, 'sine');
}

export function playRight() {
  playSynth((s) => [62, 66, 69, 74, 78].forEach((n, i) => lute(s, s.t + i * 0.11, n, 0.22)));
}

export function playWrong() {
  playSynth((s) => {
    s.tone(s.t, 150, 0.35, 0.35, 'sine', 90);
    s.noise(s.t, 0.12, 0.2, 'lowpass', 400, 0.8, 2);
  });
}

export function playLose() {
  playSynth((s) => [74, 70, 67, 62].forEach((n, i) => lute(s, s.t + i * 0.16, n, 0.2)));
}
