import { resolve } from "node:path";

import {
    formatHotRunSummary,
    runHotSuite
} from "@af-utils/check-hot";

const inspect = process.argv.includes("--inspect");
const full = process.argv.includes("--full");
const bun = process.argv.includes("--bun");
const manualSummary = await runHotSuite({
    suite: resolve(import.meta.dirname, "../../.jit/suite.mjs"),
    ...(full
        ? {
              runtimes: ["node", "deno"],
              v8Tiers: ["maglev", "turbofan"],
              modes: ["combined", "isolated"],
              repetitions: 2
          }
        : bun
          ? {
                runtimes: ["bun"],
                modes: ["combined", "isolated"],
                repetitions: 2
            }
          : {}),
    inspect,
    verbose: inspect
});
console.log(formatHotRunSummary(manualSummary, { verbose: inspect }));

// Exact AST offsets currently rely on Node Inspector. Deno/Bun still run the
// broad manual suite above, while this second suite must close a non-empty AST
// ledger against the exact minified JavaScript artifact executed by Node.
const astSummary = await runHotSuite({
    suite: resolve(import.meta.dirname, "ast-suite.mjs"),
    runtimes: ["node"],
    v8Tiers: ["turbofan"],
    modes: ["combined"],
    repetitions: 1,
    inspect,
    verbose: inspect
});
console.log(formatHotRunSummary(astSummary, { verbose: inspect }));

if (!manualSummary.passed || !astSummary.passed) process.exitCode = 1;
