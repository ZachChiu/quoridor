import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Database } from 'firebase/database';

/**
 * Firebase Web SDK 惰性初始化模組。
 *
 * 為什麼不用模組頂層的單例：
 * Firebase Auth + RTDB 合計約 75 KB gzip，而本機對戰（/local）與首頁完全用不到。
 * 過去 UserProvider 掛在 root layout 並靜態匯入本模組，導致每個頁面都得下載。
 *
 * 改為以下全部 async 取得，內部用 Promise 記憶化確保只初始化一次；
 * firebase/app、firebase/auth、firebase/database 皆為動態 import，
 * 因此只有真正走到連線功能時才會下載。
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
 * 本機測試用：`NEXT_PUBLIC_FIREBASE_EMULATOR=1 npm run dev` 時改連 Firebase 模擬器
 * （`npx firebase-tools emulators:start --only auth,database`，要裝 Java）。
 * 在線狀態、斷線、規則這些事只能開兩個瀏覽器真的連一次才驗得到，又不該拿正式資料庫試。
 * 建置時沒設這個變數，判斷式會被編成 false、整段被剝掉（next.config.ts 給了空字串的預設值才會這樣）。
 */
const useEmulator = process.env.NEXT_PUBLIC_FIREBASE_EMULATOR === '1';

let appPromise: Promise<FirebaseApp> | null = null;
let authPromise: Promise<Auth> | null = null;
let dbPromise: Promise<Database> | null = null;

/** 取得（必要時建立）共用的 Firebase app 單例。 */
function getApp(): Promise<FirebaseApp> {
  appPromise ??= (async () => {
    const { initializeApp, getApps } = await import('firebase/app');
    // 開發模式熱更新時避免重複初始化
    return getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
  })();
  return appPromise;
}

/** 取得 Firebase Authentication 實例。 */
export function getFirebaseAuth(): Promise<Auth> {
  authPromise ??= (async () => {
    const [{ getAuth, connectAuthEmulator }, app] = await Promise.all([import('firebase/auth'), getApp()]);
    const auth = getAuth(app);
    if (useEmulator) connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    return auth;
  })();
  return authPromise;
}

/** 取得 Firebase Realtime Database 實例。 */
export function getFirebaseDb(): Promise<Database> {
  dbPromise ??= (async () => {
    const [{ getDatabase, connectDatabaseEmulator }, app] = await Promise.all([
      import('firebase/database'),
      getApp(),
    ]);
    const db = getDatabase(app);
    if (useEmulator) connectDatabaseEmulator(db, '127.0.0.1', 9000);
    return db;
  })();
  return dbPromise;
}
