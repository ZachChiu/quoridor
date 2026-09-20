// 打版：把功能分支 --no-ff 併進 main，版號寫在那個 merge commit 上，tag 標在同一顆。
//
// main 的形狀是刻意的：`git log --first-parent main` 只會看到一排版本，
// 每個版本就是一次 merge，點開才是那個章節的 commit。歷史（v26.7.1 起）也全部
// 重整成這個樣子，所以不要再直接 commit 到 main —— 那會在版本線裡插一顆裸 commit。
//
// 版號規則：年份後兩碼.月份.該月第幾次 → 2026 年 9 月第一次就是 v26.9.1。
// 月份不補零（26.09.1 不是合法 semver，前導零會被拒），26.9.1 則合法，
// 所以 package.json 的 version 與 git tag 可以是同一個值（tag 多一個 v 前綴）。
// Sentry 的 release 也吃這個版號（next.config.ts 讀 package.json 的 version）。
//
// **一個用途一個 npm script**，不要把行為埋在 flag 裡（埋了沒人記得）：
//   npm run release:preview            先看會打成什麼版號、併哪個分支、包含幾個 commit
//   npm run release -- "版本標題"       併進 main、打 tag、推出去（標題省略就用分支名）
//   npm run release:local -- "標題"     同上但不推，自己決定何時 push
//   npm run release:wrap -- "標題"      不小心直接 commit 到 main 時用：把那些 commit
//                                      收進一條分支再併回來，版本線才不會插進裸 commit
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const argv = process.argv.slice(2);
const flags = new Set(argv.filter((a) => a.startsWith("--")));
const title = argv.find((a) => !a.startsWith("--")) ?? "";
const dryRun = flags.has("--dry-run");
const noPush = flags.has("--no-push");
const wrap = flags.has("--wrap");
const force = flags.has("--force");

const sh = (cmd) => execSync(cmd, { encoding: "utf8" }).trim();
const run = (cmd) => {
  if (dryRun) {
    console.log(`  [dry-run] ${cmd}`);
    return;
  }
  execSync(cmd, { stdio: "inherit" });
};
const die = (msg) => {
  console.error(`✗ ${msg}`);
  process.exit(1);
};

// --- 前置檢查：打版要能重現，所以工作區必須乾淨 ---
// dry-run 什麼都不改，所以不擋（就是要能在動手前先看一眼）
if (!dryRun && !force && sh("git status --porcelain")) {
  die("工作區有未提交的變更。打版要能重現，先 commit 或 stash 再來（--force 可略過）。");
}

const MAIN = "main";
let branch = sh("git rev-parse --abbrev-ref HEAD");

// --- 算版號：年份後兩碼.月份.該月第幾次 ---
const now = new Date();
const yy = String(now.getFullYear()).slice(2);
const mm = now.getMonth() + 1;
const prefix = `v${yy}.${mm}.`;

// 只看本機的 tag。CI 上淺層 clone 可能沒有 tag，所以先確保抓齊
if (!dryRun && process.env.CI) {
  try {
    execSync("git fetch --tags --quiet", { stdio: "ignore" });
  } catch {
    /* 沒有 remote 或抓不到就用本機現有的 */
  }
}
const seqs = sh("git tag --list 'v*'")
  .split("\n")
  .filter((t) => t.startsWith(prefix))
  .map((t) => Number(t.slice(prefix.length)))
  .filter((n) => Number.isInteger(n) && n > 0);
const seq = seqs.length ? Math.max(...seqs) + 1 : 1;

const version = `${yy}.${mm}.${seq}`;
const tag = `v${version}`;
if (sh("git tag --list").split("\n").includes(tag)) die(`tag ${tag} 已經存在。`);

