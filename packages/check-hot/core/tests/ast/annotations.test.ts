import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, test } from "vitest";
import type { Comment } from "oxc-parser";

import { discoverHotAnnotations } from "../../src/annotations.js";
import {
    annotationDeclarationStart,
    bindHotMarkerComments,
    hotMarkerFromComment
} from "../../src/analyzer/annotation-binding.js";
import type { AstNode } from "../../src/analyzer/ast.js";

const directories: string[] = [];

afterEach(async () => {
    await Promise.all(
        directories
            .splice(0)
            .map(directory => rm(directory, { force: true, recursive: true }))
    );
});

describe("JavaScript annotation parsing", () => {
    test("parses only explicit marker comment lines", () => {
        expect(
            hotMarkerFromComment(" check-hot: Model.run trailing text")
        ).toBe("Model.run");
        expect(
            hotMarkerFromComment(
                "ordinary block line\n * check-hot: Model.block"
            )
        ).toBe("Model.block");
        expect(
            hotMarkerFromComment("prefix check-hot: ignored")
        ).toBeUndefined();
        expect(hotMarkerFromComment("check-hot:")).toBeUndefined();
    });

    test("stops declaration ownership at the nearest AST boundary", () => {
        const node = { type: "ArrowFunctionExpression", start: 30, end: 40 };
        const ancestors = [
            { type: "Program", start: 0, end: 50 },
            { type: "ExportNamedDeclaration", start: 5, end: 45 },
            { type: "VariableDeclaration", start: 8, end: 45 },
            { type: "VariableDeclarator", start: 14, end: 44 }
        ] satisfies AstNode[];

        expect(annotationDeclarationStart(node, ancestors)).toBe(5);
        expect(
            annotationDeclarationStart(node, [
                ancestors[0],
                { type: "BlockStatement", start: 4, end: 48 },
                { type: "ExpressionStatement", start: 20, end: 42 }
            ])
        ).toBe(20);
    });

    test("sorts owner candidates and uses the first node in one declaration", () => {
        const marker = "/* check-hot: sorted */";
        const declarationStart = marker.length + 1;
        const source = `${marker} function sorted() {}`;
        const comments: Comment[] = [
            {
                type: "Block",
                value: " check-hot: sorted ",
                start: 0,
                end: marker.length
            }
        ];

        const bindings = bindHotMarkerComments(comments, source, [
            { declarationStart: declarationStart + 10, nodeStart: 50 },
            { declarationStart, nodeStart: 40 },
            { declarationStart, nodeStart: 30 }
        ]);

        expect([...bindings]).toEqual([[0, 30]]);
    });

    test("allows only comments and whitespace between marker and declaration", () => {
        const marker = "/* check-hot: exact */";
        const explanation = "/* why this path is hot */";
        const source = `${marker} ${explanation}function exact() {}`;
        const comments: Comment[] = [
            {
                type: "Block",
                value: " check-hot: exact ",
                start: 0,
                end: marker.length
            },
            {
                type: "Block",
                value: " why this path is hot ",
                start: marker.length + 1,
                end: marker.length + 1 + explanation.length
            }
        ];
        const declarationStart = source.indexOf("function");

        expect(
            bindHotMarkerComments(comments, source, [
                { declarationStart, nodeStart: declarationStart }
            ]).get(0)
        ).toBe(declarationStart);

        const adjacentSource = `${marker}${explanation}function exact() {}`;
        const adjacentDeclarationStart = adjacentSource.indexOf("function");
        expect(
            bindHotMarkerComments(
                [
                    comments[0],
                    {
                        ...comments[1],
                        start: marker.length,
                        end: marker.length + explanation.length
                    }
                ],
                adjacentSource,
                [
                    {
                        declarationStart: adjacentDeclarationStart,
                        nodeStart: adjacentDeclarationStart
                    }
                ]
            ).get(0)
        ).toBe(adjacentDeclarationStart);

        const withStatement = `${marker}\nconst unrelated = 1;\nfunction exact() {}`;
        expect(
            bindHotMarkerComments([comments[0]], withStatement, [
                {
                    declarationStart: withStatement.indexOf("function"),
                    nodeStart: withStatement.indexOf("function")
                }
            ]).has(0)
        ).toBe(false);
    });

    test("enforces exact attachment distance and line boundaries", () => {
        const marker = "/* check-hot: boundary */";
        const comment: Comment = {
            type: "Block",
            value: " check-hot: boundary ",
            start: 0,
            end: marker.length
        };
        const bindsAcross = (gap: string) => {
            const source = `${marker}${gap}function boundary() {}`;
            const declarationStart = marker.length + gap.length;
            return bindHotMarkerComments([comment], source, [
                { declarationStart, nodeStart: declarationStart }
            ]).has(0);
        };

        expect(bindsAcross("")).toBe(true);
        expect(bindsAcross(" ".repeat(399))).toBe(true);
        expect(bindsAcross(" ".repeat(400))).toBe(false);
        expect(bindsAcross("\n".repeat(4))).toBe(true);
        expect(bindsAcross("\n".repeat(5))).toBe(false);
    });

    test("does not create bindings for ordinary comments", () => {
        const source = "/* ordinary */ function value() {}";
        const declarationStart = source.indexOf("function");
        const bindings = bindHotMarkerComments(
            [{ type: "Block", value: " ordinary ", start: 0, end: 14 }],
            source,
            [{ declarationStart, nodeStart: declarationStart }]
        );

        expect(bindings.size).toBe(0);
    });

    test("uses Oxc comments and ignores template-string marker text", async () => {
        const directory = await mkdtemp(join(tmpdir(), "check-hot-comments-"));
        directories.push(directory);
        const file = join(directory, "fixture.js");
        await writeFile(
            file,
            "const text = `// check-hot: false-positive`;\n// check-hot: actual\nexport const hot = () => text;"
        );

        const annotations = await discoverHotAnnotations([file]);

        expect(annotations.map(value => value.id)).toEqual(["actual"]);
    });

    test("binds a marker only to the first following declaration", async () => {
        const directory = await mkdtemp(join(tmpdir(), "check-hot-comments-"));
        directories.push(directory);
        const file = join(directory, "fixture.js");
        await writeFile(
            file,
            [
                "// check-hot: A",
                "function A() {}",
                "function B() {}",
                "// check-hot: detached",
                "const unrelated = 1;",
                "function C() { return unrelated; }"
            ].join("\n")
        );

        const annotations = await discoverHotAnnotations([file]);

        expect(annotations).toEqual([
            expect.objectContaining({ id: "A", owner: "A" }),
            expect.objectContaining({ id: "detached", owner: undefined })
        ]);
    });
});
