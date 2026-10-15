import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    globals: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      include: [
        "src/utils/**/*.ts",
        "src/lib/**/*.ts",
        "src/services/**/*.ts",
        "src/hooks/**/*.ts",
      ],
      exclude: [
        "src/**/*.test.ts",
        "src/test/**",
        "src/lib/workspace/store.ts",
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
});
