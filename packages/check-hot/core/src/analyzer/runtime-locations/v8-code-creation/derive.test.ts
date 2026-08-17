import { parseSync } from "oxc-parser";
import { describe, expect, test } from "vitest";

import { lineStartsFor, locate, walk } from "../../ast.js";
import type { AstNode } from "../../ast.js";
import { functionTypes } from "../../rules/index.js";
import { deriveV8CodeCreationAnchor } from "./derive.js";

const deriveAll = (source: string) => {
    const parsed = parseSync("fixture.js", source, { sourceType: "module" });
    const lineStarts = lineStartsFor(source);
    const results: ReturnType<typeof deriveV8CodeCreationAnchor>[] = [];
    walk(parsed.program as unknown as AstNode, [], (node, ancestors) => {
        if (!functionTypes.has(node.type)) return;
        results.push(
            deriveV8CodeCreationAnchor(source, node, ancestors.at(-1))
        );
    });
    return results.map(result => {
        if (!result) return result;
        return Object.assign({}, result, locate(lineStarts, result.offset), {
            character: source[result.offset]
        });
    });
};

const expectedAnchor = (
    source: string,
    markerEndingAtAnchor: string,
    syntaxKind: NonNullable<
        ReturnType<typeof deriveV8CodeCreationAnchor>
    >["syntaxKind"],
    anchor: NonNullable<
        ReturnType<typeof deriveV8CodeCreationAnchor>
    >["anchor"],
    flags: Partial<
        Pick<
            NonNullable<ReturnType<typeof deriveV8CodeCreationAnchor>>,
            "async" | "generator" | "static" | "computed"
        >
    > = {}
) => {
    const offset =
        source.indexOf(markerEndingAtAnchor) + markerEndingAtAnchor.length - 1;
    return {
        offset,
        anchor,
        syntaxKind,
        async: false,
        generator: false,
        static: false,
        computed: false,
        ...flags,
        ...locate(lineStartsFor(source), offset),
        character: source[offset]
    };
};

