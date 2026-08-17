import { describe, expect, test } from "vitest";

import { mergeStarExportSurface } from "../../src/analyzer/export-star-resolution.js";
import type {
    ExportOrigin,
    LocalExportOrigin
} from "../../src/analyzer/export-star-resolution.js";

const local = (
    file: string,
    localName = "value",
    start = 1,
    end = 2
): LocalExportOrigin => ({ kind: "local", file, localName, start, end });

describe("ESM star-export resolution", () => {
    test("retains one binding reached through multiple paths", () => {
        const binding = local("source.js");
        const surface = new Map<string, ExportOrigin>([["value", binding]]);
        const ambiguous = new Set<string>();

        mergeStarExportSurface(
            surface,
            new Map([["value", { ...binding }]]),
            new Set(),
            ambiguous
        );

        expect(surface).toEqual(new Map([["value", binding]]));
        expect(ambiguous).toEqual(new Set());
    });

    test.each([
        local("other.js"),
        local("source.js", "other"),
        local("source.js", "value", 0),
        local("source.js", "value", 1, 3),
        { kind: "namespace", file: "source.js" } as const
    ])("drops conflicting origin %#", conflicting => {
        const surface = new Map<string, ExportOrigin>([
            ["value", local("source.js")]
        ]);
        const ambiguous = new Set<string>();

        mergeStarExportSurface(
            surface,
            new Map([["value", conflicting]]),
            new Set(),
            ambiguous
        );

        expect(surface.has("value")).toBe(false);
        expect(ambiguous).toEqual(new Set(["value"]));
    });

    test("keeps identical namespace bindings and rejects different namespaces", () => {
        const namespace = { kind: "namespace", file: "source.js" } as const;
        const surface = new Map<string, ExportOrigin>([
            ["namespace", namespace]
        ]);
        const ambiguous = new Set<string>();

        mergeStarExportSurface(
            surface,
            new Map([["namespace", { ...namespace }]]),
            new Set(),
            ambiguous
        );

        expect(surface).toEqual(new Map([["namespace", namespace]]));
        expect(ambiguous).toEqual(new Set());

        mergeStarExportSurface(
            surface,
            new Map([["namespace", { kind: "namespace", file: "other.js" }]]),
            new Set(),
            ambiguous
        );

        expect(surface.has("namespace")).toBe(false);
        expect(ambiguous).toEqual(new Set(["namespace"]));
    });

    test("rejects a local binding contributed over an existing namespace", () => {
        const surface = new Map<string, ExportOrigin>([
            ["value", { kind: "namespace", file: "source.js" }]
        ]);
        const ambiguous = new Set<string>();

        mergeStarExportSurface(
            surface,
            new Map([["value", local("source.js")]]),
            new Set(),
            ambiguous
        );

        expect(surface.has("value")).toBe(false);
        expect(ambiguous).toEqual(new Set(["value"]));
    });

    test("adds new names but never contributes default, explicit, or already ambiguous names", () => {
        const explicit = local("explicit.js");
        const surface = new Map<string, ExportOrigin>([["explicit", explicit]]);
        const ambiguous = new Set(["ambiguous"]);

        mergeStarExportSurface(
            surface,
            new Map([
                ["added", local("added.js")],
                ["default", local("default.js")],
                ["explicit", local("replacement.js")],
                ["ambiguous", local("restored.js")]
            ]),
            new Set(["explicit"]),
            ambiguous
        );

        expect(surface).toEqual(
            new Map([
                ["explicit", explicit],
                ["added", local("added.js")]
            ])
        );
        expect(ambiguous).toEqual(new Set(["ambiguous"]));
    });
});
