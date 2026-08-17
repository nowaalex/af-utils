import { parseSync } from "oxc-parser";
import { describe, expect, test } from "vitest";

import { walk } from "../../ast.js";
import type { AstNode } from "../../ast.js";
import type { CandidateNode } from "../../internal-model.js";
import {
    collectParameterInvalidations,
    findAliasInvalidation
} from "./binding-writes.js";
import { analyzerFixture } from "../test-fixture.test-utils.js";

const analyze = analyzerFixture("binding-writes");
const synthetic = (type: string, properties: Record<string, unknown> = {}) =>
    ({ type, start: 0, end: 1, ...properties }) as AstNode;

const directCandidate = (source: string, parameterNames = ["value"]) => {
    const program = parseSync("fixture.js", source, {
        sourceType: "script"
    }).program as unknown as AstNode;
    let node: AstNode | undefined;
    walk(program, [], current => {
        if (!node && current.type === "FunctionDeclaration") node = current;
    });
    if (!node) throw new TypeError("Expected function declaration");
    const candidate: CandidateNode = {
        node,
        runtimeNode: node,
        stripStaticRuntimePrefix: false,
        name: "hot",
        kind: "function",
        exported: false,
        publicTargets: [],
        publicPaths: [],
        arity: parameterNames.length,
        parameterNames,
        parameterBindings: parameterNames.map((name, index) => ({
            name,
            index,
            path: []
        }))
    };
    return { candidate, program };
};

const numericFindingsFor = async (source: string, name: string) => {
    const report = await analyze(source);
    return (
        report.candidates
            .find(candidate => candidate.name === name)
            ?.findings.filter(
                finding => finding.rule === "numeric-operation"
            ) ?? []
    );
};

const aliasInvalidationFor = (body: string) => {
    const source = [
        "function hot(value, values) {",
        "  let alias = value;",
        `  ${body}`,
        "  return alias;",
        "}"
    ].join("\n");
    const candidate = directCandidate(source).candidate;
    let scope: AstNode | undefined;
    let declaration: AstNode | undefined;
    walk(candidate.node, [], (node, ancestors) => {
        if (
            !declaration &&
            node.type === "VariableDeclarator" &&
            source.slice(node.start, node.end).startsWith("alias = value")
        ) {
            declaration = node;
            scope = ancestors.findLast(
                ancestor => ancestor.type === "BlockStatement"
            );
        }
    });
    if (!declaration || !scope) {
        throw new TypeError("Expected outer alias declaration");
    }
    return {
        source,
        result: findAliasInvalidation(candidate, {
            name: "alias",
            scope,
            declarationEnd: declaration.end
        })
    };
};