// --- 要併進去的是哪條分支 ---
// 在 main 上：只有 --wrap 能繼續（把 main 上的裸 commit 收進一條分支）
if (branch === MAIN) {
  const loose = sh(`git rev-list --first-parent --no-merges ${MAIN} -20`)
    .split("\n")
    .filter(Boolean);
  if (!wrap) {
    die(
      loose.length
        ? `目前在 ${MAIN}，而且版本線上有 ${loose.length} 顆裸 commit。\n` +
            `  改用 npm run release:wrap -- "版本標題"（把它們收進一條分支再併回來）。`
        : `目前在 ${MAIN}，沒有東西可以併。先 git switch -c feat/xxx 把工作做在分支上。`,
    );
  }
  if (!loose.length) die(`${MAIN} 的版本線上沒有裸 commit，不需要 wrap。`);
}

const lastTagged = sh(`git rev-list --first-parent --merges ${MAIN} -1`) || sh(`git rev-list --max-parents=0 ${MAIN}`);
const wrapBase = wrap ? lastTagged : null;
const source = wrap ? `chapter/${version}` : branch;
const commits = wrap
  ? sh(`git log --no-merges --pretty=%s ${wrapBase}..${MAIN}`)
  : sh(`git log --no-merges --pretty=%s ${MAIN}..${branch}`);
const commitList = commits.split("\n").filter(Boolean);
if (!commitList.length) die(`${source} 沒有任何 ${MAIN} 還沒有的 commit。`);

const subject = `${tag} ${title || branch.replace(/^[a-z]+\//, "")}`;
const body = commitList.map((s) => `- ${s}`).join("\n");

console.log(`\n  ${JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")).version} → ${version}`);
console.log(`  ${wrap ? `${MAIN} 上的 ${commitList.length} 顆 commit → ${source}` : `分支 ${source}（${commitList.length} 個 commit）`} → ${MAIN}`);
console.log(`  merge commit：${subject}`);
console.log(`  本月已有 ${seqs.length} 個版本\n`);
if (dryRun) {
  console.log(commitList.map((s) => `    · ${s}`).join("\n") + "\n");
  process.exit(0);
}

// --- 動手 ---
// wrap：main 上的裸 commit 先搬到一條分支，main 退回上一個版本
if (wrap) {
  run(`git branch ${source} ${MAIN}`);
  run(`git reset --hard ${wrapBase}`);
  branch = source;
}

run(`git checkout ${MAIN}`);
if (!wrap) run(`git merge --no-ff --no-commit ${source}`);

// 版號寫進 merge commit 本身：版本是 main 的事，分支上不必留 chore(release)
const pkgPath = new URL("../package.json", import.meta.url);
const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
pkg.version = version;
// 保留原本的縮排與結尾換行，diff 才只有版號那一行
writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
run(`git add package.json`);

const msgFile = new URL("../.git/RELEASE_MSG", import.meta.url);
writeFileSync(msgFile, `${subject}\n\n${body}\n\nMerge branch '${source}'\n`);
// wrap 的情況 main 已經退回上一版，這裡才做那次 merge（帶著版號一起 commit）
run(wrap ? `git merge --no-ff --no-edit -F .git/RELEASE_MSG ${source}` : `git commit -F .git/RELEASE_MSG`);
run(`git tag -a ${tag} -F .git/RELEASE_MSG`);

if (noPush) {
  console.log(`\n  ✓ 本機已打好 ${tag}。推上去：git push --follow-tags\n`);
} else {
  // wrap 動到了 main 已推出的部分 → 要 force。用 --force-with-lease 而不是 --force：
  // 遠端在這期間被別人動過就會擋下來，不會無聲蓋掉
  run(wrap ? `git push --force-with-lease --follow-tags` : `git push --follow-tags`);
  console.log(`\n  ✓ ${tag} 已推出（GitHub Actions 會建置並同步到 S3，Sentry 的 release 就叫 ${tag}）`);
  console.log(`    分支 ${source} 已經併進 ${MAIN}，不需要了就 git branch -d ${source}\n`);
}
