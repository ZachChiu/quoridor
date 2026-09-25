import { defineConfig } from 'vitest/config';

export default defineConfig({
  // 原生解析 tsconfig 的 `@/*` → `app/*` 別名（無需 vite-tsconfig-paths）
  resolve: { tsconfigPaths: true },
  test: {
    environment: 'node',
    // 測試集中在 tests/，不與原始碼混放 —— app/ 底下只留會被打包的東西。
    // 目錄結構對應 app/：tests/game 對 app/game、tests/components 對 app/components。
    include: ['tests/**/*.test.ts'],
  },
});
