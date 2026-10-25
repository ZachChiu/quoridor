import { playSynth, type Synth } from '@/utils/sound';

/**
 * 九子棋的音效：骨製的棋子碰木頭棋盤，連成一線時撥一下中世紀的索特里琴（psaltery，撥弦的扁琴）。
 * 全部當場合成（utils/sound.ts 的 playSynth），沒有音檔。跟 Wall Go（木頭敲擊）、虎羊棋（有音高的木魚）刻意分開：
 *
 * - 骨頭碰木頭：很短、偏高的「喀」（窄頻帶的高頻雜音）＋一點點低的「篤」（棋盤共鳴）
 * - 走子：先一聲在木頭上滑的沙沙聲，再落下
 * - 飛子：短的風聲＋落下
 * - 連成一線：撥弦琴的三個音，D 多利安調式（D、A、D，空五度 —— 中世紀音樂最常見的骨架）
 * - 拿子：被拿掉的子先「喀」一聲被碰倒，掉在木頭上「咚」，再滾一下（減少動態效果、沒有手的時候）
 * - 手來拿子（MorrisBoard 的手，跟著手的動作響）：捏起來時指尖碰到骨頭一聲輕「嗒」、離開木頭一點擦聲；
 *   放倒在下方時輕輕「喀」一聲、滾半下
 * - 贏：D–F–A–D 往上撥；輸：A–F–E–D 慢慢往下
 * - 連線時輪到你：輕輕撥兩下 A–D（分頁在背景也聽得到）
 *
 * 撥弦＝三角波快起音、指數衰減，加一個高八度的正弦泛音，像弦被指甲撥到。
 */
export type MorrisSound = 'place' | 'move' | 'fly' | 'select' | 'mill' | 'remove' | 'pluck' | 'lay' | 'turn' | 'win' | 'lose' | 'draw';

/** 骨頭碰木頭 */
function clack(s: Synth, at: number, vol = 1) {
  s.noise(at, 0.028, vol * 2.2, 'bandpass', 2700, 5, 4);
  s.noise(at, 0.06, vol * 0.9, 'lowpass', 420, 1, 3);
  s.tone(at, 1900, 0.025, vol * 0.04);
}

/** 撥一根弦 */
function pluck(s: Synth, at: number, midi: number, vol = 1, dur = 0.9) {
  const f = s.note(midi);
  s.tone(at, f, dur, vol * 0.16, 'triangle');
  s.tone(at, f * 2, dur * 0.45, vol * 0.05);
  s.noise(at, 0.012, vol * 0.25, 'highpass', 3500, 1, 2);
}

export function playMorris(name: MorrisSound) {
  playSynth((s) => {
    const { t } = s;
    switch (name) {
      case 'place': clack(s, t); break;
      case 'select': s.noise(t, 0.02, 0.5, 'bandpass', 3200, 6, 4); break;
      case 'move':
        s.noise(t, 0.16, 0.35, 'bandpass', 900, 0.8, 1);
        clack(s, t + 0.15);
        break;
      case 'fly':
        s.noise(t, 0.22, 0.4, 'bandpass', 1500, 0.7, 0.6);
        clack(s, t + 0.2);
        break;
      case 'mill': [62, 69, 74].forEach((n, i) => pluck(s, t + 0.08 + i * 0.08, n, 1, 1.1)); break;
      case 'remove':
        clack(s, t, 0.9);
        s.noise(t + 0.13, 0.09, 0.9, 'bandpass', 650, 3, 3);
        clack(s, t + 0.24, 0.35);
        clack(s, t + 0.31, 0.2);
        break;
      case 'pluck':
        s.noise(t, 0.018, 0.55, 'bandpass', 3600, 6, 4);
        s.noise(t + 0.03, 0.09, 0.22, 'bandpass', 1100, 1.2, 1.5);
        break;
      case 'lay':
        clack(s, t, 0.6);
        s.noise(t + 0.02, 0.07, 0.45, 'lowpass', 520, 1, 3);
        clack(s, t + 0.11, 0.18);
        break;
      case 'turn': [69, 74].forEach((n, i) => pluck(s, t + i * 0.12, n, 0.7, 0.7)); break;
      case 'win': [62, 65, 69, 74].forEach((n, i) => pluck(s, t + i * 0.13, n, 1, i === 3 ? 1.6 : 0.8)); break;
      case 'lose': [69, 65, 64, 62].forEach((n, i) => pluck(s, t + i * 0.22, n, 0.8, i === 3 ? 1.4 : 0.8)); break;
      case 'draw': [62, 69].forEach((n, i) => pluck(s, t + i * 0.2, n, 0.8, 1.2)); break;
    }
  });
}
