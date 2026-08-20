import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Resolves the "@/*" -> "./src/*" aliases from tsconfig.json.
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    // Server code (lib, actions) runs in node. Client components opt into a DOM
    // per file with a `// @vitest-environment happy-dom` comment.
    environment: "node",
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: ["src/lib/**", "src/components/**"],
      // Generated Prisma client and the tests themselves carry no logic of ours.
      exclude: ["src/generated/**", "**/*.test.*"],
      // Only the business logic is gated. Components are reported so gaps stay
      // visible, but most are markup and are covered by the build instead.
      thresholds: {
        "src/lib/**": { statements: 85, branches: 85, functions: 85, lines: 85 },
      },
    },
  },
});
