import { describe, expect, test } from "vitest";

import type { HotV8CodeCreationLocation } from "../../types.js";

import { checkV8IcMapDiagnostics } from "./check.js";
import {
    hasV8SourceOwner,
    inspectV8LogVersion,
    iterateV8LogLines,
    normalizeV8SourceFile,
    parseV8IcMapLog as parseRawV8IcMapLog,
    parseV8NumericField,
    parseV8SourceLocation,
    supportsV8CodeCreationLocation,
    supportsV8LogLayout
} from "./parse.js";

const testEngineVersion = "14.6.202.34-node.28";
const testVersionHeader = "v8-version,14,6,202,34,-node.28,0";

const parseV8IcMapLog: typeof parseRawV8IcMapLog = (
    raw,
    engineVersion,
    streamId,
    targets
) => {
    const versionedRaw = raw.startsWith("v8-version,")
        ? raw
        : `${testVersionHeader}\n${raw}`;
    return parseRawV8IcMapLog(
        versionedRaw,
        engineVersion === "99.0" ? "99.0.0.0" : testEngineVersion,
        streamId,
        targets
    );
};

const target = (targetId = "target:hot", functionName = "hot") => [
    { targetId, functionName }
];
const runtimeLocation = (line: number, column: number) => ({
    schemaVersion: 1 as const,
    sourceSha256: "a".repeat(64),
    line,
    column,
    anchor: "parameter-list-start" as const,
    syntaxKind: "FunctionExpression" as const,
    async: false,
    generator: false,
    static: false,
    computed: false
});

