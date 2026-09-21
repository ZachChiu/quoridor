import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import tailwind from "eslint-plugin-tailwindcss";

// Next 16 起 eslint-config-next 直接匯出 flat config，不再需要 FlatCompat。
// 另外 `next lint` 已移除，改由 `eslint .` 執行，因此要自行宣告忽略路徑。
const eslintConfig = [
  {
    ignores: [
      "out/**",
      ".next/**",
      "node_modules/**",
      "next-env.d.ts",
      "public/**",
      // CloudFront Function 的進入點由 AWS 呼叫，不是這個專案的模組
      'infra/**',
    ],
  },
  ...nextCoreWebVitals,
  ...nextTypescript,
  ...tailwind.configs["flat/recommended"],
  {
    rules: {
      "tailwindcss/no-custom-classname": "off",
    },
  },
];

export default eslintConfig;
