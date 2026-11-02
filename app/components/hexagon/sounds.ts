import { playSynth, type Synth } from '@/utils/sound';

/**
 * 六角數字盤的音效：釉面磁磚與烏德琴（磁磚是 15 世紀大馬士革、伊茲尼克的，聲音找同一個地方）。
 * 全部用 Web Audio 當場合成（playSynth），沒有音檔；開關跟全站共用。
 *
 * 配方：
 * - 點一格（tap）：硬的釉面碰一下 —— 很短的高頻雜音（highpass 5 kHz、10 ms）＋一聲很快收掉的高音 sine（2.4 kHz），像指甲敲瓷。
 *   不是 Wall Go 的木頭「篤」，也不是騎士巡遊的大鍵琴。
 * - 翻面（flip）：19 塊磁磚照翻的順序一塊一塊喀過去（每塊一聲 bandpass 雜音、音高輕輕往上走），跟盤面的翻轉波浪同一個節奏。
 * - 烏德琴的一聲（pluck）：撥片的雜音（bandpass 2.5 kHz）＋三角波基音（收得比大鍵琴快、沒有延音）＋鋸齒波的亮音＋微微走音的第二條弦（烏德是雙弦）。
 * - 答對：D 調希賈茲音階（D E♭ F♯ G A）往上兩個音 A–D；找完這回合：整段往上滾。
 * - 答錯：悶住的低音＋一聲鈍的「咚」（lowpass），像手掌按住鼓面。
 * - 回合結束、看答案：希賈茲往下 A G F♯ E♭ D，最後的 D 留長。
 * - 看數字的最後 5 秒：每秒一聲很輕的磁磚碰撞。
 * - 整局結束：主音 D 上的琶音＋高八度的 D。
 */
export type HxSound = 'tap' | 'flip' | 'correct' | 'wrong' | 'reveal' | 'tick' | 'clear' | 'over';

function pluck(s: Synth, at: number, midi: number, vol = 1, len = 0.55) {
  const f = s.note(midi);
  s.noise(at, 0.014, 0.2 * vol, 'bandpass', 2500, 1.2, 4);
  s.tone(at, f, len, 0.13 * vol, 'triangle');
  s.tone(at, f * 1.004, len * 0.7, 0.05 * vol, 'triangle');
  s.tone(at, f, len * 0.25, 0.035 * vol, 'sawtooth');
}

function click(s: Synth, at: number, vol = 1, pitch = 2400) {
  s.noise(at, 0.01, 0.18 * vol, 'highpass', 5000, 0.7, 5);
  s.tone(at, pitch, 0.05, 0.035 * vol, 'sine');
}

// D 調希賈茲：D4 E♭4 F♯4 G4 A4 B♭4 C5 D5
const HIJAZ = [62, 63, 66, 67, 69, 70, 72, 74];

/** delays：翻面時每塊磁磚是在第幾秒翻的（跟畫面的波浪對上） */
export function playHx(name: HxSound, delays: number[] = []) {
  playSynth((s) => {
    const t = s.t;
    switch (name) {
      case 'tap':
        click(s, t);
        break;
      case 'clear':
        click(s, t, 0.6, 1800);
        click(s, t + 0.05, 0.5, 1500);
        break;
      case 'tick':
        click(s, t, 0.45, 1900);
        break;
      case 'flip':
        delays.forEach((d, i) => s.noise(t + d, 0.03, 0.12, 'bandpass', 1800 + i * 40, 2.2, 4));
        break;
      case 'correct':
        pluck(s, t, 69);
        pluck(s, t + 0.09, 74, 1, 0.8);
        break;
      case 'wrong':
        s.tone(t, s.note(43), 0.22, 0.14, 'triangle');
        s.noise(t, 0.12, 0.35, 'lowpass', 380, 0.8, 2);
        break;
      case 'reveal':
        [69, 67, 66, 63, 62].forEach((m, i) => pluck(s, t + i * 0.12, m, 0.85, i === 4 ? 1.3 : 0.45));
        break;
      case 'over':
        HIJAZ.forEach((m, i) => pluck(s, t + i * 0.07, m, 0.9, i === HIJAZ.length - 1 ? 1.6 : 0.4));
        pluck(s, t + HIJAZ.length * 0.07 + 0.1, 74, 1, 1.8);
        pluck(s, t + HIJAZ.length * 0.07 + 0.1, 50, 0.7, 1.8);
        break;
    }
  });
}

/** 找完這回合的每一組：答對之後接一段往上滾 */
export function playAllFound() {
  playSynth((s) => HIJAZ.slice(0, 5).forEach((m, i) => pluck(s, s.t + 0.2 + i * 0.07, m + 12, 0.8, i === 4 ? 1.1 : 0.35)));
}
