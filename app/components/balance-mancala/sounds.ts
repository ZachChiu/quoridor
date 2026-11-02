import { playSynth, type Synth } from '@/utils/sound';

/**
 * 平衡播棋的音效（Zach 10/24：每一款都要有自己的聲音）。全部用 playSynth 當場合成，沒有音檔。
 *
 * 11/3 這款定成時禱書〈最後的審判〉的世界（Zach 選祈禱書版），聲音跟著從抄寫室與小禮拜堂來 ——
 * 原本是 Oware 的種子落木坑、阿坎人的黃銅砝碼，換成三種材質：象牙念珠碰書桌、祭台上的小手鈴、鐘樓的大鐘與管風琴：
 *
 * - **念珠落下**（seed）：一顆象牙小珠落在鋪了羊皮紙的書桌上 —— 很短的 bandpass 2.4 kHz「嗒」（10 ms，硬的珠子）
 *   ＋lowpass 320 Hz 的悶聲（隔著紙的木桌）＋一聲很輕的正弦「叮」（珠子本身的共鳴，40 ms）。
 *   播種時「叮」一顆比一顆高（f = 880 × 2^(i/18)，每顆升 2/3 個半音，第 24 顆以後不再升），聽得出在數；
 *   格子裡已經有子時，再補一到三聲更細的「喀」（珠子碰珠子，bandpass 3.6–5 kHz，間隔 18–40 ms、一聲比一聲小）。
 *   開局放子（place）是同一個聲音、不升調。
 * - **最後一顆**（last）：同一顆珠子但重一點、叮低一點（660 Hz），加一聲三角波的悶「咚」（書桌）—— 這一顆決定誰得分。
 * - **得分**（score）：祭台上的小手鈴（sanctus bell）—— 泛音 f、2 f、3.01 f（衰減 1.1／0.5／0.25 秒，高的那個稍微走音，像銅鈴），
 *   幾下照分數算（每 2 分一下，最多 6 下），間隔 80 ms，音高照 D 多利安往上走（D6 E6 F6 G6 A6 B6）。
 *   - 天使格（angel）：一陣很淡的 highpass 氣聲（翅膀）之後，兩個更高的小鈴（A6、D7）一起輕輕響
 *   - 惡魔格（devil）：先一聲 lowpass 的悶鼓，再一記鐘樓的大鐘 —— 教堂鐘的泛音 0.5 f（hum）、f、1.19 f（小三度，鐘聲「陰」的那個音）、
 *     1.5 f、2 f，f 是 G2–A2 一帶，長長地衰減
 * - **結束**：管風琴 —— 每個音是 1、2、3、4 倍頻的正弦疊起來（音栓全開的平直音色），慢起音。
 *   贏（win）：變格終止 G–B–D → D–F♯–A–D（「阿們」終止，聽起來是頌讚）；輸（lose）：輕的 D 小三和弦往下到 A 低音，短一點。
 * - **輪到你**（turn，連線限定）：先一顆念珠落下，再兩下小手鈴往上（A5 → E6），像有人搖鈴叫你。
 *   一桌四到七個人，等其他人下完要一陣子，分頁在背景也聽得到。
 * - **被催**（nudge，連線限定）：同一個小手鈴被快速搖四下（同一個音、一下比一下輕）。
 *
 * 跟 Wall Go（木頭「篤」）、虎羊棋（木魚）、九子棋（骨棋子＋撥弦琴）都不一樣：這裡的主角是鈴與鐘的泛音、管風琴的和弦。
 * 開關跟全站共用（useSound）。
 */
export type MancalaSound =
  | { kind: 'place'; crowd: number; delay?: number }
  | { kind: 'seed'; index: number; crowd: number; delay?: number }
  | { kind: 'last'; crowd: number; delay?: number }
  | { kind: 'score'; points: number; cell: 'dish' | 'angel' | 'devil'; delay?: number }
  | { kind: 'win' | 'lose' | 'turn' | 'nudge'; delay?: number };

/** 一顆象牙念珠落在書桌上（ping：珠子本身那聲「叮」的音高） */
function bead(s: Synth, at: number, ping: number, vol: number) {
  s.noise(at, 0.01, vol * 1.6, 'bandpass', 2400, 3, 4);
  s.noise(at, 0.05, vol * 0.55, 'lowpass', 320, 0.9, 3);
  s.tone(at + 0.002, ping, 0.04, vol * 0.05, 'sine');
}

