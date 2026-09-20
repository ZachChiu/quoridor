import { defineConfig } from 'vitest/config';

export default defineConfig({
  // 原生解析 tsconfig 的 `@/*` → `app/*` 別名（無需 vite-tsconfig-paths）
  resolve: { tsconfigPaths: true },
  test: {
    environment: 'node',
    include: ['app/**/*.test.ts'],
  },
});
