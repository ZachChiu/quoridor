'use client';
import { useCallback, useEffect, useRef, useState } from 'react';

/** 歷史紀錄上「守門」那一筆的記號。Wall Go 的 PlayClient 用的是舊名 __wallgoGuard，兩個都認 */
const KEY = '__leaveGuard';
const isGuard = (state: unknown) => {
  const s = state as Record<string, unknown> | null;
  return !!(s?.[KEY] || s?.__wallgoGuard);
};

/**
 * 對局玩到一半要離開時先問一聲（10/25 Zach：「遊戲玩到一半要退出離開都要有一個提示詢問」）。
 * 照 Wall Go 的做法（PlayClient〈離開前確認〉、CLAUDE.md〈離開前確認與重整接回〉），給其他遊戲共用：
 *
 * - 房子鈕：呼叫 `request(leave)`。有東西會丟就打開確認，按「離開」才走；沒有就直接走。
 * - 瀏覽器返回鍵：對局頁第一次點擊時在歷史紀錄最上面放一筆同網址的「守門」，按返回只是退掉守門、
 *   頁面不換，在 popstate 裡攔下來問。守門一定要在點擊當下放（WebKit 會跳過沒有手勢時新增的紀錄）。
 *   沒東西會丟時替使用者再退一步，感覺起來仍是按一下就回去。
 * - 電腦版關分頁、重新整理：瀏覽器自己的「確定要離開嗎？」（iPhone 不顯示，所以不能只靠它）。
 *
 * 確認視窗由各款自己畫（各有各的樣子）：`open` 時顯示，「繼續」接 `cancel`、「離開」接 `confirm`。
 * 不必問的換局（換大小、從挑戰換到練習這類 replaceState 換網址的）走 `skip(go)`：一樣先退掉守門再換，
 * 不然換掉的是守門那筆，底下還留著舊的那局、按返回會先回到它。
 *
 * @param live 對局頁正在進行（還沒分出勝負）：這段期間才放守門
 * @param inProgress 離開會丟掉東西（下過了、或連線局已經開打）：這時才問
 */
export function useLeaveGuard({ live, inProgress }: { live: boolean; inProgress: boolean }) {
  const inProgressRef = useRef(inProgress);
  useEffect(() => { inProgressRef.current = inProgress; });
  // 重整時若停在守門上，一開始就要知道，否則下一次點擊又疊一筆、要按兩次返回才問得到
  const onTopRef = useRef(typeof window !== 'undefined' && isGuard(window.history.state));
  const [via, setVia] = useState<null | 'back' | 'home'>(null);
  const openRef = useRef(false);
  useEffect(() => { openRef.current = via !== null; });
  const pendingRef = useRef<(() => void) | null>(null);

  const pushGuard = useCallback(() => {
    if (onTopRef.current) return;
    window.history.pushState({ ...window.history.state, [KEY]: true }, '', window.location.href);
    onTopRef.current = true;
  }, []);

  useEffect(() => {
    if (!live) return;
    // capture：比任何元件的 onClick 都早，仍在同一個手勢裡。確認視窗開著時不放 ——
    // 按「離開」那一下若先放了守門，接著的退一步只會退掉它；按「繼續」由 cancel 自己放回去
    const onClick = () => { if (!openRef.current) pushGuard(); };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [live, pushGuard]);

  useEffect(() => {
    if (!inProgress || !live) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [inProgress, live]);

  useEffect(() => {
    const onPop = (e: PopStateEvent) => {
      if (!onTopRef.current || isGuard(e.state)) return;
      onTopRef.current = false;
      if (inProgressRef.current) setVia('back');
      else window.history.back(); // 沒東西會丟：替使用者把這一步退完
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  /** 先把守門那筆退掉再走：不然回到選單（或換頁）之後按返回，會先停在守門上、要按兩次 */
  const dropGuardThen = useCallback((go: () => void) => {
    if (!onTopRef.current) { go(); return; }
    onTopRef.current = false;
    let went = false;
    const done = () => {
      if (went) return;
      went = true;
      window.removeEventListener('popstate', done);
      go();
    };
    window.addEventListener('popstate', done);
    window.history.back();
    window.setTimeout(done, 400); // 保險：退一步沒有回報（理論上不會）也照樣走
  }, []);

  /** 房子鈕（或任何「回選單」）：`leave` 是真正離開要做的事 */
  const request = useCallback((leave: () => void) => {
    if (inProgressRef.current) {
      pendingRef.current = leave;
      setVia('home');
      return;
    }
    dropGuardThen(leave);
  }, [dropGuardThen]);

  const cancel = useCallback(() => {
    if (via === 'back') pushGuard(); // 按返回被攔下來的：把守門放回去（這一下是點擊，有手勢）
    pendingRef.current = null;
    setVia(null);
  }, [via, pushGuard]);

  const confirm = useCallback(() => {
    const was = via;
    const leave = pendingRef.current;
    pendingRef.current = null;
    setVia(null);
    if (was === 'back') { window.history.back(); return; }
    if (leave) dropGuardThen(leave);
  }, [via, dropGuardThen]);

  return { open: via !== null, request, skip: dropGuardThen, cancel, confirm };
}