/** 珠子碰珠子：格子裡已經有幾顆，就多幾聲細碎的「喀」（最多 3 聲） */
function clatter(s: Synth, at: number, crowd: number, vol: number) {
  let dt = 0.018;
  for (let k = 0; k < Math.min(3, crowd); k++) {
    s.noise(at + dt, 0.008, vol * (0.9 - k * 0.25), 'bandpass', 3600 + Math.random() * 1400, 4, 5);
    dt += 0.018 + Math.random() * 0.022;
  }
}

/** 小手鈴響一下 */
function handbell(s: Synth, at: number, f: number, vol: number, ring = 1) {
  s.tone(at, f, 1.1 * ring, vol * 0.13, 'sine');
  s.tone(at, f * 2, 0.5 * ring, vol * 0.06, 'sine');
  s.tone(at, f * 3.01, 0.25 * ring, vol * 0.035, 'sine');
  s.noise(at, 0.006, vol * 0.3, 'highpass', 5200, 0.8, 4);
}

/** 鐘樓的大鐘（教堂鐘的泛音：hum、基音、小三度、五度、八度） */
function tower(s: Synth, at: number, f: number, vol: number) {
  s.tone(at, f * 0.5, 2.6, vol * 0.14, 'sine');
  s.tone(at, f, 2.0, vol * 0.18, 'sine');
  s.tone(at, f * 1.19, 1.6, vol * 0.1, 'sine');
  s.tone(at, f * 1.5, 1.1, vol * 0.07, 'sine');
  s.tone(at, f * 2, 0.9, vol * 0.06, 'sine');
  s.noise(at, 0.02, vol * 0.5, 'bandpass', 900, 1.2, 3);
}

/** 管風琴的一個音：1–4 倍頻的正弦疊起來，慢起音（先輕輕送一聲、再整個進來） */
function pipe(s: Synth, at: number, midi: number, dur: number, vol: number) {
  const f = s.note(midi);
  [1, 2, 3, 4].forEach((h, k) => {
    s.tone(at + 0.03, f * h, dur, vol * [0.07, 0.04, 0.025, 0.015][k], 'sine');
  });
  s.noise(at, 0.08, vol * 0.08, 'bandpass', f * 2, 2, 1);
}

/** 得分的小手鈴照 D 多利安往上走 */
const DORIAN = [86, 88, 89, 91, 93, 95];

export function playMancala(sound: MancalaSound) {
  playSynth((s) => {
    const t = s.t + (sound.delay ?? 0);
    switch (sound.kind) {
      case 'place':
        bead(s, t, 990, 0.8);
        clatter(s, t, sound.crowd, 0.8);
        break;
      case 'seed':
        bead(s, t, 880 * 2 ** (Math.min(sound.index, 24) / 18), 0.75);
        clatter(s, t, sound.crowd, 0.75);
        break;
      case 'last':
        bead(s, t, 660, 1.1);
        clatter(s, t, sound.crowd, 1);
        s.tone(t + 0.01, 120, 0.22, 0.28, 'triangle', 96);
        break;
      case 'score': {
        if (sound.cell === 'devil') {
          s.noise(t, 0.14, 0.7, 'lowpass', 180, 0.9, 2.5);
          tower(s, t + 0.06, 98 + Math.random() * 12, 1);
          break;
        }
        let at = t;
        if (sound.cell === 'angel') {
          s.noise(at, 0.35, 0.1, 'highpass', 6500, 0.5, 1.5);
          at += 0.1;
          handbell(s, at, s.note(93), 0.7, 1.3);
          handbell(s, at + 0.03, s.note(98), 0.5, 1.3);
          break;
        }
        const n = Math.min(6, Math.max(1, Math.ceil(sound.points / 2)));
        for (let k = 0; k < n; k++) handbell(s, at + k * 0.08, s.note(DORIAN[k]), 0.85);
        break;
      }
      case 'win':
        // 變格終止：G 大三和弦 → D 大三和弦（最上面再加一個高八度的 D）
        [55, 67, 71, 74].forEach((n) => pipe(s, t, n, 0.9, 1));
        [50, 62, 66, 69, 74].forEach((n) => pipe(s, t + 0.75, n, 1.8, 1));
        break;
      case 'lose':
        [50, 62, 65, 69].forEach((n) => pipe(s, t, n, 0.8, 0.7));
        [45, 57, 64].forEach((n) => pipe(s, t + 0.6, n, 1.2, 0.6));
        break;
      case 'turn':
        bead(s, t, 990, 0.6);
        handbell(s, t + 0.08, s.note(81), 0.75, 0.8);
        handbell(s, t + 0.22, s.note(88), 0.85, 1.2);
        break;
      case 'nudge':
        for (let k = 0; k < 4; k++) handbell(s, t + k * 0.09, s.note(88), 0.9 - k * 0.15, 0.6);
        break;
    }
  });
}
