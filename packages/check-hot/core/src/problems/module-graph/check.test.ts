import { describe, expect, test } from "vitest";

import { checkModuleGraph } from "./check.js";

describe("module graph problem", () => {
    test("reports incomplete analysis with retained diagnostics", () => {
        expect(checkModuleGraph(false, ["dynamic import"])).toEqual({
            problemId: "analysis-module-graph-incomplete",
            message: "The runtime module graph is incomplete (1 diagnostic(s))",
            detail: "dynamic import"
        });
    });

    test("accepts a complete graph", () => {
        expect(checkModuleGraph(true, [])).toBeUndefined();
    });
});
