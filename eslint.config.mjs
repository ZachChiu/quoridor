import { FlatCompat } from "@eslint/eslintrc";
import tailwind from "eslint-plugin-tailwindcss";

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
});

const eslintConfig = [
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
