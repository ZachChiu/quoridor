import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

// Firebase 配置 - 請替換為您的實際 Firebase 專案配置
const firebaseConfig = {
    apiKey: "AIzaSyCsvpUmyyxNsEOC8kM3zqc9qQ1UgPmOaRs",
    authDomain: "quoridor-game-4e725.firebaseapp.com",
    databaseURL: "https://quoridor-game-4e725-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "quoridor-game-4e725",
    storageBucket: "quoridor-game-4e725.firebasestorage.app",
    messagingSenderId: "511065123705",
    appId: "1:511065123705:web:f5c8806cc3a9f6b7521da8"
  };

// 初始化 Firebase
const app = initializeApp(firebaseConfig);

// 取得 Realtime Database 實例
export const database = getDatabase(app);

export default app;
