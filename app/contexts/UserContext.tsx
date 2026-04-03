'use client'
import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { auth } from '@/utils/firebase';

interface UserContextValue {
  uid: string | null;
  ready: boolean;
}

const UserContext = createContext<UserContextValue | null>(null);

const COOKIE_KEY = 'quoridor_uid';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year in seconds

function getUidFromCookie(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_KEY}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function setUidCookie(uid: string) {
  document.cookie = `${COOKIE_KEY}=${encodeURIComponent(uid)}; max-age=${COOKIE_MAX_AGE}; path=/; SameSite=Lax`;
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [uid, setUid] = useState<string | null>(getUidFromCookie);
  const [ready, setReady] = useState(false);

  useEffect(() => {    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUidCookie(user.uid);
        setUid(user.uid);
        setReady(true);
      } else {
        const cred = await signInAnonymously(auth);
        setUidCookie(cred.user.uid);
        setUid(cred.user.uid);
        setReady(true);
      }
    });
    return unsubscribe;
  }, []);

  return (
    <UserContext.Provider value={{ uid, ready }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUser 必須在 UserProvider 內使用');
  return context;
}
