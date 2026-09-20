import { FlatCompat } from "@eslint/eslintrc";
import tailwind from "eslint-plugin-tailwindcss";

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
});

const eslintConfig = [
  // out/ 是 next build 的靜態產物（含壓縮過的 chunk），不該被 lint —— 
  // 沒有這行，build 之後跑 npm run lint 會噴上萬個來自建置產物的錯誤。
  { ignores: ["out/**", ".next/**"] },
  ...compat.config({
    extends: ['next/core-web-vitals', 'next/typescript'],
  }),
  ...tailwind.configs["flat/recommended"],
  {  
    rules: {
      'tailwindcss/no-custom-classname': 'off',
    },
  }
];

export default eslintConfig;