describe("binding-aware write invalidation", () => {
    test("collects exact writes and dynamic-scope hazards for public parameters", () => {
        const source = [
            "function hot(value, other, values) {",
            "  other++;",
            "  value = 2;",
            "  ++value;",
            "  for (value of values) break;",
            "  var value = 3;",
            "  function captured() { value = 4; }",
            "  eval('value = 5');",
            "}"
        ].join("\n");
        const { candidate } = directCandidate(source, ["value"]);

        const invalidations = collectParameterInvalidations(candidate);

        expect(invalidations.dynamicScopeHazard).toBe(true);
        expect([...invalidations.writeStarts.keys()]).toEqual(["value"]);
        const starts = invalidations.writeStarts.get("value");
        expect(starts).toHaveLength(5);
        expect(starts).toEqual(
            expect.arrayContaining([
                candidate.node.start,
                source.indexOf("value = 2"),
                source.indexOf("++value"),
                source.indexOf("for (value"),
                source.indexOf("value = 3")
            ])
        );
    });

    test("ignores unrelated target-shaped nodes and non-eval calls", () => {
        const source = [
            "function hot(value) {",
            "  let other = 1;",
            "  other = 2;",
            "  other++;",
            "  for (other of values) break;",
            "  record.value = 3;",
            "  evaluate('value = 4');",
            "  return value;",
            "}"
        ].join("\n");
        const { candidate } = directCandidate(source);

        const invalidations = collectParameterInvalidations(candidate);

        expect(invalidations.dynamicScopeHazard).toBe(false);
        expect(invalidations.writeStarts).toEqual(new Map());
    });

    test("finds the first direct alias write and moves captured writes to declaration", () => {
        const directSource = [
            "function hot(value) {",
            "  let alias = value;",
            "  alias++;",
            "  alias = 3;",
            "  return alias;",
            "}"
        ].join("\n");
        const direct = directCandidate(directSource).candidate;
        let directScope: AstNode | undefined;
        let directDeclaration: AstNode | undefined;
        walk(direct.node, [], (node, ancestors) => {
            if (
                node.type === "VariableDeclarator" &&
                directSource.slice(node.start, node.end).includes("alias")
            ) {
                directDeclaration = node;
                directScope = ancestors.findLast(
                    ancestor => ancestor.type === "BlockStatement"
                );
            }
        });
        expect(directScope).toBeDefined();
        expect(directDeclaration).toBeDefined();
        expect(
            findAliasInvalidation(direct, {
                name: "alias",
                scope: directScope!,
                declarationEnd: directDeclaration!.end
            })
        ).toBe(directSource.indexOf("alias++"));

        const capturedSource = [
            "function hot(value) {",
            "  let alias = value;",
            "  function mutate() { alias = 3; }",
            "  return alias;",
            "}"
        ].join("\n");
        const captured = directCandidate(capturedSource).candidate;
        let capturedScope: AstNode | undefined;
        let capturedDeclaration: AstNode | undefined;
        walk(captured.node, [], (node, ancestors) => {
            if (
                node.type === "VariableDeclarator" &&
                capturedSource.slice(node.start, node.end).includes("alias")
            ) {
                capturedDeclaration = node;
                capturedScope = ancestors.findLast(
                    ancestor => ancestor.type === "BlockStatement"
                );
            }
        });
        expect(
            findAliasInvalidation(captured, {
                name: "alias",
                scope: capturedScope!,
                declarationEnd: capturedDeclaration!.end
            })
        ).toBe(capturedDeclaration!.end);
    });

    test("treats with-statements as dynamic-scope hazards", () => {
        const { candidate } = directCandidate(
            "function hot(value, scope) { with (scope) { value = 2; } return value; }"
        );

        expect(
            collectParameterInvalidations(candidate).dynamicScopeHazard
        ).toBe(true);
    });

    test("keeps outer aliases across every nested lexical shadow kind", async () => {
        const bodies = [
            "function nested(alias) { alias = 2; }",
            "{ let alias = 1; alias = 2; }",
            "class Model { static { let alias = 1; alias = 2; } }",
            "switch (enabled) { case true: { let alias = 1; alias = 2; } }",
            "for (let alias = 0; alias < 1; alias++) void alias;",
            "for (let alias in values) void alias;",
            "for (let alias of values) void alias;",
            "try { throw 1; } catch (alias) { alias = 2; }"
        ];
        const findings = await Promise.all(
            bodies.map((body, index) =>
                numericFindingsFor(
                    [
                        `export function shadow${index}(value, enabled, values) {`,
                        "  let alias = value;",
                        `  ${body}`,
                        "  return alias + 1;",
                        "}"
                    ].join("\n"),
                    `shadow${index}`
                )
            )
        );

        expect(
            findings.map(
                items =>
                    items.find(finding => finding.line === 4)?.parameterIndex
            )
        ).toEqual(bodies.map(() => 0));
    });

    test("does not invalidate an alias at its exact declaration boundary", () => {
        const source = [
            "function hot(value) {",
            "  let alias = value;",
            "  alias = 2;",
            "}"
        ].join("\n");
        const candidate = directCandidate(source).candidate;
        let scope: AstNode | undefined;
        walk(candidate.node, [], (node, ancestors) => {
            if (node.type === "AssignmentExpression") {
                scope = ancestors.findLast(
                    ancestor => ancestor.type === "BlockStatement"
                );
            }
        });
        const boundary = source.indexOf("alias = 2");

        expect(
            findAliasInvalidation(candidate, {
                name: "alias",
                scope: scope!,
                declarationEnd: boundary
            })
        ).toBeUndefined();
    });

    test("keeps a parameter origin before a later write", async () => {
        const findings = await numericFindingsFor(
            [
                "export function positional(value) {",
                "  const before = value + 1;",
                "  value = 2;",
                "  const after = value + 3;",
                "  return before + after;",
                "}"
            ].join("\n"),
            "positional"
        );

        expect(
            findings.find(finding => finding.line === 2)?.parameterIndex
        ).toBe(0);
        expect(
            findings.find(finding => finding.line === 4)?.parameterIndex
        ).toBeUndefined();
    });

    test("does not invalidate a parameter for a shadow-binding write", async () => {
        const findings = await numericFindingsFor(
            [
                "export function shadowed(value) {",
                "  { let value = 1; value++; void (value + 2); }",
                "  return value + 3;",
                "}"
            ].join("\n"),
            "shadowed"
        );

        expect(
            findings.find(finding => finding.line === 2)?.parameterIndex
        ).toBeUndefined();
        expect(
            findings.find(finding => finding.line === 3)?.parameterIndex
        ).toBe(0);
    });

    test("does not invalidate an outer alias through a loop-local namesake", async () => {
        const findings = await numericFindingsFor(
            [
                "export function loopShadow(value, values) {",
                "  const alias = value;",
                "  for (let alias of values) alias++;",
                "  return alias + 1;",
                "}"
            ].join("\n"),
            "loopShadow"
        );

        expect(
            findings.find(finding => finding.line === 4)?.parameterIndex
        ).toBe(0);
    });

    test("treats a var for-of declaration as a parameter write", async () => {
        const findings = await numericFindingsFor(
            [
                "export function loopWrite(value, values) {",
                "  for (var value of values) void value;",
                "  return value + 1;",
                "}"
            ].join("\n"),
            "loopWrite"
        );

        expect(
            findings.find(finding => finding.line === 3)?.parameterIndex
        ).toBeUndefined();
    });

    test("treats a var for-in declaration as an alias write", async () => {
        const findings = await numericFindingsFor(
            [
                "export function aliasLoopWrite(value, values) {",
                "  var alias = value;",
                "  for (var alias in values) void alias;",
                "  return alias + 1;",
                "}"
            ].join("\n"),
            "aliasLoopWrite"
        );

        expect(
            findings.find(finding => finding.line === 4)?.parameterIndex
        ).toBeUndefined();
    });

    test("keeps an alias origin before its later destructuring write", async () => {
        const findings = await numericFindingsFor(
            [
                "export function aliasWrite(value, source) {",
                "  let alias = value;",
                "  const before = alias + 1;",
                "  ({ next: alias } = source);",
                "  return before + (alias + 2);",
                "}"
            ].join("\n"),
            "aliasWrite"
        );

        expect(
            findings.find(finding => finding.line === 3)?.parameterIndex
        ).toBe(0);
        expect(
            findings.find(finding => finding.line === 5)?.parameterIndex
        ).toBeUndefined();
    });

    test("treats a repeated var initializer as a write to the same binding", async () => {
        const findings = await numericFindingsFor(
            [
                "export function redeclared(value) {",
                "  var alias = value;",
                "  var alias = 2;",
                "  return alias + 1;",
                "}"
            ].join("\n"),
            "redeclared"
        );

        expect(
            findings.find(finding => finding.line === 4)?.parameterIndex
        ).toBeUndefined();
    });

    test("invalidates captured writes even when a closure body is textually later", async () => {
        const findings = await numericFindingsFor(
            [
                "export function captured(value) {",
                "  mutate();",
                "  return value + 1;",
                "  function mutate() { value = 2; }",
                "}"
            ].join("\n"),
            "captured"
        );

        expect(
            findings.find(finding => finding.line === 3)?.parameterIndex
        ).toBeUndefined();
    });

    test("joins a possible branch write as unknown", async () => {
        const findings = await numericFindingsFor(
            [
                "export function branch(value, enabled) {",
                "  if (enabled) value = 2;",
                "  return value + 1;",
                "}"
            ].join("\n"),
            "branch"
        );

        expect(
            findings.find(finding => finding.line === 3)?.parameterIndex
        ).toBeUndefined();
    });

    test.each([
        "function nested(alias) { alias = 2; }",
        "{ let alias = 1; alias = 2; }",
        "class Model { static { let alias = 1; alias = 2; } }",
        "switch (value) { case 1: let alias = 1; alias = 2; }",
        "for (let alias = 0; alias < 1; alias++) void alias;",
        "for (let alias in values) void alias;",
        "for (let alias of values) void alias;",
        "try { throw 1; } catch (alias) { alias = 2; }"
    ])("directly preserves the outer alias across %s", body => {
        expect(aliasInvalidationFor(body).result).toBeUndefined();
    });

    test.each([
        "for (var alias = 0; alias < 1; alias++) void alias;",
        "for (var alias in values) void alias;",
        "for (var alias of values) void alias;"
    ])("directly invalidates the function alias through %s", body => {
        const { source, result } = aliasInvalidationFor(body);

        expect(result).toBeGreaterThanOrEqual(source.indexOf(body));
    });

    test("checks the binding scope even when it is the first ancestor", () => {
        const source = "function hot(value) { value = 2; }";
        const candidate = directCandidate(source).candidate;

        expect(
            findAliasInvalidation(candidate, {
                name: "value",
                scope: candidate.node,
                declarationEnd: candidate.node.start
            })
        ).toBe(source.indexOf("value = 2"));
    });

    test("ignores declaration and eval lookalikes", () => {
        const value = synthetic("IdentifierReference", { name: "value" });
        const candidate = {
            ...directCandidate("function hot(value) {}").candidate,
            node: synthetic("FunctionDeclaration", {
                params: [value],
                body: synthetic("BlockStatement", {
                    body: [
                        synthetic("Literal", {
                            id: value,
                            init: synthetic("Literal", { value: 1 })
                        }),
                        synthetic("Literal", {
                            callee: synthetic("IdentifierReference", {
                                name: "eval"
                            })
                        })
                    ]
                })
            })
        };

        expect(collectParameterInvalidations(candidate)).toEqual({
            writeStarts: new Map(),
            dynamicScopeHazard: false
        });
    });
});
