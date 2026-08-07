import path from "node:path";
import { defineConfig } from "vitest/config";

// Unit tests exist for exactly one thing: calculator arithmetic (03 §14.9).
// A wrong number is the single defect that collapses the correctness positioning
// this whole section is built on, so the math is tested and nothing else is.
// No jsdom, no React testing library, no coverage tooling — `calc.ts` files are
// pure functions with zero React imports, and that is enforced by review.
export default defineConfig({
  test: {
    environment: "node",
    include: ["components/learn/alat/**/*.test.ts", "tests/unit/**/*.test.ts"],
  },
  resolve: {
    // Mirrors the `@/*` path alias in tsconfig.json. Without this the test
    // imports resolve at type-check time but fail at run time.
    alias: { "@": path.resolve(__dirname, ".") },
  },
});
