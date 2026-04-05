import { initializeApp, getApps } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAuth } from 'firebase/auth';

/**
 * Firebase Web SDK 初始化模組。
 *
 * 負責根據公開環境變數建立單例 app，並導出 Realtime Database
 * 與 Authentication 實例給其他模組共用。
 */
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

/**
 * 目前應用程式共用的 Firebase app 單例。
 *
 * 在 Next.js 開發模式或熱更新情況下，透過 `getApps()` 避免重複初始化。
 */
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

/**
 * Firebase Realtime Database 實例。
 */
export const db = getDatabase(app);

/**
 * Firebase Authentication 實例。
 */
export const auth = getAuth(app);
