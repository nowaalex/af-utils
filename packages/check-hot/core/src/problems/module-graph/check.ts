import type { HotProblemOccurrence } from "../types.js";

/** Report an incomplete graph without pretending its diagnostics are findings. */
export const checkModuleGraph = (
    complete: boolean,
    diagnostics: readonly string[]
): HotProblemOccurrence | undefined =>
    complete
        ? undefined
        : {
              problemId: "analysis-module-graph-incomplete",
              message: `The runtime module graph is incomplete (${diagnostics.length} diagnostic(s))`,
              detail: diagnostics.join("\n")
          };
