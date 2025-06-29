import { database } from './firebase';
import { ref, set, onValue, off, get } from 'firebase/database';
import type { Player } from '@/types/chessboard.ts';

// 遊戲狀態
export interface GamePlayState {
  size: number;
  board: Player[][];
  currentPlayer: Player;
  verticalWalls: Player[][];
  horizontalWalls: Player[][];
  selectedChess: { row: number; col: number } | null;
  remainSteps: number;
  uniqTerritories: { A: string[]; B: string[]; C?: string[] };
  flattenTerritoriesObj: Record<string, Player>;
  winingStatus: (Player | 'draw')[];
  openingStep: Player[];
  isChampionModalOpen: boolean;
  breakWallCountObj: { A: number; B: number; C: number };
  playersNum: number;
}

export interface OnlineGameRoom {
  id: string;
  gameState: string; // JSON 字串格式，避免 Firebase RTD 省略 null/空陣列問題
  playersNum: number;
}

/**
 * 產生隨機遊戲 Token
 */
export const generateGameToken = (): string => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
};

/**
 * 建立新的線上遊戲房間
 */
export async function createGameRoom(
  playersNum: number, 
  initialGameState: GamePlayState
): Promise<string> {
  const token = generateGameToken();
  const roomRef = ref(database, `games/${token}`);
  
  const roomData: OnlineGameRoom = {
    id: token,
    gameState: JSON.stringify(initialGameState), // 將 gameState 序列化為 JSON 字串
    playersNum
  };
  
  try {
    await set(roomRef, roomData);
    // console.log('遊戲房間建立成功，Token:', token);
    return token;
  } catch (error) {
    // console.error('建立遊戲房間失敗:', error);
    throw error;
  }
}


/**
 * 更新遊戲狀態到 Firebase
 */
export async function updateGameState(
  token: string, 
  gameState: GamePlayState
): Promise<void> {
  const gameStateRef = ref(database, `games/${token}/gameState`);
  
  try {
    // 更新遊戲狀態
    await Promise.all([
      set(gameStateRef, JSON.stringify(gameState)) // 序列化為 JSON 字串
    ]);
  } catch (error) {
    // console.error('更新遊戲狀態失敗:', error);
    throw error;
  }
}

/**
 * 監聽遊戲狀態變化
 */
export function subscribeToGameState(
  token: string, 
  callback: (gameState: GamePlayState | null) => void
): (() => void) {
  const gameStateRef = ref(database, `games/${token}/gameState`);
  
  const unsubscribe = onValue(gameStateRef, (snapshot) => {
    const data = snapshot.val();
    
    if (data && typeof data === 'string') {
      try {
        // 反序列化 JSON 字串為 gameState 物件
        const gameState: GamePlayState = JSON.parse(data);
        callback(gameState);
      } catch (error) {
        // console.error('反序列化 gameState 失敗:', error);
        callback(null);
      }
    } else {
      callback(null);
    }
  });
  
  return () => {
    off(gameStateRef);
    unsubscribe();
  };
}

/**
 * 獲取所有線上遊戲房間 Token
 */
export async function getAllGameTokens(): Promise<string[]> {
  const gamesRef = ref(database, 'games');
  const snapshot = await get(gamesRef);
  
  if (!snapshot.exists()) {
    return [];
  }
  
  const tokens = Object.keys(snapshot.val());
  // console.log('所有遊戲房間 Token:', tokens);
  return tokens;
}

/**
 * 清空所有線上遊戲房間
 */
export async function clearAllGameRooms(): Promise<void> { 
  const gamesRef = ref(database, 'games');
  const snapshot = await get(gamesRef);
  
  if (!snapshot.exists()) {
    return;
  }
  
  const tokens = Object.keys(snapshot.val());
  
  await Promise.all(
    tokens.map((token) => set(ref(database, `games/${token}`), null))
  );
}


