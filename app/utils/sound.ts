/**
 * 音效。
 *
 * **全部用 Web Audio 當場合成，沒有任何音檔**：沒有授權問題（大腦 10/23：節目配樂一律不能用、
 * 音檔要寫出處），也不用多下載東西。出處寫在 docs/sound.md。
 *
 * - 預設開，對局左上角的喇叭一按就關（存 localStorage，只是這台裝置的偏好）。
 * - **沒有背景音樂**：做過合成的與找過 Pixabay 的曲子，Zach 10/23 決定拔掉（「音樂功能拔掉，留下棋的聲音就好」）。
 * - 瀏覽器規定使用者點過頁面之前不能出聲。AudioContext 在第一次點擊／按鍵時才建立，之前呼叫 play 都安靜地略過。
 * - 分頁在背景時 AudioContext 照樣會響 —— 「輪到你了」的提示音就是為了這個。
 */

export type Sfx = 'turn' | 'place' | 'wall' | 'nudge' | 'start' | 'win' | 'lose';
export type SoundPrefs = { sfx: boolean };

const KEY = 'wallgo:sound';
const DEFAULTS: SoundPrefs = { sfx: true };

// ─── 偏好（給 useSyncExternalStore）──────────────────────────────────────────

let prefs: SoundPrefs | null = null;
const listeners = new Set<() => void>();

export function getSoundPrefs(): SoundPrefs {
  if (prefs) return prefs;
  try {
    const raw = localStorage.getItem(KEY);
    prefs = raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
  } catch {
    prefs = DEFAULTS;
  }
  return prefs!;
}
export const getServerSoundPrefs = () => DEFAULTS;

export function setSoundPrefs(patch: Partial<SoundPrefs>) {
  prefs = { ...getSoundPrefs(), ...patch };
  try { localStorage.setItem(KEY, JSON.stringify(prefs)); } catch { /* 無痕模式：這次有效就好 */ }
  listeners.forEach((l) => l());
}

export function subscribeSoundPrefs(l: () => void) {
  listeners.add(l);
  return () => { listeners.delete(l); };
}

// ─── AudioContext：第一次互動才建立 ──────────────────────────────────────────

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let armed = false;

/** 掛一次全域的「第一次互動」監聽。之後的 play 才有聲音 */
export function armAudio() {
  if (armed || typeof window === 'undefined') return;
  armed = true;
  const unlock = () => {
    if (!ctx) {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.9;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') void ctx.resume();
  };
  // capture：棋盤上的按鈕可能 stopPropagation
  window.addEventListener('pointerdown', unlock, { capture: true });
  window.addEventListener('keydown', unlock, { capture: true });
}

function ready(): AudioContext | null {
  if (!ctx || !master) return null;
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

// ─── 合成用的小零件 ────────────────────────────────────────────────────────────

/** 一個有起音與衰減的音。type 決定音色：sine 圓、triangle 像木琴 */
function tone(at: number, freq: number, dur: number, vol: number, type: OscillatorType = 'sine') {
  const c = ctx!;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, at);
  g.gain.setValueAtTime(0, at);
  g.gain.linearRampToValueAtTime(vol, at + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  o.connect(g).connect(master!);
  o.start(at);
  o.stop(at + dur + 0.05);
}

/** 一小段濾過的雜音：木頭、石頭碰撞的「喀」 */
function knock(at: number, center: number, dur: number, vol: number) {
  const c = ctx!;
  const len = Math.ceil(c.sampleRate * dur);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const ch = buf.getChannelData(0);
  for (let i = 0; i < len; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 3;
  const src = c.createBufferSource();
  src.buffer = buf;
  const bp = c.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = center;
  bp.Q.value = 1.4;
  const g = c.createGain();
  g.gain.value = vol;
  src.connect(bp).connect(g).connect(master!);
  src.start(at);
}

const NOTE = (n: number) => 440 * 2 ** ((n - 69) / 12); // MIDI → Hz

// ─── 音效 ─────────────────────────────────────────────────────────────────────

export function playSfx(name: Sfx) {
  if (!getSoundPrefs().sfx) return;
  const c = ready();
  if (!c) return;
  const t = c.currentTime + 0.01;
  switch (name) {
    case 'turn': // 兩聲上行的鈴：E5 → A5
      tone(t, NOTE(76), 0.5, 0.22, 'sine');
      tone(t, NOTE(88), 0.25, 0.05, 'sine');
      tone(t + 0.13, NOTE(81), 0.8, 0.24, 'sine');
      tone(t + 0.13, NOTE(93), 0.35, 0.05, 'sine');
      break;
    case 'place': // 棋子放上木盤：短促的「篤」
      knock(t, 900, 0.06, 0.9);
      tone(t, 190, 0.12, 0.25, 'sine');
      break;
    case 'wall': // 牆立起來：比棋子重一點的「喀」
      knock(t, 1500, 0.05, 0.7);
      knock(t + 0.012, 600, 0.09, 0.8);
      tone(t, 140, 0.16, 0.3, 'triangle');
      break;
    case 'nudge': // 敲門兩下
      for (const dt of [0, 0.17]) {
        knock(t + dt, 420, 0.09, 1.4);
        tone(t + dt, 95, 0.14, 0.45, 'sine');
      }
      break;
    case 'start': // 開局：G4 → D5
      tone(t, NOTE(67), 0.35, 0.18, 'triangle');
      tone(t + 0.1, NOTE(74), 0.6, 0.2, 'triangle');
      break;
    case 'win': // 上行琶音 C E G C
      [72, 76, 79, 84].forEach((n, i) => tone(t + i * 0.09, NOTE(n), i === 3 ? 1.1 : 0.4, 0.2, 'triangle'));
      break;
    case 'lose': // 兩聲下行，輕一點
      tone(t, NOTE(69), 0.45, 0.15, 'sine');
      tone(t + 0.18, NOTE(64), 0.8, 0.15, 'sine');
      break;
  }
}

/** 被催的時候手機震一下。跟著音效開關走 —— 關了聲音就是不想被打擾（大腦 10/23） */
export function buzz(pattern: number[]) {
  if (!getSoundPrefs().sfx) return;
  try { navigator.vibrate?.(pattern); } catch { /* iOS 沒有 vibrate */ }
}
