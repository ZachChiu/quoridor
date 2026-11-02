/**
 * 把 record.mjs 錄的兩段畫面剪成 30 秒內的直式教學影片（1080×1920、H.264、30fps），字幕燒在畫面上。
 *
 *   node scripts/social/make-video.mjs <locale> <recDir> <overlayDir> <out.mp4>
 *
 * 剪法（照錄影時記下的時間點切，不靠秒數寫死）：
 *   片頭（空棋盤＋一句話）→ 開局放子 → 前兩回合「走 0 到 2 格」→ 再兩回合「走完一定要蓋牆」
 *   → 跳到快結束的局面、下完最後幾手 → 結算畫面 → 片尾（網址、免費免登入、非官方粉絲作品）
 * 下棋的段落快轉一點（1.2～1.3 倍），放子與結算照原速。需要本機有 ffmpeg（Homebrew）。
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';

const [locale, recDir, overlayDir, out] = process.argv.slice(2).map((p, i) => (i ? resolve(p) : p));
const FPS = 30;
const work = join(dirname(out), `_work-${locale}`);
rmSync(work, { recursive: true, force: true });
mkdirSync(work, { recursive: true });

const load = (seg) => {
  const { timeline, marks } = JSON.parse(readFileSync(join(recDir, seg, 'timeline.json'), 'utf8'));
  const at = (label, n = 1) => marks.filter((m) => m.label === label)[n - 1].t;
  return { seg, timeline, at };
};
const A = load('A'), B = load('B');

const ff = (args) => execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: 'inherit' });

/** 一段：[t0, t1) 的影格照原本的時間間隔排好（再除以 speed），壓上一張字幕 */
function clip(name, rec, t0, t1, speed, overlay) {
  const frames = rec.timeline;
  // t0 那一刻畫面上的是 t0 之前最後一格
  let i = frames.findLastIndex((f) => f.t <= t0); if (i < 0) i = 0;
  const lines = [];
  for (; i < frames.length && frames[i].t < t1; i++) {
    const start = Math.max(frames[i].t, t0);
    const end = Math.min(frames[i + 1]?.t ?? t1, t1);
    lines.push(`file '${join(recDir, rec.seg, 'frames', frames[i].file)}'`, `duration ${((end - start) / speed).toFixed(4)}`);
  }
  lines.push(lines.at(-2)); // concat demuxer：最後一格要再列一次，duration 才會算進去
  const list = join(work, `${name}.txt`);
  writeFileSync(list, lines.join('\n') + '\n');
  const dur = (t1 - t0) / speed;
  const file = join(work, `${name}.mp4`);
  ff(['-f', 'concat', '-safe', '0', '-i', list, '-i', join(overlayDir, `${overlay}.png`),
    '-filter_complex', `[0:v]fps=${FPS},scale=1080:1920:flags=lanczos:out_range=tv,setsar=1[v];[v][1:v]overlay=0:0,format=yuv420p[o]`,
    // 錄到的是 JPEG（全範圍色彩），轉成一般影片的 TV 範圍，不然有的平台播出來偏灰或過飽和
    '-map', '[o]', '-t', dur.toFixed(3), '-pix_fmt', 'yuv420p', '-color_range', 'tv', '-c:v', 'libx264', '-preset', 'medium', '-crf', '19', '-r', String(FPS), file]);
  return { file, dur };
}
function still(name, png, dur) {
  const file = join(work, `${name}.mp4`);
  ff(['-loop', '1', '-i', png, '-t', String(dur), '-vf', `fps=${FPS},scale=1080:1920:out_range=tv,setsar=1,format=yuv420p`,
    '-pix_fmt', 'yuv420p', '-color_range', 'tv', '-c:v', 'libx264', '-preset', 'medium', '-crf', '19', '-r', String(FPS), file]);
  return { file, dur };
}

const parts = [
  clip('1-intro', A, A.at('intro'), A.at('place'), 1, 'intro'),
  clip('2-place', A, A.at('place'), A.at('select', 1), 1, 'place'),
  clip('3-move', A, A.at('select', 1), A.at('select', 3), 1.2, 'move'),
  clip('4-wall', A, A.at('select', 3), A.at('end'), 1.2, 'wall'),
  clip('5-late', B, B.at('late'), B.at('result'), 1.3, 'late'),
  clip('6-result', B, B.at('result'), B.at('end'), 1, 'result'),
  still('7-outro', join(overlayDir, 'outro.png'), 3.2),
];
const total = parts.reduce((s, p) => s + p.dur, 0);
if (total > 30) throw new Error(`影片 ${total.toFixed(1)} 秒，超過 30 秒`);
const list = join(work, 'all.txt');
writeFileSync(list, parts.map((p) => `file '${p.file}'`).join('\n') + '\n');
// 每一段的編碼參數都一樣，直接接起來；補一條無聲的音軌（有的平台不收沒有音軌的影片）
ff(['-f', 'concat', '-safe', '0', '-i', list, '-f', 'lavfi', '-i', 'anullsrc=channel_layout=stereo:sample_rate=44100',
  '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '96k', '-shortest', '-movflags', '+faststart', out]);
rmSync(work, { recursive: true, force: true });
console.log(out, total.toFixed(1) + 's', parts.map((p) => p.dur.toFixed(1)).join(' + '));
