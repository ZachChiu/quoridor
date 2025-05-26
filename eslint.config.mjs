import { FlatCompat } from "@eslint/eslintrc";
import tailwind from "eslint-plugin-tailwindcss";

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
});

const eslintConfig = [
  ...tailwind.configs["flat/recommended"],
  ...compat.config({
    extends: ['next', 'prettier'],
  }),
  {  
    rules: {
      'tailwindcss/no-custom-classname': 'off',
    },
  }
];

export default eslintConfig;
