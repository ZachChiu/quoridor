import { rowOf, type Square } from '@/games/knights-tour/engine';
import { playSynth, type Synth } from '@/utils/sound';

/**
 * 騎士巡遊的音效：歐拉那個年代的書房 —— 大鍵琴、鵝毛筆、紅粉筆（Zach 10/24：每款各自設計符合各自的聲音）。
 * 全部用 Web Audio 當場合成（playSynth），沒有音檔；開關跟全站共用。
 *
 * 配方（docs/sound.md 是全站共用的，這款的寫在這裡）：
 * - 大鍵琴的一聲（pluck）：大鍵琴是用羽毛管做的撥子勾弦 —— 開頭一聲很短的高頻雜音（highpass 4.2 kHz、12 ms）是撥子，
 *   接著三角波的基音（留得久）、鋸齒波的金屬亮音（收得快）、同音高微微走音的第二條弦（8′＋8′ 兩排弦的厚度）、八度泛音。
 *   不是 Wall Go 的木頭「篤」（bandpass 900 Hz 的雜音＋低音），也不是虎羊棋的木魚（窄頻帶雜音）。
 * - 騎士每跳一步彈一個音，音高看落在第幾列：最下面一列是 D4，往上照 D 大調一階一階升（10×10 最高到 F♯5）——
 *   騎士走過的路就是一段旋律。第一步（放下騎士）多一個低八度的 D 當通奏低音。
 * - 點錯：鵝毛筆在紙上刮一下（低 Q 的 bandpass 雜音，3 kHz → 2.2 kHz）＋一聲用布悶住的低音（大鍵琴的「魯特琴音栓」）。
 * - 卡住、犯規：A → F → 悶住的 D3，往下的小調。
 * - 走完：D 大調琶音往上滾（D F♯ A D）。節目挑戰三關全破：屬和弦（A C♯ E）解決到主和弦，最後一個音留長。
 * - 封閉巡遊（最後一步跳得回起點）：走完之後再一段終止式的顫音（E–D 交替、C♯ 轉回 D）—— 18 世紀樂譜結尾的那種「回到家」。
 * - 悔一步：紅粉筆被抹掉，兩聲輕的擦紙聲（中頻、很鈍）。
 * - 重來、下一關：翻一頁紙，一串由低到高的沙沙聲、最後紙落下的一聲悶響。
 */
export type KtSound = 'wrong' | 'stuck' | 'complete' | 'closed' | 'won' | 'undo' | 'clear';

/** D 大調從 D4 往上（MIDI）：最下面一列是第 0 階 */
const SCALE = [62, 64, 66, 67, 69, 71, 73, 74, 76, 78];

function pluck(s: Synth, at: number, midi: number, vol = 1, len = 0.9) {
  const f = s.note(midi);
  s.noise(at, 0.012, 0.22 * vol, 'highpass', 4200, 0.7, 4);
  s.tone(at, f, len, 0.12 * vol, 'triangle');
  s.tone(at, f * 1.0025, len * 0.6, 0.045 * vol, 'triangle');
  s.tone(at, f, len * 0.35, 0.03 * vol, 'sawtooth');
  s.tone(at, f * 2, len * 0.22, 0.025 * vol, 'sine');
}

/** 悶住的一聲（布壓著弦）：沒有撥子聲、很短 */
function muted(s: Synth, at: number, midi: number, vol = 1) {
  s.tone(at, s.note(midi), 0.16, 0.13 * vol, 'triangle');
  s.tone(at, s.note(midi) * 2, 0.06, 0.03 * vol, 'sine');
}

/** 一串音，每個隔 gap 秒；最後一個留 last 秒 */
function run(s: Synth, at: number, notes: number[], gap: number, vol = 1, last = 1.4) {
  notes.forEach((m, i) => pluck(s, at + i * gap, m, vol, i === notes.length - 1 ? last : 0.6));
}

/** 騎士跳到 sq（first：第一步、放下騎士） */
export function playJump(n: number, sq: Square, first = false) {
  playSynth((s) => {
    const midi = SCALE[Math.min(SCALE.length - 1, n - 1 - rowOf(n, sq))];
    pluck(s, s.t, midi, 1, 0.8);
    if (first) pluck(s, s.t, 50, 0.8, 1.1);
  });
}

/** delay：幾秒後響（排在 AudioContext 的時間上，不用 setTimeout）—— 走完的琶音要等騎士落地 */
export function playKt(name: KtSound, delay = 0) {
  playSynth((s) => {
    const t = s.t + delay;
    switch (name) {
      case 'wrong':
        s.noise(t, 0.08, 0.45, 'bandpass', 3000, 0.9, 1.2);
        s.noise(t + 0.055, 0.06, 0.32, 'bandpass', 2200, 0.9, 1.6);
        muted(s, t, 45, 0.8);
        break;
      case 'stuck':
        pluck(s, t, 69, 0.85, 0.7);
        pluck(s, t + 0.17, 65, 0.85, 0.8);
        muted(s, t + 0.36, 50, 1.1);
        break;
      case 'complete':
        run(s, t, [62, 66, 69, 74], 0.075);
        pluck(s, t, 50, 0.7, 1.6);
        break;
      case 'won':
        run(s, t, [57, 61, 64], 0.06, 0.9, 0.7);
        pluck(s, t, 45, 0.7, 0.9);
        run(s, t + 0.42, [62, 66, 69, 74, 78], 0.07, 1, 1.8);
        pluck(s, t + 0.42, 50, 0.8, 2);
        break;
      case 'closed':
        // 終止式的顫音：E D E D E D E，C♯ 轉回 D
        run(s, t, [76, 74, 76, 74, 76, 74, 76, 73, 74], 0.058, 0.75, 1.6);
        pluck(s, t + 8 * 0.058, 62, 0.7, 1.6);
        break;
      case 'undo':
        s.noise(t, 0.1, 0.32, 'bandpass', 1600, 0.5, 1);
        s.noise(t + 0.075, 0.08, 0.22, 'bandpass', 1200, 0.5, 1.3);
        break;
      case 'clear':
        for (let i = 0; i < 6; i++) {
          s.noise(t + i * 0.034 + Math.random() * 0.01, 0.05, 0.22 * (1 - i / 8), 'bandpass', 2400 + i * 500, 0.6, 1.5);
        }
        s.noise(t + 0.23, 0.09, 0.4, 'lowpass', 600, 0.7, 3);
        break;
    }
  });
}
