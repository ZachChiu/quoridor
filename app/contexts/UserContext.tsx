'use client'
import { createContext, useCallback, useContext, useRef, useState } from 'react';

interface UserContextValue {
  /** 由 Cookie 還原的既有 UID；尚未登入過則為 null。可同步取得，供 UI 顯示用。 */
  uid: string | null;
  /** Firebase 匿名登入是否已完成。 */
  ready: boolean;
  /**
   * 確保已完成 Firebase 匿名登入，回傳 UID。
   *
   * 只有呼叫此函式時才會載入 Firebase SDK，因此本機對戰與首頁
   * 在使用者真正進入連線功能前都不必下載它（約 75 KB gzip）。
   * 重複呼叫會共用同一個 Promise。
   */
  ensureUser: () => Promise<string>;
}

const UserContext = createContext<UserContextValue | null>(null);

const COOKIE_KEY = 'wallgo_uid';
/**
 * 舊的 cookie 名稱。
 *
 * 站台改名時**不能**直接換 key ——換了等於現有玩家的匿名身分全部作廢：
 * 他們手上的房間連結一重連就會被當成另一個人，而房間的座位是綁 uid 的。
 * 所以讀的時候兩個都看，寫的時候只寫新的，舊的自然過期。
 */
const LEGACY_COOKIE_KEY = 'quoridor_uid';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year in seconds

function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function getUidFromCookie(): string | null {
  if (typeof document === 'undefined') return null;
  return readCookie(COOKIE_KEY) ?? readCookie(LEGACY_COOKIE_KEY);
}

function setUidCookie(uid: string) {
  document.cookie = `${COOKIE_KEY}=${encodeURIComponent(uid)}; max-age=${COOKIE_MAX_AGE}; path=/; SameSite=Lax`;
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [uid, setUid] = useState<string | null>(getUidFromCookie);
  const [ready, setReady] = useState(false);
  // 記憶化登入流程，避免並發呼叫重複登入
  const pendingRef = useRef<Promise<string> | null>(null);

  const ensureUser = useCallback((): Promise<string> => {
    pendingRef.current ??= (async () => {
      const [{ onAuthStateChanged, signInAnonymously }, auth] = await Promise.all([
        import('firebase/auth'),
        import('@/utils/firebase').then((m) => m.getFirebaseAuth()),
      ]);

      const resolvedUid = await new Promise<string>((resolve, reject) => {
        const unsubscribe = onAuthStateChanged(
          auth,
          async (user) => {
            unsubscribe();
            try {
              resolve(user ? user.uid : (await signInAnonymously(auth)).user.uid);
            } catch (error) {
              reject(error);
            }
          },
          reject
        );
      });

      setUidCookie(resolvedUid);
      setUid(resolvedUid);
      setReady(true);
      return resolvedUid;
    })();

    // 失敗時清掉記憶，讓使用者重試時能重新開始
    pendingRef.current.catch(() => {
      pendingRef.current = null;
    });

    return pendingRef.current;
  }, []);

  return (
    <UserContext.Provider value={{ uid, ready, ensureUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUser 必須在 UserProvider 內使用');
  return context;
}
