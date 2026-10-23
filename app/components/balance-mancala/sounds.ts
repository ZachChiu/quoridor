import { playSynth, type Synth } from '@/utils/sound';

/**
 * 平衡播棋的音效（Zach 10/24：每一款都要有自己的聲音）。全部用 playSynth 當場合成，沒有音檔。
 *
 * 從這款的世界來：Oware 是把硬殼的種子（或小石子）一顆一顆丟進挖空的木頭坑裡，阿坎人秤金砂用的是黃銅砝碼。
 * 所以只有兩種材質 —— 種子碰木坑、黃銅碰黃銅：
 *
 * - **種子落坑**（seed）：一聲很短的高頻「嗒」（highpass 雜音 3.8 kHz、12 ms，硬殼碰到木頭的那一下）
 *   ＋木坑的空腔共鳴（正弦 f，160 ms 裡往下滑 6%，再疊一個 1.52 f 的弱泛音，聽起來是空心的）＋一點 lowpass 的悶聲。
 *   播種時一顆比一顆高（每顆升 2/3 個半音：f = 300 × 2^(i/18)，第 24 顆以後不再升），聽得出在數；
 *   坑裡已經有子時，再補一到三聲更細的「喀」（種子碰種子，間隔 18–40 ms、一聲比一聲小）。
 *   開局放子（place）是同一個聲音、不升調。
 * - **最後一顆**（last）：同一個落坑聲但低、重（f 240），加一聲三角波的悶「咚」—— 這一顆決定誰得分。
 * - **得分**（score）：黃銅砝碼一塊一塊放上秤盤 —— 不和諧的鐘聲泛音（f、2.76 f、5.4 f，衰減 0.9／0.35／0.12 秒）
 *   ＋一聲 highpass 的金屬「叮」。幾塊照分數算（每 2 分一塊，最多 6 塊），間隔 70 ms、音高在一小段裡隨機。
 *   盤子是 1.3–1.6 kHz；天使格（angel）高、輕（2–2.4 kHz），先一陣很淡的 highpass 氣聲；
 *   惡魔格（devil）低、重（560–700 Hz），先一聲 lowpass 的悶響。
 * - **結束**：贏（win）是砝碼依五聲音階往上疊（E5 G5 A5 C6 E6）；輸（lose）是兩塊較悶、衰減快的往下（A4 → E4）。
 *
 * 跟 Wall Go（bandpass 900 Hz 的木頭「篤」＋190 Hz）與虎羊棋（窄頻 Q12 的木魚）都不一樣：這裡的木頭是空心的坑、
 * 主角是很短的種子聲與黃銅的泛音。開關跟全站共用（useSound）。
 */
export type MancalaSound =
  | { kind: 'place'; crowd: number; delay?: number }
  | { kind: 'seed'; index: number; crowd: number; delay?: number }
  | { kind: 'last'; crowd: number; delay?: number }
  | { kind: 'score'; points: number; cell: 'dish' | 'angel' | 'devil'; delay?: number }
  | { kind: 'win' | 'lose'; delay?: number };

/** 一顆種子落進木坑 */
function pit(s: Synth, at: number, f: number, vol: number) {
  s.noise(at, 0.012, vol * 0.9, 'highpass', 3800, 0.7, 4);
  s.tone(at + 0.004, f, 0.16, vol * 0.3, 'sine', f * 0.94);
  s.tone(at + 0.004, f * 1.52, 0.07, vol * 0.07, 'sine');
  s.noise(at, 0.05, vol * 0.5, 'lowpass', 600, 0.8, 3);
}

/** 種子碰種子：坑裡已經有幾顆，就多幾聲細碎的「喀」（最多 3 聲） */
function clatter(s: Synth, at: number, crowd: number, vol: number) {
  let dt = 0.018;
  for (let k = 0; k < Math.min(3, crowd); k++) {
    s.noise(at + dt, 0.008, vol * (0.45 - k * 0.12), 'highpass', 4200 + Math.random() * 1400, 0.9, 5);
    dt += 0.018 + Math.random() * 0.022;
  }
}

/** 一塊黃銅砝碼碰到秤盤 */
function brass(s: Synth, at: number, f: number, vol: number, ring = 1) {
  s.tone(at, f, 0.9 * ring, vol * 0.16, 'sine');
  s.tone(at, f * 2.76, 0.35 * ring, vol * 0.07, 'sine');
  s.tone(at, f * 5.4, 0.12 * ring, vol * 0.035, 'sine');
  s.noise(at, 0.01, vol * 0.35, 'highpass', 4500, 0.7, 4);
}

const RANGE = { dish: [1300, 1600], angel: [2000, 2400], devil: [560, 700] } as const;

export function playMancala(sound: MancalaSound) {
  playSynth((s) => {
    const t = s.t + (sound.delay ?? 0);
    switch (sound.kind) {
      case 'place':
        pit(s, t, 360, 0.8);
        clatter(s, t, sound.crowd, 0.8);
        break;
      case 'seed':
        pit(s, t, 300 * 2 ** (Math.min(sound.index, 24) / 18), 0.75);
        clatter(s, t, sound.crowd, 0.75);
        break;
      case 'last':
        pit(s, t, 240, 1.1);
        clatter(s, t, sound.crowd, 1);
        s.tone(t + 0.01, 120, 0.22, 0.28, 'triangle', 96);
        break;
      case 'score': {
        const [lo, hi] = RANGE[sound.cell];
        let at = t;
        if (sound.cell === 'angel') { s.noise(at, 0.3, 0.12, 'highpass', 6000, 0.5, 1.5); at += 0.08; }
        if (sound.cell === 'devil') { s.noise(at, 0.12, 0.6, 'lowpass', 260, 0.9, 2.5); at += 0.06; }
        const n = Math.min(6, Math.max(1, Math.ceil(sound.points / 2)));
        for (let k = 0; k < n; k++) {
          brass(s, at + k * 0.07, lo + Math.random() * (hi - lo), sound.cell === 'devil' ? 1.2 : 0.9, sound.cell === 'devil' ? 0.7 : 1);
        }
        break;
      }
      case 'win':
        [76, 79, 81, 84, 88].forEach((n, k) => brass(s, t + k * 0.11, s.note(n), 1, k === 4 ? 1.6 : 1));
        break;
      case 'lose':
        brass(s, t, s.note(69), 0.8, 0.45);
        brass(s, t + 0.22, s.note(64), 0.8, 0.6);
        break;
    }
  });
}
