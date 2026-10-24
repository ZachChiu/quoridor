import { playSynth, type Synth } from '@/utils/sound';
import { COLORS, type Side, type StoneColor } from '@/games/blind-gomoku/engine';

/**
 * 盲五子棋的音效（Zach 10/24：每一款要有自己的聲音、照自己的世界設計）。全部用 Web Audio 當場合成（utils/sound.ts 的 playSynth），
 * 沒有音檔、沒有節目配樂；開關跟全站共用（useSound）。
 *
 * 這款的世界是朝鮮的拼布包袱巾（조각보）：棋子是一塊塊布、棋盤是白絲。所以聲音分兩層 ——
 *
 * - **子落在布上**：悶悶的「噗」。低通的雜音（520 Hz 以下）＋一聲往下掉的低音（120→80 Hz）。
 *   布把石頭的「喀」吃掉了 —— 刻意不是 Wall Go 的木盤「篤」（帶通 900 Hz）、也不是虎羊棋的木魚（帶通、高 Q、有音高的敲擊）。
 * - **每一個顏色是伽倻琴（가야금）的一根弦**：平調的五聲音階（D E G A C D E，MIDI 62–76），七個顏色由低到高（紅最低、粉紅最高）。
 *   AI 用你上一手的顏色回應，所以它落子時彈的是**你剛才那一根弦** —— 盲棋「跟色」的規則變成聽得到的回聲。
 *   音高只跟顏色走、黑白兩方完全一樣，所以聲音不會透露是誰的子（一般模式沒有顏色：黑子 C4、白子 G4）。
 *   弦的做法：一小段帶通雜音當「撥」的那一下（中心在兩倍頻、Q 6、18 ms）；基音是三角波，從高 1.2% 滑回原音
 *   （伽倻琴按弦的농현，聽起來才不像電子琴）；再疊兩倍、三倍頻的正弦當泛音，衰減比基音快。
 * - **選顏色**：只撥那根弦、不落子，小聲而短 —— 先聽到這個顏色是哪個音。
 * - **翻開（揭曉黑白）**：從最低刮到最高（G3 到 G5 共 11 根弦，散在 0.85 秒內），伽倻琴的刮奏，像把包袱巾一口氣攤開。
 * - **贏**：上行四聲 D4 G4 A4 D5，最後一聲長、尾巴往下彎一點；**輸**：下行 A4 G4 E4 D4，輕；
 *   **和局**：D4 與 A4 同時撥兩次，不上不下。
 */

const PENTA = [55, 57, 60, 62, 64, 67, 69, 72, 74, 76];
/** 七個顏色各一根弦（照 COLORS 的順序） */
const STRING_OF: Record<StoneColor, number> = Object.fromEntries(COLORS.map((c, i) => [c, PENTA[i + 3]])) as Record<StoneColor, number>;
const SIDE_STRING: Record<Side, number> = { black: 60, white: 67 };

/** 這顆子是哪根弦：盲棋看顏色（兩方一樣）、一般模式看黑白 */
export function stringOf(stone: { color: StoneColor; side: Side }, blind: boolean): number {
  return blind ? STRING_OF[stone.color] : SIDE_STRING[stone.side];
}
export const colorString = (c: StoneColor) => STRING_OF[c];

/** 撥一根弦。bend：尾巴往下彎多少（比例），給結尾的長音用 */
function pluck(s: Synth, at: number, midi: number, vol: number, dur = 0.6, bend = 0) {
  const f = s.note(midi);
  s.noise(at, 0.018, vol * 1.4, 'bandpass', f * 2, 6, 4);
  s.tone(at, f * 1.012, dur, vol * 0.5, 'triangle', bend ? f * (1 - bend) : f);
  s.tone(at, f * 2, dur * 0.45, vol * 0.12, 'sine');
  s.tone(at, f * 3, dur * 0.22, vol * 0.05, 'sine');
}

/** 子落在白絲上：悶的「噗」 */
function cloth(s: Synth, at: number, vol: number) {
  s.noise(at, 0.07, vol * 1.3, 'lowpass', 520, 0.7, 2.5);
  s.tone(at, 120, 0.1, vol * 0.32, 'sine', 80);
}

/** 落子：布上一聲，緊接著那根弦 */
export function playStone(midi: number) {
  playSynth((s) => {
    cloth(s, s.t, 0.9);
    pluck(s, s.t + 0.012, midi, 0.32, 0.55);
  });
}

/** 選顏色：只撥弦，小聲 */
export function playPick(midi: number) {
  playSynth((s) => pluck(s, s.t, midi, 0.2, 0.3));
}

/** 翻開黑白：從低刮到高 */
export function playReveal() {
  playSynth((s) => {
    PENTA.concat(79).forEach((n, i) => pluck(s, s.t + i * 0.085, n, 0.22 + i * 0.01, 0.5));
  });
}

export function playEnd(kind: 'win' | 'lose' | 'draw') {
  playSynth((s) => {
    const { t } = s;
    if (kind === 'win') {
      [62, 67, 69].forEach((n, i) => pluck(s, t + i * 0.13, n, 0.4, 0.5));
      pluck(s, t + 0.39, 74, 0.45, 1.4, 0.03);
    } else if (kind === 'lose') {
      [69, 67, 64].forEach((n, i) => pluck(s, t + i * 0.2, n, 0.3, 0.55));
      pluck(s, t + 0.6, 62, 0.3, 1.2, 0.04);
    } else {
      for (const dt of [0, 0.32]) { pluck(s, t + dt, 62, 0.3, 0.8); pluck(s, t + dt, 69, 0.26, 0.8); }
    }
  });
}
