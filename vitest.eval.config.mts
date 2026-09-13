import { defineConfig, mergeConfig } from "vitest/config";

import base from "./vitest.config.mts";

/**
 * Evals are not tests. They call a real model, cost money, take seconds each, and can
 * fail for reasons no commit caused — so they are kept out of `pnpm test` by the file
 * name alone and run deliberately with `pnpm eval`.
 */
export default mergeConfig(
  base,
  defineConfig({
    test: {
      environment: "node",
      include: ["src/**/*.eval.ts"],
      testTimeout: 180_000,
      // One at a time: the point is to measure the model, not to find its rate limit.
      fileParallelism: false,
    },
  }),
);
