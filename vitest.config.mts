import { defineConfig } from "vitest/config";
import * as path from "path";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    pool: "threads",
    include: ["src/__tests__/**/*.test.{ts,tsx}"],
    setupFiles: ["src/test-setup.ts"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/__tests__/**", "src/main.tsx"],
      thresholds: {
        lines: 60,
        branches: 50,
        functions: 60,
        statements: 60,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