describe("V8 IC/Map graph parser", () => {
    test("iterates empty, terminated, unterminated, and CRLF log lines exactly", () => {
        expect([...iterateV8LogLines("")]).toEqual([""]);
        expect([...iterateV8LogLines("\n")]).toEqual(["", ""]);
        expect([...iterateV8LogLines("\r\n")]).toEqual(["", ""]);
        expect([...iterateV8LogLines("one")]).toEqual(["one"]);
        expect([...iterateV8LogLines("one\n")]).toEqual(["one", ""]);
        expect([...iterateV8LogLines("one\r\ntwo\nthree")]).toEqual([
            "one",
            "two",
            "three"
        ]);
    });

    test("parses numeric fields without accepting missing or non-finite values", () => {
        expect(parseV8NumericField()).toBeUndefined();
        expect(parseV8NumericField("")).toBeUndefined();
        expect(parseV8NumericField("0")).toBe(0);
        expect(parseV8NumericField("-1.25")).toBe(-1.25);
        expect(parseV8NumericField("Infinity")).toBeUndefined();
        expect(parseV8NumericField("not-a-number")).toBeUndefined();
    });

    test("normalizes source locators and requires a complete owner descriptor", () => {
        expect(normalizeV8SourceFile("C:\\project\\file.js")).toBe(
            "C:/project/file.js"
        );
        expect(normalizeV8SourceFile("file:///tmp/a%20b.js")).toBe(
            "/tmp/a b.js"
        );
        expect(normalizeV8SourceFile("file:///C:%5Cproject%5Cfile.js")).toBe(
            "/C:/project/file.js"
        );
        expect(normalizeV8SourceFile("file:%zz\\bad")).toBe("file:%zz/bad");
        expect(
            parseV8SourceLocation("hot file:///tmp/lib.js:12:34,metadata")
        ).toEqual({ prefix: "hot file:///tmp/lib.js", line: 12, column: 34 });
        expect(parseV8SourceLocation("hot:1:2 nested.js:3:4")).toEqual({
            prefix: "hot:1:2 nested.js",
            line: 3,
            column: 4
        });
        expect(parseV8SourceLocation("no location")).toBeUndefined();
        expect(parseV8SourceLocation("file.js:1:2junk")).toBeUndefined();
        expect(parseV8SourceLocation("file.js:1:2x,metadata")).toBeUndefined();
        expect(
            hasV8SourceOwner({
                targetId: "id",
                functionName: "hot",
                sourceFile: "/tmp/a.js",
                runtimeLocation: runtimeLocation(1, 1)
            })
        ).toBe(true);
        for (const partial of [
            { sourceFile: "/tmp/a.js" },
            { runtimeLocation: runtimeLocation(1, 2) },
            {
                sourceFile: "/tmp/a.js",
                runtimeLocation: runtimeLocation(0, 2)
            },
            {
                sourceFile: "/tmp/a.js",
                runtimeLocation: runtimeLocation(1, 0)
            },
            {}
        ]) {
            expect(
                hasV8SourceOwner({
                    targetId: "id",
                    functionName: "hot",
                    ...partial
                })
            ).toBe(false);
        }
    });

    test("gates code-creation syntax anchors by the controlled engine matrix", () => {
        expect(
            supportsV8CodeCreationLocation(
                testEngineVersion,
                runtimeLocation(1, 1)
            )
        ).toBe(true);
        expect(
            supportsV8CodeCreationLocation("99.0.0.0", runtimeLocation(1, 1))
        ).toBe(false);
        expect(
            supportsV8CodeCreationLocation(
                testEngineVersion,
                runtimeLocation(1, 1),
                "win32"
            )
        ).toBe(false);
        expect(
            supportsV8CodeCreationLocation(testEngineVersion, {
                ...runtimeLocation(1, 1),
                syntaxKind: "ArrowFunctionExpression",
                anchor: "parameter-start"
            })
        ).toBe(true);
        expect(
            supportsV8CodeCreationLocation(testEngineVersion, {
                ...runtimeLocation(1, 1),
                syntaxKind: "ArrowFunctionExpression",
                anchor: "async-keyword-start",
                async: true
            })
        ).toBe(true);
        expect(
            supportsV8CodeCreationLocation(testEngineVersion, {
                ...runtimeLocation(1, 1),
                syntaxKind: "ClassMethod",
                static: true
            })
        ).toBe(true);
        expect(
            supportsV8CodeCreationLocation(testEngineVersion, {
                ...runtimeLocation(1, 1),
                syntaxKind: "ObjectMethod",
                computed: true
            })
        ).toBe(true);
        for (const unsupported of [
            { schemaVersion: 2 },
            { sourceSha256: "not-a-sha" },
            { sourceSha256: `${"a".repeat(64)}a` },
            { sourceSha256: `!${"a".repeat(64)}` },
            { line: 0 },
            { line: 1.5 },
            { column: 0 },
            { column: 1.5 },
            { syntaxKind: "FunctionExpression", anchor: "parameter-start" },
            { syntaxKind: "ArrowFunctionExpression", generator: true },
            {
                syntaxKind: "ArrowFunctionExpression",
                anchor: "parameter-start",
                async: true
            },
            { syntaxKind: "ObjectGetter", async: true },
            { syntaxKind: "ClassSetter", generator: true },
            { syntaxKind: "ObjectGetter", computed: true },
            { syntaxKind: "ClassMethod", static: true, computed: true }
        ] as const) {
            expect(
                supportsV8CodeCreationLocation(testEngineVersion, {
                    ...runtimeLocation(1, 1),
                    ...unsupported
                } as unknown as HotV8CodeCreationLocation)
            ).toBe(false);
        }
    });

    test("keeps unsupported source locators explicit beside supported targets", () => {
        const result = parseV8IcMapLog(
            [
                "code-creation,JS,1,2,0x1000,8,supported",
                "code-creation,JS,1,2,0x2000,8,unsupported /workspace/a.js:3:4",
                "LoadIC,0x1001,1,1,1,0,P,0xaaa,x,,",
                "LoadIC,0x2001,1,3,4,0,N,0xbbb,y,,"
            ].join("\n"),
            "13.0",
            "stream",
            [
                { targetId: "supported", functionName: "supported" },
                {
                    targetId: "unsupported",
                    functionName: "unsupported",
                    sourceFile: "/workspace/a.js",
                    runtimeLocation: {
                        ...runtimeLocation(3, 4),
                        syntaxKind: "FunctionExpression",
                        anchor: "parameter-start"
                    }
                }
            ]
        );

        expect(result.graph.inlineCaches.map(item => item.targetId)).toEqual([
            "supported"
        ]);
        expect(result.targetScope.unmatchedTargetIds).toEqual(["unsupported"]);
        expect(result.gap).toContain(
            "AST/V8 code-creation locator compatibility matrix did not cover: unsupported"
        );
    });

    test("authenticates the exact V8 header including build suffix", () => {
        expect(
            inspectV8LogVersion(
                "v8-version,14,6,202,34,-node.28,0\nother",
                "14.6.202.34-node.28"
            )
        ).toEqual({ observed: "14.6.202.34-node.28" });
        expect(inspectV8LogVersion("other", "14.6.0.0")).toEqual({
            gap: "The V8 log has no v8-version header for runtime 14.6.0.0."
        });
        expect(
            inspectV8LogVersion(
                "v8-version,14,6,0,0\nv8-version,14,6,0,0",
                "14.6.0.0"
            )
        ).toEqual({ gap: "The V8 log has 2 version headers." });
        expect(
            inspectV8LogVersion("v8-version,14,,6,0", "14.6.0.0").gap
        ).toContain("malformed");
        for (const malformed of [
            "v8-version,14,6,0",
            "v8-version,14x,6,0,0",
            "v8-version,x14,6,0,0",
            "prefix-v8-version,14,6,0,0"
        ]) {
            const inspected = inspectV8LogVersion(malformed, "14.6.0.0");
            expect(inspected.observed).toBeUndefined();
            expect(inspected.gap).toMatch(/(?:malformed|no v8-version)/u);
        }
        expect(inspectV8LogVersion("v8-version,14,6,0,0", "14.7.0.0")).toEqual({
            observed: "14.6.0.0",
            gap: "V8 log version 14.6.0.0 does not match runtime engine 14.7.0.0."
        });
        expect(
            inspectV8LogVersion("v8-version,14,6,0,0,0", "14.6.0.0")
        ).toEqual({ observed: "14.6.0.0" });
        expect(supportsV8LogLayout("14.6.202.34-node.28")).toBe(true);
        expect(supportsV8LogLayout("15.0.245.2-rusty")).toBe(true);
        expect(supportsV8LogLayout("11.3.244.8-node.30")).toBe(true);
        expect(supportsV8LogLayout("13.6.233.17-node.37")).toBe(true);
        expect(supportsV8LogLayout("13.6.233.17-node.37", "win32")).toBe(false);
        expect(supportsV8LogLayout("11.3.244.8-node.")).toBe(false);
        expect(supportsV8LogLayout("11.3.244.8-node.future")).toBe(false);
        expect(supportsV8LogLayout("13.6.233.17-node.37-extra")).toBe(false);
        expect(supportsV8LogLayout("11.3.244.9-node.30")).toBe(false);
        expect(supportsV8LogLayout("13.6.233.17-other.37")).toBe(false);
        expect(supportsV8LogLayout("14.6.202.35-node.28")).toBe(false);
        expect(supportsV8LogLayout("15.0.245.2")).toBe(false);
        expect(supportsV8LogLayout("future")).toBe(false);
    });
    test("normalizes only target-connected Maps and attributes each IC range", () => {
        const result = parseV8IcMapLog(
            [
                testVersionHeader,
                "map-details,10,0xaaa,0xaaa: [Map]\\n - elements kind: HOLEY_ELEMENTS\\n [0]: #x (const data field)",
                "map,Transition,11,0xaaa,0xbbb,0xsfi,1,2,,y",
                "map,Transition,11,0xnoise1,0xnoise2,0xsfi,1,2,,noise",
                "code-creation,JS,10,11,0x1000,16,hot file.js:1:1,0xsfi,~",
                "LoadIC,0x1005,12,4,8,1,P,0xbbb,x,,",
                "LoadIC,0x100a,13,4,8,P,N,0xccc,x,,",
                "LoadIC,0x2000,14,1,1,1,N,0xnoise2,noise,,"
            ].join("\n"),
            "13.0",
            "diagnostic:v8-ic-maps",
            target()
        );

        expect(result.targetScope).toEqual({
            requestedTargetIds: ["target:hot"],
            matchedTargetIds: ["target:hot"],
            unmatchedTargetIds: [],
            ambiguousTargetIds: []
        });
        expect(result.graph.maps).toEqual([
            {
                id: "map-1",
                elementsKind: undefined,
                properties: []
            },
            {
                id: "map-2",
                elementsKind: undefined,
                properties: []
            },
            {
                id: "map-3",
                elementsKind: "HOLEY_ELEMENTS",
                properties: ["x"]
            }
        ]);
        expect(result.graph.transitions).toEqual([
            { from: "map-3", to: "map-1", reason: "Transition", property: "y" }
        ]);
        expect(result.graph.inlineCaches).toEqual([
            {
                siteId: "LoadIC:0x1005:4:8",
                operation: "LoadIC",
                from: "1",
                to: "P",
                mapId: "map-1",
                key: "x",
                line: 4,
                column: 8,
                correlation: "name-only",
                targetId: "target:hot",
                functionName: "hot"
            },
            {
                siteId: "LoadIC:0x100a:4:8",
                operation: "LoadIC",
                from: "P",
                to: "N",
                mapId: "map-2",
                key: "x",
                line: 4,
                column: 8,
                correlation: "name-only",
                targetId: "target:hot",
                functionName: "hot"
            }
        ]);
        expect(result.events).toEqual([
            {
                sequence: 0,
                streamId: "diagnostic:v8-ic-maps",
                purpose: "diagnostic",
                phase: "diagnostic",
                kind: "inline-cache-transition",
                source: "v8-log",
                correlation: "name-only",
                targetId: "target:hot",
                functionName: "hot",
                engineTimestamp: 12,
                message: "LoadIC 1 -> P for x",
                detail: "LoadIC,0x1005,12,4,8,1,P,0xbbb,x,,"
            },
            {
                sequence: 1,
                streamId: "diagnostic:v8-ic-maps",
                purpose: "diagnostic",
                phase: "diagnostic",
                kind: "inline-cache-transition",
                source: "v8-log",
                correlation: "name-only",
                targetId: "target:hot",
                functionName: "hot",
                engineTimestamp: 13,
                message: "LoadIC P -> N for x",
                detail: "LoadIC,0x100a,13,4,8,P,N,0xccc,x,,"
            },
            {
                sequence: 2,
                streamId: "diagnostic:v8-ic-maps",
                purpose: "diagnostic",
                phase: "diagnostic",
                kind: "map-transition",
                source: "v8-log",
                correlation: "unavailable",
                message: "map-3 -> map-1 by y"
            }
        ]);
        expect(result.gap).toBeUndefined();
    });

    test("uses half-open code ranges and ignores malformed addresses", () => {
        const result = parseV8IcMapLog(
            [
                "code-creation,JS,10,11,0x1000,6,hot file.js:1:1",
                "StoreIC,0x1000,not-a-number,,,0,1,0xaaa,x,,",
                "KeyedLoadIC,0x1005,2,3,4,0,1,not-a-map,key,,",
                "LoadIC,0x1006,3,4,5,0,1,0xbbb,end,,",
                "LoadIC,garbage,3,4,5,0,1,0xccc,bad,,"
            ].join("\r\n"),
            "13.0",
            "stream",
            target()
        );

        expect(result.graph.inlineCaches).toHaveLength(2);
        expect(result.graph.inlineCaches.map(item => item.operation)).toEqual([
            "StoreIC",
            "KeyedLoadIC"
        ]);
        expect(result.graph.inlineCaches[0]?.line).toBeUndefined();
        expect(result.graph.inlineCaches[1]?.mapId).toBeUndefined();
        expect(result.events[0]?.engineTimestamp).toBeUndefined();
        expect(result.gap).toBeUndefined();
    });

    test("refuses normalized evidence from a missing or mismatched V8 header", () => {
        const body = [
            "code-creation,JS,10,11,0x1000,6,hot file.js:1:1",
            "LoadIC,0x1000,1,1,1,0,P,0xaaa,x,,"
        ].join("\n");
        const missing = parseRawV8IcMapLog(
            body,
            "13.0.0.0",
            "stream",
            target()
        );
        const mismatch = parseRawV8IcMapLog(
            `v8-version,12,9,0,0\n${body}`,
            "13.0.0.0",
            "stream",
            target()
        );

        expect(missing).toEqual({
            oracleVersion: "1",
            engineVersion: "13.0.0.0",
            events: [],
            graph: {
                maps: [],
                transitions: [],
                inlineCaches: []
            },
            targetScope: {
                requestedTargetIds: ["target:hot"],
                matchedTargetIds: [],
                unmatchedTargetIds: ["target:hot"],
                ambiguousTargetIds: []
            },
            gap: "The V8 log has no v8-version header for runtime 13.0.0.0."
        });
        expect(mismatch).toEqual({
            ...missing,
            gap: "V8 log version 12.9.0.0 does not match runtime engine 13.0.0.0."
        });
        expect(checkV8IcMapDiagnostics(missing)).toEqual([
            {
                problemId: "v8-ic-map-diagnostic-gap",
                message: missing.gap
            }
        ]);
    });

    test("uses a distinct default diagnostic stream for a successful parse", () => {
        const result = parseV8IcMapLog(
            [
                "code-creation,JS,1,2,0x1000,4,hot",
                "LoadIC,0x1000,2,3,4,0,1,0xabc,x,,"
            ].join("\n"),
            "13.0",
            undefined,
            target()
        );

        expect(result.oracleVersion).toBe("1");
        expect(result.events.map(event => event.streamId)).toEqual([
            "diagnostic:v8-ic-maps"
        ]);
    });

    test("recognizes every supported IC kind and rejects short/near-match records", () => {
        const operations = [
            "LoadIC",
            "StoreIC",
            "KeyedLoadIC",
            "KeyedStoreIC",
            "LoadGlobalIC",
            "StoreGlobalIC"
        ];
        const result = parseV8IcMapLog(
            [
                "code-creation,JS,10,11,0x1000,32,hot file.js:1:1",
                ...operations.map(
                    (operation, index) =>
                        `${operation},0x${(0x1000 + index).toString(16)},${index},${index + 1},${index + 2},0,1,0xabc,key${index},,`
                ),
                "CallIC,0x1008,8,1,2,0,1,0xabc,call,,",
                "LoadIC,0x1009,9,1,2,0,1",
                "LoadIC,0x100a,10,1,2,0,1,0x",
                "LoadIC,0x100b,11,1,2,0,1,0xabcjunk,bad,,"
            ].join("\n"),
            "13.0",
            "stream",
            target()
        );

        expect(result.graph.inlineCaches.map(item => item.operation)).toEqual([
            ...operations,
            "LoadIC",
            "LoadIC"
        ]);
        expect(
            result.graph.inlineCaches.slice(0, 6).map(item => item.key)
        ).toEqual(operations.map((_, index) => `key${index}`));
        expect(
            result.graph.inlineCaches
                .slice(0, 6)
                .every(item => item.mapId === "map-1")
        ).toBe(true);
        expect(
            result.graph.inlineCaches.slice(6).map(item => item.mapId)
        ).toEqual([undefined, undefined]);
    });

    test("retains explicit unknown IC fields without accepting embedded map addresses", () => {
        const rawIc = "LoadIC,0x1001,2,3,4,,,prefix0xabc,,,";
        const result = parseV8IcMapLog(
            ["code-creation,JS,1,2,0x1000,4,hot", rawIc].join("\n"),
            "13.0",
            "stream",
            target()
        );

        expect(result.graph.inlineCaches).toEqual([
            {
                siteId: "LoadIC:0x1001:3:4",
                operation: "LoadIC",
                from: "unknown",
                to: "unknown",
                mapId: undefined,
                key: undefined,
                line: 3,
                column: 4,
                correlation: "name-only",
                targetId: "target:hot",
                functionName: "hot"
            }
        ]);
        expect(result.events).toEqual([
            {
                sequence: 0,
                streamId: "stream",
                purpose: "diagnostic",
                phase: "diagnostic",
                kind: "inline-cache-transition",
                source: "v8-log",
                correlation: "name-only",
                targetId: "target:hot",
                functionName: "hot",
                engineTimestamp: 2,
                message: "LoadIC unknown -> unknown",
                detail: rawIc
            }
        ]);
        expect(result.graph.maps).toEqual([]);
    });

    test("matches exact, space, and comma function-name delimiters only", () => {
        const result = parseV8IcMapLog(
            [
                "code-creation,JS,1,2,0x1000,4,exact",
                "code-creation,JS,1,2,0x2000,4,spaced file.js:1:1",
                "code-creation,JS,1,2,0x3000,4,comma,metadata",
                "code-creation,JS,1,2,0x4000,4,prefixExtra file.js:1:1",
                "code-creation,OTHER,1,2,0x5000,4,wrongKind file.js:1:1",
                "other,JS,1,2,0x6000,4,wrongRecord file.js:1:1",
                "code-creation,JS,1,2,0x7000,0,zero file.js:1:1",
                "code-creation,JS,1,2,not-hex,4,malformed file.js:1:1",
                "LoadIC,0x1000,1,1,1,0,1,0xaaa,a,,",
                "LoadIC,0x2000,1,1,1,0,1,0xbbb,b,,",
                "LoadIC,0x3000,1,1,1,0,1,0xccc,c,,",
                "LoadIC,0x4000,1,1,1,0,1,0xddd,d,,",
                "LoadIC,0x5000,1,1,1,0,1,0xeee,e,,",
                "LoadIC,0x6000,1,1,1,0,1,0xfff,f,,",
                "LoadIC,0x7000,1,1,1,0,1,0x111,g,,"
            ].join("\n"),
            "13.0",
            "stream",
            [
                { targetId: "exact-id", functionName: "exact" },
                { targetId: "space-id", functionName: "spaced" },
                { targetId: "comma-id", functionName: "comma" },
                { targetId: "prefix-id", functionName: "prefix" },
                { targetId: "kind-id", functionName: "wrongKind" },
                { targetId: "record-id", functionName: "wrongRecord" },
                { targetId: "zero-id", functionName: "zero" },
                { targetId: "malformed-id", functionName: "malformed" }
            ]
        );

        expect(result.graph.inlineCaches.map(item => item.targetId)).toEqual([
            "exact-id",
            "space-id",
            "comma-id"
        ]);
        expect(result.targetScope.unmatchedTargetIds).toEqual([
            "prefix-id",
            "kind-id",
            "record-id",
            "zero-id",
            "malformed-id"
        ]);
    });

    test("keeps only target-connected transition edges and detailed Map data", () => {
        const result = parseV8IcMapLog(
            [
                "code-creation,JS,1,2,0x1000,4,hot file.js:1:1",
                "LoadIC,0x1000,1,1,1,0,1,0xbbb,value,,",
                "map,Transition,1,0xaaa,0xbbb,sfi,1,2,,value",
                "map,Transition,1,0xbbb,0xnoise,sfi,1,2,,outgoing",
                "not-map,Transition,1,0xnoise2,0xaaa,sfi",
                "map,Transition,1,0xshort",
                "map-details,1,0xaaa,Map - elements kind: PACKED_SMI_ELEMENTS #z (field) #a (field)",
                "map-details,1,0xbbb,Map - elements kind: HOLEY_DOUBLE_ELEMENTS #value (field)",
                "map-details,1,0xbbb,Map without an elements label #extra (field)",
                "map-details,1,0xnoise,Map - elements kind: DICTIONARY_ELEMENTS #noise (field)",
                "not-map-details,1,0xaaa,elements kind: BROKEN #bad (field)"
            ].join("\n"),
            "13.0",
            "stream",
            target()
        );

        expect(result.graph.transitions).toEqual([
            {
                from: "map-2",
                to: "map-1",
                reason: "Transition",
                property: "value"
            }
        ]);
        expect(result.graph.maps).toEqual([
            {
                id: "map-1",
                elementsKind: "HOLEY_DOUBLE_ELEMENTS",
                properties: ["extra", "value"]
            },
            {
                id: "map-2",
                elementsKind: "PACKED_SMI_ELEMENTS",
                properties: ["a", "z"]
            }
        ]);
        expect(result.events.at(-1)?.message).toBe("map-2 -> map-1 by value");
    });

    test("normalizes empty Map reason/property fields without fabricating detail", () => {
        const result = parseV8IcMapLog(
            [
                "code-creation,JS,1,2,0x1000,4,hot",
                "LoadIC,0x1000,1,1,1,0,1,0xbbb,value,,",
                "map,,1,0xaaa,0xbbb,sfi,"
            ].join("\n"),
            "13.0",
            "stream",
            target()
        );

        expect(result.graph.transitions).toEqual([
            {
                from: "map-2",
                to: "map-1",
                reason: "unknown",
                property: undefined
            }
        ]);
        expect(result.events.at(-1)).toEqual({
            sequence: 1,
            streamId: "stream",
            purpose: "diagnostic",
            phase: "diagnostic",
            kind: "map-transition",
            source: "v8-log",
            correlation: "unavailable",
            message: "map-2 -> map-1"
        });
    });

    test("reports partial target scope without assigning an absent target", () => {
        const result = parseV8IcMapLog(
            [
                "code-creation,JS,10,11,0x1000,8,first file.js:1:1",
                "LoadIC,0x1001,12,4,8,1,P,0xbbb,x,,"
            ].join("\n"),
            "13.0",
            "stream",
            [
                { targetId: "first-id", functionName: "first" },
                { targetId: "missing-id", functionName: "missing" }
            ]
        );

        expect(result.graph.inlineCaches[0]?.targetId).toBe("first-id");
        expect(result.targetScope.matchedTargetIds).toEqual(["first-id"]);
        expect(result.targetScope.unmatchedTargetIds).toEqual(["missing-id"]);
        expect(result.gap).toBe(
            "V8 target scoping was partial: unmatched=missing-id; ambiguous-name=none."
        );
    });

    test("refuses duplicate name-only target identities", () => {
        const result = parseV8IcMapLog(
            [
                "code-creation,JS,10,11,0x1000,8,same file.js:1:1",
                "LoadIC,0x1001,12,4,8,1,P,0xbbb,x,,"
            ].join("\n"),
            "13.0",
            "stream",
            [
                { targetId: "one", functionName: "same" },
                { targetId: "two", functionName: "same" }
            ]
        );

        expect(result).toEqual({
            oracleVersion: "1",
            engineVersion: testEngineVersion,
            events: [],
            graph: { maps: [], transitions: [], inlineCaches: [] },
            targetScope: {
                requestedTargetIds: ["one", "two"],
                matchedTargetIds: [],
                unmatchedTargetIds: [],
                ambiguousTargetIds: ["one", "two"]
            },
            gap: "No unique runtime target identity was available, so the process-global V8 log was not attributed to inspected code."
        });
    });

    test("scopes an anonymous target by an authenticated untransformed owner line", () => {
        const result = parseV8IcMapLog(
            [
                testVersionHeader,
                "code-creation,JS,10,11,0x1000,8, file:///workspace/lib.js:20:4",
                "code-creation,JS,10,11,0x2000,8, file:///workspace/lib.js:40:4",
                "LoadIC,0x1001,12,20,4,1,P,0xbbb,x,,",
                "LoadIC,0x2001,13,40,4,1,N,0xccc,noise,,"
            ].join("\n"),
            "13.0",
            "stream",
            [
                {
                    targetId: "anonymous-export",
                    functionName: "",
                    sourceFile: "/workspace/lib.js",
                    runtimeLocation: runtimeLocation(20, 4)
                }
            ]
        );

        expect(result.targetScope.matchedTargetIds).toEqual([
            "anonymous-export"
        ]);
        expect(result.graph.inlineCaches).toHaveLength(1);
        expect(result.graph.inlineCaches[0]).toMatchObject({
            key: "x",
            targetId: "anonymous-export",
            correlation: "target"
        });
        expect(result.gap).toBeUndefined();
    });

    test("treats a source owner as authoritative over an unrelated same name", () => {
        const result = parseV8IcMapLog(
            [
                "code-creation,JS,10,11,0x1000,8,hot file:///wrong.js:20:4",
                "LoadIC,0x1001,12,20,4,1,P,0xbbb,x,,"
            ].join("\n"),
            "13.0",
            "stream",
            [
                {
                    targetId: "hot-id",
                    functionName: "hot",
                    sourceFile: "/workspace/lib.js",
                    runtimeLocation: runtimeLocation(20, 4)
                }
            ]
        );

        expect(result.graph.inlineCaches).toEqual([]);
        expect(result.targetScope.unmatchedTargetIds).toEqual(["hot-id"]);
        expect(result.gap).toBe(
            "The V8 log contained no recognized target-scoped Map or inline-cache records; preserve the raw artifact and update the versioned parser. V8 target scoping was partial: unmatched=hot-id; ambiguous-name=none."
        );
    });

    test("does not fall back to a unique name when a source owner has no log location", () => {
        const result = parseV8IcMapLog(
            [
                "code-creation,JS,10,11,0x1000,8,hot",
                "LoadIC,0x1001,12,20,4,1,P,0xbbb,x,,"
            ].join("\n"),
            "13.0",
            "stream",
            [
                {
                    targetId: "hot-id",
                    functionName: "hot",
                    sourceFile: "/workspace/lib.js",
                    runtimeLocation: runtimeLocation(20, 4)
                }
            ]
        );

        expect(result.graph.inlineCaches).toEqual([]);
        expect(result.targetScope).toEqual({
            requestedTargetIds: ["hot-id"],
            matchedTargetIds: [],
            unmatchedTargetIds: ["hot-id"],
            ambiguousTargetIds: []
        });
    });

    test("refuses overlapping source owners instead of selecting the first", () => {
        const result = parseV8IcMapLog(
            [
                "code-creation,JS,10,11,0x1000,8,same file:///workspace/lib.js:20:4",
                "LoadIC,0x1001,12,20,4,1,P,0xbbb,x,,"
            ].join("\n"),
            "13.0",
            "stream",
            [
                {
                    targetId: "one",
                    functionName: "same",
                    sourceFile: "/workspace/lib.js",
                    runtimeLocation: runtimeLocation(20, 4)
                },
                {
                    targetId: "two",
                    functionName: "same",
                    sourceFile: "/workspace/lib.js",
                    runtimeLocation: runtimeLocation(20, 4)
                }
            ]
        );

        expect(result.graph.inlineCaches).toEqual([]);
        expect(result.targetScope.matchedTargetIds).toEqual([]);
        expect(result.targetScope.unmatchedTargetIds).toEqual(["one", "two"]);
        expect(result.gap).toBe(
            "The V8 log contained no recognized target-scoped Map or inline-cache records; preserve the raw artifact and update the versioned parser. V8 target scoping was partial: unmatched=one,two; ambiguous-name=none."
        );
    });

    test("separates duplicate function names with distinct source owners", () => {
        const result = parseV8IcMapLog(
            [
                "code-creation,JS,10,11,0x1000,8,same /workspace/a.js:2:1",
                "code-creation,JS,10,11,0x2000,8,same /workspace/b.js:8:1",
                "LoadIC,0x1001,12,2,1,1,P,0xaaa,a,,",
                "LoadIC,0x2001,13,8,1,1,N,0xbbb,b,,"
            ].join("\n"),
            "13.0",
            "stream",
            [
                {
                    targetId: "a",
                    functionName: "same",
                    sourceFile: "/workspace/a.js",
                    runtimeLocation: runtimeLocation(2, 1)
                },
                {
                    targetId: "b",
                    functionName: "same",
                    sourceFile: "/workspace/b.js",
                    runtimeLocation: runtimeLocation(8, 1)
                }
            ]
        );

        expect(result.graph.inlineCaches.map(item => item.targetId)).toEqual([
            "a",
            "b"
        ]);
        expect(
            result.graph.inlineCaches.every(
                item => item.correlation === "target"
            )
        ).toBe(true);
        expect(result.targetScope.ambiguousTargetIds).toEqual([]);
    });

    test("keeps an exact source owner when its duplicate name-only target is ambiguous", () => {
        const result = parseV8IcMapLog(
            [
                "code-creation,JS,1,2,0x1000,4,same /workspace/a.js:2:1",
                "LoadIC,0x1000,1,2,1,0,P,0xaaa,a,,"
            ].join("\n"),
            "13.0",
            "stream",
            [
                {
                    targetId: "owned",
                    functionName: "same",
                    sourceFile: "/workspace/a.js",
                    runtimeLocation: runtimeLocation(2, 1)
                },
                { targetId: "ambiguous", functionName: "same" }
            ]
        );

        expect(result.targetScope).toEqual({
            requestedTargetIds: ["owned", "ambiguous"],
            matchedTargetIds: ["owned"],
            unmatchedTargetIds: [],
            ambiguousTargetIds: ["ambiguous"]
        });
        expect(result.graph.inlineCaches[0]?.targetId).toBe("owned");
        expect(result.gap).toBe(
            "V8 target scoping was partial: unmatched=none; ambiguous-name=ambiguous."
        );
    });

    test("refuses an IC program counter shared by different target ranges", () => {
        const result = parseV8IcMapLog(
            [
                "code-creation,JS,1,2,0x1000,8,first",
                "code-creation,JS,1,2,0x1000,8,second",
                "LoadIC,0x1001,1,1,1,0,P,0xaaa,x,,"
            ].join("\n"),
            "13.0",
            "stream",
            [
                { targetId: "first-id", functionName: "first" },
                { targetId: "second-id", functionName: "second" }
            ]
        );

        expect(result.targetScope).toEqual({
            requestedTargetIds: ["first-id", "second-id"],
            matchedTargetIds: ["first-id", "second-id"],
            unmatchedTargetIds: [],
            ambiguousTargetIds: []
        });
        expect(result.graph.inlineCaches).toEqual([]);
        expect(result.gap).toBe(
            "The V8 log contained no recognized target-scoped Map or inline-cache records; preserve the raw artifact and update the versioned parser."
        );
    });

    test("reports an advisory parser gap for an unknown format", () => {
        const result = parseV8IcMapLog(
            "code-creation,JS,10,11,0x1000,16,hot file.js:1:1\nfuture-v8-record",
            "13.0",
            "stream",
            target()
        );
        expect(result.gap).toBe(
            "The V8 log contained no recognized target-scoped Map or inline-cache records; preserve the raw artifact and update the versioned parser."
        );
        expect(result.graph.maps).toEqual([]);
        expect(result.targetScope.matchedTargetIds).toEqual(["target:hot"]);
    });

    test("refuses deceptively current records from an unchecked future V8 layout", () => {
        const result = parseRawV8IcMapLog(
            [
                "v8-version,99,0,0,0",
                "code-creation,JS,10,11,0x1000,16,hot file.js:1:1",
                "LoadIC,0x1001,12,1,1,1,P,0xbbb,x,,"
            ].join("\n"),
            "99.0.0.0",
            "stream",
            target()
        );

        expect(result).toEqual({
            oracleVersion: "1",
            engineVersion: "99.0.0.0",
            events: [],
            graph: { maps: [], transitions: [], inlineCaches: [] },
            targetScope: {
                requestedTargetIds: ["target:hot"],
                matchedTargetIds: [],
                unmatchedTargetIds: ["target:hot"],
                ambiguousTargetIds: []
            },
            gap: `V8 log layout 99.0.0.0 on ${process.platform} is not in the tightly scoped checked compatibility registry (11.3.244.8-node.<numeric build> on linux via ci-node-20.19-runtime-workers, 13.6.233.17-node.<numeric build> on linux via ci-node-24.19-runtime-workers, 14.6.202.34-node.28 on linux via node-26.7.0-runtime-workers, 15.0.245.2-rusty on linux via deno-2.9.5-runtime-workers); raw evidence was retained without normalization.`
        });
        expect(checkV8IcMapDiagnostics(result)).toEqual([
            expect.objectContaining({ problemId: "v8-ic-map-diagnostic-gap" })
        ]);
    });

    test("refuses a checked engine fingerprint on an unchecked platform", () => {
        const result = parseRawV8IcMapLog(
            [
                testVersionHeader,
                "code-creation,JS,10,11,0x1000,16,hot",
                "LoadIC,0x1001,12,1,1,1,P,0xbbb,x,,"
            ].join("\n"),
            testEngineVersion,
            "stream",
            target(),
            "win32"
        );

        expect(result.graph).toEqual({
            maps: [],
            transitions: [],
            inlineCaches: []
        });
        expect(result.targetScope.unmatchedTargetIds).toEqual(["target:hot"]);
        expect(result.gap).toContain(
            `V8 log layout ${testEngineVersion} on win32 is not in the tightly scoped checked compatibility registry`
        );
    });

    test("requires exact source path and function-definition start coordinates", () => {
        const result = parseV8IcMapLog(
            [
                "code-creation,JS,10,11,0x1000,8, /workspace/a.js:1:1",
                "code-creation,JS,10,11,0x2000,8,inner /workspace/a.js:5:1",
                "code-creation,JS,10,11,0x3000,8, /evil/workspace/a.js:1:1",
                "code-creation,JS,10,11,0x4000,8, /workspace/a.js:1:2",
                "LoadIC,0x1001,12,1,1,1,P,0xaaa,outer,,",
                "LoadIC,0x2001,13,5,1,1,N,0xbbb,nested,,",
                "LoadIC,0x3001,14,1,1,1,N,0xccc,suffix,,",
                "LoadIC,0x4001,15,1,2,1,N,0xddd,column,,"
            ].join("\n"),
            "13.0",
            "stream",
            [
                {
                    targetId: "outer",
                    functionName: "",
                    sourceFile: "/workspace/a.js",
                    runtimeLocation: runtimeLocation(1, 1)
                }
            ]
        );

        expect(result.targetScope.matchedTargetIds).toEqual(["outer"]);
        expect(result.graph.inlineCaches).toHaveLength(1);
        expect(result.graph.inlineCaches[0]).toMatchObject({
            targetId: "outer",
            key: "outer",
            correlation: "target"
        });
    });

    test("matches a package-relative authenticated source locator exactly", () => {
        const result = parseV8IcMapLog(
            [
                "code-creation,JS,1,2,0x1000,4,hot src/a.js:3:2",
                "code-creation,JS,1,2,0x2000,4,hot prefix-src/a.js:3:2",
                "LoadIC,0x1000,1,3,2,0,P,0xaaa,yes,,",
                "LoadIC,0x2000,1,3,2,0,N,0xbbb,no,,"
            ].join("\n"),
            "13.0",
            "stream",
            [
                {
                    targetId: "relative",
                    functionName: "hot",
                    sourceFile: "src/a.js",
                    runtimeLocation: runtimeLocation(3, 2)
                }
            ]
        );

        expect(result.graph.inlineCaches.map(item => item.key)).toEqual([
            "yes"
        ]);
        expect(result.targetScope.matchedTargetIds).toEqual(["relative"]);
    });

    test("distinguishes exact absolute paths from unsupported relative file URLs", () => {
        const exact = parseV8IcMapLog(
            [
                "code-creation,JS,1,2,0x1000,4,/workspace/a.js:3:2",
                "LoadIC,0x1000,1,3,2,0,P,0xaaa,yes,,"
            ].join("\n"),
            "13.0",
            "stream",
            [
                {
                    targetId: "absolute",
                    functionName: "",
                    sourceFile: "/workspace/a.js",
                    runtimeLocation: runtimeLocation(3, 2)
                }
            ]
        );
        expect(exact.targetScope.matchedTargetIds).toEqual(["absolute"]);
        expect(exact.graph.inlineCaches.map(item => item.key)).toEqual(["yes"]);

        const relativeFileUrl = parseV8IcMapLog(
            [
                "code-creation,JS,1,2,0x1000,4,file://src/a.js:3:2",
                "LoadIC,0x1000,1,3,2,0,P,0xaaa,no,,"
            ].join("\n"),
            "13.0",
            "stream",
            [
                {
                    targetId: "relative",
                    functionName: "",
                    sourceFile: "src/a.js",
                    runtimeLocation: runtimeLocation(3, 2)
                }
            ]
        );
        expect(relativeFileUrl.targetScope.matchedTargetIds).toEqual([]);
        expect(relativeFileUrl.graph.inlineCaches).toEqual([]);
    });

    test("refuses to attribute a process-global log without target identity", () => {
        const result = parseV8IcMapLog(
            "LoadIC,0x1000,12,4,8,1,N,0xbbb,x,,",
            "13.0"
        );
        expect(result).toEqual({
            oracleVersion: "1",
            engineVersion: testEngineVersion,
            events: [],
            graph: { maps: [], transitions: [], inlineCaches: [] },
            targetScope: {
                requestedTargetIds: [],
                matchedTargetIds: [],
                unmatchedTargetIds: [],
                ambiguousTargetIds: []
            },
            gap: "No unique runtime target identity was available, so the process-global V8 log was not attributed to inspected code."
        });
    });

    test("accounts for an anonymous target without a source owner as unmatched", () => {
        const result = parseV8IcMapLog(
            "LoadIC,0x1000,12,4,8,1,N,0xbbb,x,,",
            "13.0",
            "stream",
            [{ targetId: "anonymous", functionName: "" }]
        );

        expect(result).toEqual({
            oracleVersion: "1",
            engineVersion: testEngineVersion,
            events: [],
            graph: { maps: [], transitions: [], inlineCaches: [] },
            targetScope: {
                requestedTargetIds: ["anonymous"],
                matchedTargetIds: [],
                unmatchedTargetIds: ["anonymous"],
                ambiguousTargetIds: []
            },
            gap: "No unique runtime target identity was available, so the process-global V8 log was not attributed to inspected code."
        });
    });

    test("accounts for every ownerless anonymous target without treating them as name-ambiguous", () => {
        const result = parseV8IcMapLog(
            "code-creation,JS,1,2,0x1000,4,anonymous",
            "13.0",
            "stream",
            [
                { targetId: "one", functionName: "" },
                { targetId: "two", functionName: "" }
            ]
        );

        expect(result.targetScope).toEqual({
            requestedTargetIds: ["one", "two"],
            matchedTargetIds: [],
            unmatchedTargetIds: ["one", "two"],
            ambiguousTargetIds: []
        });
    });

    test("accepts an exact six-field Map edge and rejects a connected non-Map row", () => {
        const result = parseV8IcMapLog(
            [
                "code-creation,JS,1,2,0x1000,4,hot",
                "LoadIC,0x1000,1,1,1,0,1,0xbbb,x,,",
                "map,Transition,1,0xaaa,0xbbb,sfi",
                "not-map,Transition,1,0xaaa,0xbbb,sfi",
                "map,Transition,1,0xaaa,0xbbb",
                "map,Transition,1,0xshort,0xaaa"
            ].join("\n"),
            "13.0",
            "stream",
            target()
        );

        expect(result.graph.transitions).toEqual([
            {
                from: "map-2",
                to: "map-1",
                reason: "Transition",
                property: "sfi"
            }
        ]);
        expect(result.graph.maps).toEqual([
            { id: "map-1", elementsKind: undefined, properties: [] },
            { id: "map-2", elementsKind: undefined, properties: [] }
        ]);
    });

    test.each([
        [63, false],
        [64, false],
        [65, true]
    ] as const)(
        "bounds %i-level Map ancestry (truncated=%s)",
        (depth, truncated) => {
            const maps = Array.from(
                { length: depth },
                (_, index) =>
                    `map,Transition,${index},0x${index.toString(16)},0x${(index + 1).toString(16)},sfi,1,2,,p${index}`
            );
            const result = parseV8IcMapLog(
                [
                    testVersionHeader,
                    ...maps,
                    "code-creation,JS,10,11,0x1000,8,hot file.js:1:1",
                    `LoadIC,0x1001,12,4,8,1,P,0x${depth.toString(16)},x,,`
                ].join("\n"),
                "13.0",
                "stream",
                target()
            );

            if (truncated) {
                expect(result.gap).toBe(
                    "Target-connected Map ancestry exceeded 64 bounded parser passes; the retained graph is partial."
                );
            } else {
                expect(result.gap).toBeUndefined();
            }
            expect(result.graph.inlineCaches).toHaveLength(1);
            expect(result.graph.maps.length).toBeLessThanOrEqual(65);
        }
    );
});
