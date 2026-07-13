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
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
