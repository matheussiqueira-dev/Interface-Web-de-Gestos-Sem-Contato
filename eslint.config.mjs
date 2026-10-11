import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = [
  ...nextCoreWebVitals,
  {
    rules: {
      "react/no-unescaped-entities": "off",
    },
  },
  {
    ignores: [
      "coverage/**",
      "server/**",
      "vite.config.ts",
      "vitest.config.ts",
      "src/App.tsx",
      "src/main.tsx",
      "src/domain/**",
      "src/features/**",
      "src/shared/**",
      "src/test/**",
      "src/components/*.tsx",
    ],
  },
];

export default eslintConfig;