describe("V8 code-creation locator derivation", () => {
    test("derives exact parameter anchors for the controlled syntax families", () => {
        const source = [
            "function declaration(a) {}",
            "const anonymous = function (b) {};",
            "const named = function inner(c) {};",
            "const parenthesized = (d) => d;",
            "const bare = e => e;",
            "const object = { objectMethod(f) {}, get objectGetter() { return 1; }, set objectSetter(g) {}, async objectAsync(h) {}, *objectGenerator(i) {} };",
            "class Example { classMethod(j) {} get classGetter() { return 1; } set classSetter(k) {} async classAsync(l) {} *classGenerator(m) {} }"
        ].join("\n");

        expect(deriveAll(source)).toEqual([
            expectedAnchor(
                source,
                "declaration(",
                "FunctionDeclaration",
                "parameter-list-start"
            ),
            expectedAnchor(
                source,
                "function (",
                "FunctionExpression",
                "parameter-list-start"
            ),
            expectedAnchor(
                source,
                "function inner(",
                "FunctionExpression",
                "parameter-list-start"
            ),
            expectedAnchor(
                source,
                "parenthesized = (",
                "ArrowFunctionExpression",
                "parameter-list-start"
            ),
            expectedAnchor(
                source,
                "bare = e",
                "ArrowFunctionExpression",
                "parameter-start"
            ),
            expectedAnchor(
                source,
                "objectMethod(",
                "ObjectMethod",
                "parameter-list-start"
            ),
            expectedAnchor(
                source,
                "objectGetter(",
                "ObjectGetter",
                "parameter-list-start"
            ),
            expectedAnchor(
                source,
                "objectSetter(",
                "ObjectSetter",
                "parameter-list-start"
            ),
            expectedAnchor(
                source,
                "objectAsync(",
                "ObjectMethod",
                "parameter-list-start",
                { async: true }
            ),
            expectedAnchor(
                source,
                "objectGenerator(",
                "ObjectMethod",
                "parameter-list-start",
                { generator: true }
            ),
            expectedAnchor(
                source,
                "classMethod(",
                "ClassMethod",
                "parameter-list-start"
            ),
            expectedAnchor(
                source,
                "classGetter(",
                "ClassGetter",
                "parameter-list-start"
            ),
            expectedAnchor(
                source,
                "classSetter(",
                "ClassSetter",
                "parameter-list-start"
            ),
            expectedAnchor(
                source,
                "classAsync(",
                "ClassMethod",
                "parameter-list-start",
                { async: true }
            ),
            expectedAnchor(
                source,
                "classGenerator(",
                "ClassMethod",
                "parameter-list-start",
                { generator: true }
            )
        ]);
        const ordinary = "async function ordinary(value) {}";
        expect(deriveAll(ordinary)).toEqual([
            expectedAnchor(
                ordinary,
                "ordinary(",
                "FunctionDeclaration",
                "parameter-list-start",
                { async: true }
            )
        ]);
    });

    test("uses the last parameter parenthesis for computed methods", () => {
        const source =
            "const object = { [keyFactory()](value) { return value; } };";
        const method = deriveAll(source).at(-1);
        expect(method).toEqual(
            expectedAnchor(
                source,
                "](",
                "ObjectMethod",
                "parameter-list-start",
                { computed: true }
            )
        );
        expect(source.slice((method?.offset ?? 0) - 2, method?.offset)).toBe(
            ")]"
        );
    });

    test("uses V8's async keyword anchor for both async arrow forms", () => {
        const source =
            "const parenthesized = async (value) => value; const bare = async value => value;";
        expect(deriveAll(source)).toEqual([
            expectedAnchor(
                source,
                "parenthesized = a",
                "ArrowFunctionExpression",
                "async-keyword-start",
                { async: true }
            ),
            expectedAnchor(
                source,
                "bare = a",
                "ArrowFunctionExpression",
                "async-keyword-start",
                { async: true }
            )
        ]);
    });

    test("records modifiers without reclassifying ordinary properties", () => {
        const source = [
            "const object = { callback: function (value) { return value; } };",
            'class Example { static ["computed"](value) { return value; } }'
        ].join("\n");
        expect(deriveAll(source)).toEqual([
            expectedAnchor(
                source,
                "function (",
                "FunctionExpression",
                "parameter-list-start"
            ),
            expectedAnchor(
                source,
                "](",
                "ClassMethod",
                "parameter-list-start",
                { static: true, computed: true }
            )
        ]);
    });

    test("refuses constructor/private methods and a forged parent relationship", () => {
        expect(
            deriveAll(
                "class Example { constructor(value) {} #private(value) {} }"
            )
        ).toEqual([undefined, undefined]);
        const node: AstNode = {
            type: "FunctionExpression",
            start: 0,
            end: 14,
            params: [{ type: "Identifier", start: 9, end: 10 }],
            body: { type: "BlockStatement", start: 11, end: 14 }
        };
        expect(
            deriveV8CodeCreationAnchor("function(x) {}", node, {
                type: "Property",
                start: 0,
                end: 14,
                method: true,
                value: { type: "Identifier", start: 0, end: 1 }
            })
        ).toEqual({
            offset: 8,
            anchor: "parameter-list-start",
            syntaxKind: "FunctionExpression",
            async: false,
            generator: false,
            static: false,
            computed: false
        });
    });

    test("refuses malformed and unsupported nodes instead of widening", () => {
        const source = "value";
        expect(
            deriveV8CodeCreationAnchor(source, {
                type: "Identifier",
                start: 0,
                end: 5
            })
        ).toBeUndefined();
        expect(
            deriveV8CodeCreationAnchor("function(x) {}", {
                type: "UnsupportedFunction",
                start: 0,
                end: 14,
                params: [{ type: "Identifier", start: 9, end: 10 }],
                body: { type: "BlockStatement", start: 11, end: 14 }
            })
        ).toBeUndefined();
        const identifier = { type: "Identifier", start: 1, end: 2 };
        const body = { type: "Identifier", start: 4, end: 5 };
        for (const malformed of [
            {
                type: "ArrowFunctionExpression",
                start: 0,
                end: 5,
                params: [identifier]
            },
            { type: "ArrowFunctionExpression", start: 0, end: 5, body },
            {
                type: "ArrowFunctionExpression",
                start: 2,
                end: 5,
                params: [identifier],
                body
            },
            {
                type: "ArrowFunctionExpression",
                start: 0,
                end: 5,
                params: [{ ...identifier, start: 5 }],
                body
            },
            {
                type: "ArrowFunctionExpression",
                start: 0,
                end: 7,
                params: [identifier],
                body: { ...body, start: 6, end: 7 }
            },
            {
                type: "ArrowFunctionExpression",
                start: 0,
                end: 5,
                params: [identifier],
                body,
                async: true
            }
        ]) {
            expect(
                deriveV8CodeCreationAnchor(source, malformed as AstNode)
            ).toBeUndefined();
        }
        expect(
            deriveV8CodeCreationAnchor(source, {
                type: "ArrowFunctionExpression",
                start: 4,
                end: 1,
                params: [],
                body: { type: "Identifier", start: 0, end: 5 }
            })
        ).toBeUndefined();
        expect(
            deriveV8CodeCreationAnchor("(x)", {
                type: "ArrowFunctionExpression",
                start: 0,
                end: 3,
                params: [{ type: "Identifier", start: 1, end: 2 }],
                body: { type: "Identifier", start: 3, end: 3 }
            })
        ).toEqual({
            offset: 0,
            anchor: "parameter-list-start",
            syntaxKind: "ArrowFunctionExpression",
            async: false,
            generator: false,
            static: false,
            computed: false
        });
        for (const [malformedSource, malformedBoundary] of [
            [
                "(xxxxxx",
                {
                    type: "FunctionExpression",
                    start: 0,
                    end: 7,
                    params: [{ type: "Identifier", start: 5, end: 6 }],
                    body: { type: "BlockStatement", start: 4, end: 7 }
                }
            ],
            [
                "(x)",
                {
                    type: "FunctionExpression",
                    start: 0,
                    end: 6,
                    params: [{ type: "Identifier", start: 1, end: 2 }],
                    body: { type: "BlockStatement", start: 5, end: 6 }
                }
            ]
        ] as const) {
            expect(
                deriveV8CodeCreationAnchor(
                    malformedSource,
                    malformedBoundary as AstNode
                )
            ).toBeUndefined();
        }
        expect(
            deriveV8CodeCreationAnchor("value", {
                type: "ArrowFunctionExpression",
                start: 0,
                end: 5,
                params: [],
                body
            })
        ).toBeUndefined();
        expect(
            deriveV8CodeCreationAnchor("value", {
                type: "FunctionExpression",
                start: 0,
                end: 5,
                params: [{ type: "Identifier", start: 0, end: 1 }],
                body
            })
        ).toBeUndefined();
        for (const malformedBare of [
            {
                type: "ArrowFunctionExpression",
                start: 0,
                end: 5,
                params: [{ type: "ObjectPattern", start: 0, end: 1 }],
                body
            },
            {
                type: "ArrowFunctionExpression",
                start: 0,
                end: 5,
                params: [{ ...identifier, start: 1 }],
                body
            },
            {
                type: "ArrowFunctionExpression",
                start: 0,
                end: 5,
                params: [{ ...identifier, start: 0 }],
                body,
                async: true,
                generator: true
            }
        ]) {
            expect(
                deriveV8CodeCreationAnchor("value", malformedBare as AstNode)
            ).toBeUndefined();
        }
    });
});
