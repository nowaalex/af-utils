import { parseSync } from "oxc-parser";
import { describe, expect, test } from "vitest";

import { nodeName, walk } from "../../ast.js";
import type { AstNode } from "../../ast.js";
import {
    addPatternBindings,
    addPatternNames,
    collectDeclaredNames,
    directLexicalBindings,
    functionScopedBindings,
    isIdentifierReference,
    isNameShadowedBetween,
    isUnboundGlobalReference,
    reachesFunctionParameter,
    visitAssignedBindings
} from "../dataflow.js";

const parse = (source: string) =>
    parseSync("fixture.ts", source, {
        sourceType: "module",
        astType: "ts"
    }).program as unknown as AstNode;

const findNode = (
    root: AstNode,
    predicate: (node: AstNode, ancestors: readonly AstNode[]) => boolean
) => {
    let match: { node: AstNode; ancestors: readonly AstNode[] } | undefined;
    walk(root, [], (node, ancestors) => {
        if (!match && predicate(node, ancestors)) {
            match = { node, ancestors };
        }
    });
    if (!match) throw new TypeError("Expected AST node was not found");
    return match;
};

const synthetic = (type: string, properties: Record<string, unknown> = {}) =>
    ({ type, start: 0, end: 1, ...properties }) as AstNode;

describe("data-flow AST primitives", () => {
    test("collects declarations while pruning nested function bodies", () => {
        const program = parse(
            [
                'import defaultName, * as namespace from "package-a";',
                'import { value as imported } from "package-b";',
                "const [first, ...rest] = source;",
                "function outer({ field: alias }, direct = 1) {",
                "  const local = direct;",
                "  function nested() { const hidden = 1; }",
                "  class LocalClass {}",
                "  return local;",
                "}",
                "class TopLevelClass {}"
            ].join("\n")
        );
        const outer = findNode(
            program,
            node => node.type === "FunctionDeclaration" && node.id !== undefined
        ).node;

        expect([...collectDeclaredNames(program)].toSorted()).toEqual([
            "TopLevelClass",
            "defaultName",
            "first",
            "imported",
            "namespace",
            "outer",
            "rest"
        ]);
        expect([...collectDeclaredNames(outer)].toSorted()).toEqual([
            "LocalClass",
            "alias",
            "direct",
            "local",
            "nested",
            "outer"
        ]);
    });

    test("maps nested, rest, literal-computed, and dynamic parameter patterns", () => {
        const program = parse(
            "function sample([first, ...tail], { plain: alias = 1, ['fixed']: fixed, [dynamic]: unknown, ...objectRest }, direct = 1) {}"
        );
        const declaration = findNode(
            program,
            node => node.type === "FunctionDeclaration"
        ).node;
        const parameters = declaration.params as AstNode[];
        const names = new Set<string>();
        for (const parameter of parameters) addPatternNames(parameter, names);
        const bindings = parameters.flatMap((parameter, index) => {
            const result: Parameters<typeof addPatternBindings>[3] = [];
            addPatternBindings(parameter, index, [], result);
            return result;
        });

        expect([...names].toSorted()).toEqual([
            "alias",
            "direct",
            "first",
            "fixed",
            "objectRest",
            "tail",
            "unknown"
        ]);
        expect(bindings).toEqual([
            { name: "first", index: 0, path: [0] },
            { name: "tail", index: 0, path: [1], automatable: false },
            { name: "alias", index: 1, path: ["plain"] },
            { name: "fixed", index: 1, path: ["fixed"] },
            { name: "unknown", index: 1, path: [], automatable: false },
            {
                name: "objectRest",
                index: 1,
                path: [],
                automatable: false
            },
            { name: "direct", index: 2, path: [] }
        ]);
    });

    test("visits only lexical bindings in every assignment-target shape", () => {
        const targets = [
            synthetic("IdentifierReference", { name: "direct" }),
            synthetic("RestElement", {
                argument: synthetic("IdentifierReference", { name: "rest" })
            }),
            synthetic("AssignmentPattern", {
                left: synthetic("IdentifierReference", { name: "defaulted" })
            }),
            synthetic("ArrayAssignmentTarget", {
                elements: [
                    synthetic("IdentifierReference", { name: "arrayItem" })
                ]
            }),
            synthetic("ObjectAssignmentTarget", {
                properties: [
                    synthetic("Property", {
                        key: synthetic("Identifier", { name: "key" }),
                        value: synthetic("IdentifierReference", {
                            name: "objectValue"
                        })
                    }),
                    synthetic("RestElement", {
                        argument: synthetic("IdentifierReference", {
                            name: "objectRest"
                        })
                    })
                ]
            }),
            synthetic("TSAsExpression", {
                expression: synthetic("IdentifierReference", {
                    name: "asserted"
                })
            }),
            synthetic("MemberExpression", {
                object: synthetic("IdentifierReference", { name: "record" }),
                property: synthetic("Identifier", { name: "field" })
            })
        ];
        const names: string[] = [];
        for (const target of targets) {
            visitAssignedBindings(target, binding => {
                names.push(binding.name as string);
            });
        }

        expect(names).toEqual([
            "direct",
            "rest",
            "defaulted",
            "arrayItem",
            "objectValue",
            "objectRest",
            "asserted"
        ]);
    });

    test("distinguishes lexical block bindings from function-scoped var bindings", () => {
        const program = parse(
            [
                "const expression = function self(parameter) {",
                "  var topVar = parameter;",
                "  { let blockLet = 1; const { field: blockAlias } = source; var deepVar = 2; function blockFunction() {} class BlockClass {} }",
                "  function nested() { var hidden = 3; }",
                "};",
                "switch (source) { case 1: let caseValue = 1; class CaseClass {} }"
            ].join("\n")
        );
        const expression = findNode(
            program,
            node => node.type === "FunctionExpression"
        ).node;
        const block = findNode(
            expression,
            node =>
                node.type === "BlockStatement" &&
                Array.isArray(node.body) &&
                node.body.some(
                    item =>
                        (item as AstNode).type === "VariableDeclaration" &&
                        (item as AstNode).kind === "let"
                )
        ).node;
        const switchStatement = findNode(
            program,
            node => node.type === "SwitchStatement"
        ).node;

        expect([...directLexicalBindings(block)].toSorted()).toEqual([
            "BlockClass",
            "blockAlias",
            "blockFunction",
            "blockLet"
        ]);
        expect([...directLexicalBindings(switchStatement)].toSorted()).toEqual([
            "CaseClass",
            "caseValue"
        ]);
        expect([...functionScopedBindings(expression)].toSorted()).toEqual([
            "deepVar",
            "parameter",
            "self",
            "topVar"
        ]);
    });

    test("classifies identifier references by their exact parent role", () => {
        const identifier = synthetic("IdentifierReference", { name: "value" });
        const ordinary = synthetic("BinaryExpression", {
            left: identifier,
            right: synthetic("Literal", { value: 1 })
        });
        expect(isIdentifierReference(identifier, [])).toBe(true);
        expect(
            isIdentifierReference(synthetic("Literal", { value: 1 }), [])
        ).toBe(false);
        expect(isIdentifierReference(identifier, [ordinary])).toBe(true);

        const excludedParents = [
            synthetic("MemberExpression", {
                property: identifier,
                computed: false
            }),
            synthetic("Property", {
                key: identifier,
                value: synthetic("Literal", { value: 1 }),
                computed: false,
                shorthand: false
            }),
            synthetic("MethodDefinition", { key: identifier }),
            synthetic("VariableDeclarator", { id: identifier }),
            synthetic("FunctionDeclaration", {
                id: synthetic("Identifier", { name: "fn" }),
                params: [identifier]
            }),
            synthetic("AssignmentExpression", { left: identifier }),
            synthetic("UpdateExpression", { argument: identifier }),
            synthetic("ImportSpecifier", { local: identifier }),
            synthetic("ExportSpecifier", { local: identifier })
        ];
        for (const parent of excludedParents) {
            expect(isIdentifierReference(identifier, [parent])).toBe(false);
        }

        expect(
            isIdentifierReference(identifier, [
                synthetic("MemberExpression", {
                    property: identifier,
                    computed: true
                })
            ])
        ).toBe(true);
        expect(
            isIdentifierReference(identifier, [
                synthetic("Property", {
                    key: identifier,
                    value: identifier,
                    computed: false,
                    shorthand: true
                })
            ])
        ).toBe(true);
    });

    test("detects function, block, switch, catch, and loop shadows", () => {
        const program = parse(
            [
                "function root(value) {",
                "  function functionShadow(value) { return value; }",
                "  { let value = 1; consume(value); }",
                "  switch (kind) { case 1: const value = 2; consume(value); }",
                "  try {} catch (value) { consume(value); }",
                "  for (let value of values) consume(value);",
                "  return value;",
                "}"
            ].join("\n")
        );
        const root = findNode(
            program,
            node =>
                node.type === "FunctionDeclaration" &&
                (node.id as AstNode).name === "root"
        ).node;
        const references: { node: AstNode; ancestors: readonly AstNode[] }[] =
            [];
        walk(root, [], (node, ancestors) => {
            if (
                (node.type === "Identifier" ||
                    node.type === "IdentifierReference") &&
                node.name === "value" &&
                isIdentifierReference(node, ancestors)
            ) {
                references.push({ node, ancestors });
            }
        });

        const shadowed = references.filter(({ ancestors }) =>
            isNameShadowedBetween(root, "value", ancestors)
        );
        expect(shadowed).toHaveLength(5);
        const returned = references.find(
            ({ ancestors }) =>
                ancestors.some(parent => parent.type === "ReturnStatement") &&
                !isNameShadowedBetween(root, "value", ancestors)
        );
        expect(returned).toBeDefined();
        expect(
            reachesFunctionParameter(
                root,
                "value",
                returned!.node,
                returned!.ancestors
            )
        ).toBe(true);
    });

    test("accepts only genuinely unbound global references", () => {
        const unboundProgram = parse(
            "export const loaded = require('fixture');"
        );
        const unbound = findNode(
            unboundProgram,
            node => node.name === "require"
        );
        expect(
            isUnboundGlobalReference(
                unboundProgram,
                "require",
                unbound.node,
                unbound.ancestors
            )
        ).toBe(true);

        for (const source of [
            "const require = loader; export const loaded = require('fixture');",
            "export function load(require) { return require('fixture'); }",
            "export function load() { { const require = loader; return require('fixture'); } }"
        ]) {
            const program = parse(source);
            const reference = findNode(
                program,
                (node, ancestors) =>
                    node.name === "require" &&
                    isIdentifierReference(node, ancestors)
            );
            expect(
                isUnboundGlobalReference(
                    program,
                    "require",
                    reference.node,
                    reference.ancestors
                )
            ).toBe(false);
        }
    });

    test("ignores malformed non-node pattern fragments", () => {
        const names = new Set<string>();
        const bindings: Parameters<typeof addPatternBindings>[3] = [];
        const visited: AstNode[] = [];

        addPatternNames(undefined, names);
        addPatternBindings(null, 0, [], bindings);
        visitAssignedBindings("value", node => visited.push(node));
        visitAssignedBindings(null, node => visited.push(node));

        expect(names).toEqual(new Set());
        expect(bindings).toEqual([]);
        expect(visited).toEqual([]);
        expect(directLexicalBindings(synthetic("Literal"))).toEqual(new Set());
    });

    test("distinguishes every supported pattern node from structural lookalikes", () => {
        const names = new Set<string>();
        addPatternNames(
            synthetic("BindingIdentifier", { name: "binding" }),
            names
        );
        for (const pattern of [
            synthetic("RestElement", {
                argument: synthetic("Identifier", { name: "rest" })
            }),
            synthetic("AssignmentPattern", {
                left: synthetic("Identifier", { name: "defaulted" })
            }),
            synthetic("ArrayPattern", {
                elements: [synthetic("Identifier", { name: "element" })]
            }),
            synthetic("ObjectPattern", {
                properties: [
                    null,
                    synthetic("Property", {
                        key: synthetic("Identifier", { name: "field" }),
                        value: synthetic("Identifier", { name: "property" })
                    }),
                    synthetic("RestElement", {
                        argument: synthetic("Identifier", {
                            name: "objectRest"
                        })
                    })
                ]
            })
        ]) {
            addPatternNames(pattern, names);
        }
        for (const lookalike of [
            synthetic("Literal", { name: "namedLiteral" }),
            synthetic("Literal", {
                elements: [synthetic("Identifier", { name: "fakeElement" })]
            }),
            synthetic("Literal", {
                properties: [synthetic("Identifier", { name: "fakeProperty" })]
            })
        ]) {
            addPatternNames(lookalike, names);
        }

        expect([...names].toSorted()).toEqual([
            "binding",
            "defaulted",
            "element",
            "objectRest",
            "property",
            "rest"
        ]);
    });

    test("does not collect declaration-shaped fields from unrelated nodes", () => {
        const root = synthetic("Program", {
            body: [
                synthetic("Literal", {
                    params: [synthetic("Identifier", { name: "fakeParam" })],
                    id: synthetic("Identifier", { name: "fakeId" }),
                    local: synthetic("Identifier", { name: "fakeImport" })
                }),
                synthetic("FunctionExpression", { id: null, params: [] })
            ]
        });

        expect(collectDeclaredNames(root)).toEqual(new Set());
    });

    test("requires the exact object-pattern structure before collecting names", () => {
        const names = new Set<string>();
        addPatternNames(
            synthetic("Literal", {
                properties: [
                    synthetic("Property", {
                        value: synthetic("Identifier", { name: "fake" })
                    })
                ]
            }),
            names
        );
        addPatternNames(
            synthetic("ObjectPattern", { properties: "not-an-array" }),
            names
        );

        expect(names).toEqual(new Set());
    });

    test("visits every assignment wrapper but rejects lookalike containers", () => {
        const visited: string[] = [];
        const visit = (value: AstNode) =>
            visitAssignedBindings(value, binding => {
                visited.push(binding.name as string);
            });

        for (const [type, name] of [
            ["Identifier", "identifier"],
            ["BindingIdentifier", "binding"],
            ["SpreadElement", "spread"],
            ["TSSatisfiesExpression", "satisfies"],
            ["TSNonNullExpression", "nonNull"],
            ["TypeCastExpression", "cast"],
            ["ParenthesizedExpression", "parenthesized"]
        ] as const) {
            const property =
                type === "SpreadElement" ? "argument" : "expression";
            visit(
                type === "Identifier" || type === "BindingIdentifier"
                    ? synthetic(type, { name })
                    : synthetic(type, {
                          [property]: synthetic("IdentifierReference", {
                              name
                          })
                      })
            );
        }
        visit(
            synthetic("ArrayPattern", {
                elements: [synthetic("IdentifierReference", { name: "array" })]
            })
        );
        visit(
            synthetic("ObjectPattern", {
                properties: [
                    null,
                    synthetic("Property", {
                        value: synthetic("IdentifierReference", {
                            name: "object"
                        })
                    })
                ]
            })
        );
        for (const lookalike of [
            synthetic("Literal", { name: "fakeDirect" }),
            synthetic("Literal", {
                argument: synthetic("IdentifierReference", {
                    name: "fakeArgument"
                })
            }),
            synthetic("Literal", {
                elements: [
                    synthetic("IdentifierReference", { name: "fakeArray" })
                ]
            }),
            synthetic("Literal", {
                properties: [
                    synthetic("Property", {
                        value: synthetic("IdentifierReference", {
                            name: "fakeObject"
                        })
                    })
                ]
            }),
            synthetic("Literal", {
                expression: synthetic("IdentifierReference", {
                    name: "fakeExpression"
                })
            })
        ]) {
            visit(lookalike);
        }

        expect(visited).toEqual([
            "identifier",
            "binding",
            "spread",
            "satisfies",
            "nonNull",
            "cast",
            "parenthesized",
            "array",
            "object"
        ]);
    });

    test("maps binding identifiers and computed numeric keys exactly", () => {
        const bindings: Parameters<typeof addPatternBindings>[3] = [];
        addPatternBindings(
            synthetic("BindingIdentifier", { name: "direct" }),
            2,
            ["root"],
            bindings
        );
        addPatternBindings(
            synthetic("ObjectPattern", {
                properties: [
                    null,
                    synthetic("Property", {
                        computed: true,
                        key: synthetic("Literal", { value: 3 }),
                        value: synthetic("BindingIdentifier", {
                            name: "numeric"
                        })
                    }),
                    synthetic("Property", {
                        computed: false,
                        key: synthetic("Literal", { value: 4 }),
                        value: synthetic("BindingIdentifier", {
                            name: "nonComputedLiteral"
                        })
                    })
                ]
            }),
            4,
            [],
            bindings
        );
        addPatternBindings(
            synthetic("Literal", {
                name: "fake",
                properties: [
                    synthetic("Property", {
                        value: synthetic("Identifier", { name: "hidden" })
                    })
                ]
            }),
            5,
            [],
            bindings
        );

        expect(bindings).toEqual([
            { name: "direct", index: 2, path: ["root"] },
            { name: "numeric", index: 4, path: [3] },
            {
                name: "nonComputedLiteral",
                index: 4,
                path: [],
                automatable: false
            }
        ]);
    });

    test("marks every non-literal computed object key as non-automatable", () => {
        const bindings: Parameters<typeof addPatternBindings>[3] = [];
        addPatternBindings(
            synthetic("ObjectPattern", {
                properties: [
                    synthetic("Property", {
                        computed: true,
                        key: synthetic("Identifier", { name: "dynamic" }),
                        value: synthetic("Identifier", { name: "byName" })
                    }),
                    synthetic("Property", {
                        computed: true,
                        key: synthetic("Literal", { value: true }),
                        value: synthetic("Identifier", { name: "byBoolean" })
                    }),
                    synthetic("Property", {
                        computed: true,
                        key: null,
                        value: synthetic("Identifier", { name: "withoutKey" })
                    })
                ]
            }),
            1,
            ["root"],
            bindings
        );
        addPatternBindings(
            synthetic("Literal", {
                elements: [synthetic("Identifier", { name: "fakeArray" })]
            }),
            2,
            [],
            bindings
        );
        addPatternBindings(
            synthetic("ArrayPattern", { elements: "not-an-array" }),
            2,
            [],
            bindings
        );

        expect(bindings).toEqual([
            {
                name: "byName",
                index: 1,
                path: ["root"],
                automatable: false
            },
            {
                name: "byBoolean",
                index: 1,
                path: ["root"],
                automatable: false
            },
            {
                name: "withoutKey",
                index: 1,
                path: ["root"],
                automatable: false
            }
        ]);
    });

    test("classifies each identifier parent by identity as well as node type", () => {
        const identifier = synthetic("IdentifierReference", { name: "value" });
        const other = synthetic("IdentifierReference", { name: "other" });
        const cases: [AstNode, boolean][] = [
            [
                synthetic("MemberExpression", {
                    object: identifier,
                    property: other,
                    computed: false
                }),
                true
            ],
            [
                synthetic("MemberExpression", {
                    object: other,
                    property: identifier,
                    computed: false
                }),
                false
            ],
            [
                synthetic("Property", {
                    key: other,
                    value: identifier,
                    computed: false,
                    shorthand: false
                }),
                true
            ],
            [
                synthetic("Property", {
                    key: identifier,
                    value: other,
                    computed: false,
                    shorthand: false
                }),
                false
            ],
            [
                synthetic("MethodDefinition", {
                    key: other,
                    value: identifier
                }),
                true
            ],
            [
                synthetic("MethodDefinition", {
                    key: identifier,
                    value: other
                }),
                false
            ],
            [
                synthetic("CatchClause", { param: other, body: identifier }),
                true
            ],
            [
                synthetic("CatchClause", { param: identifier, body: other }),
                false
            ],
            [
                synthetic("AssignmentExpression", {
                    left: other,
                    right: identifier
                }),
                true
            ],
            [
                synthetic("AssignmentExpression", {
                    left: identifier,
                    right: other
                }),
                false
            ],
            [
                synthetic("UpdateExpression", {
                    argument: other,
                    extra: identifier
                }),
                true
            ],
            [synthetic("UpdateExpression", { argument: identifier }), false]
        ];
        for (const type of [
            "VariableDeclarator",
            "FunctionDeclaration",
            "FunctionExpression",
            "ClassDeclaration",
            "ClassExpression"
        ]) {
            cases.push(
                [synthetic(type, { id: identifier }), false],
                [synthetic(type, { id: other, body: identifier }), true]
            );
        }
        cases.push(
            [synthetic("FunctionDeclaration", { params: [identifier] }), false],
            [
                synthetic("FunctionDeclaration", {
                    params: [other],
                    body: identifier
                }),
                true
            ]
        );

        expect(
            cases.map(([parent]) => isIdentifierReference(identifier, [parent]))
        ).toEqual(cases.map(([, expected]) => expected));
        expect(
            isIdentifierReference(synthetic("Literal"), [
                synthetic("CatchClause", { param: identifier })
            ])
        ).toBe(false);
        expect(
            reachesFunctionParameter(
                synthetic("FunctionDeclaration"),
                "value",
                synthetic("Literal"),
                []
            )
        ).toBe(false);
    });

    test("reports each lexical scope only for the matching binding", () => {
        const fixtures = [
            "function root(value) { function nested(other) { return value + other; } }",
            "function root(value) { { let other = 1; consume(value, other); } }",
            "function root(value) { switch (kind) { case 1: let other = 1; consume(value, other); } }",
            "function root(value) { try {} catch (other) { consume(value, other); } }",
            "function root(value) { for (let other = 0; other < 1; other++) consume(value, other); }",
            "function root(value) { for (let other in values) consume(value, other); }",
            "function root(value) { for (let other of values) consume(value, other); }",
            "function root(value) { for (var value of values) consume(value); }"
        ];

        expect(
            fixtures.map(source => {
                const program = parse(source);
                const root = findNode(
                    program,
                    node =>
                        node.type === "FunctionDeclaration" &&
                        nodeName(node.id) === "root"
                ).node;
                const reference = findNode(
                    root,
                    (node, ancestors) =>
                        node.name === "value" &&
                        ancestors.some(
                            ancestor =>
                                ancestor.type === "ReturnStatement" ||
                                ancestor.type === "CallExpression"
                        )
                );
                return isNameShadowedBetween(
                    root,
                    "value",
                    reference.ancestors
                );
            })
        ).toEqual([false, false, false, false, false, false, false, false]);
    });

    test("reads lexical declarations from each supported scope body shape", () => {
        const program = parse(
            [
                "function declaration(parameter) {",
                "  let lexical = 1;",
                "  var functionVar = 2;",
                "  function nestedDeclaration() {}",
                "  class NestedClass {}",
                "}",
                "const expression = function expressionName(parameter) { var expressionVar = 1; };"
            ].join("\n")
        );
        const declaration = findNode(
            program,
            node =>
                node.type === "FunctionDeclaration" &&
                nodeName(node.id) === "declaration"
        ).node;
        const expression = findNode(
            program,
            node => node.type === "FunctionExpression"
        ).node;

        expect([...directLexicalBindings(declaration)].toSorted()).toEqual([
            "NestedClass",
            "lexical",
            "nestedDeclaration"
        ]);
        expect([...functionScopedBindings(declaration)].toSorted()).toEqual([
            "functionVar",
            "parameter"
        ]);
        expect([...functionScopedBindings(expression)].toSorted()).toEqual([
            "expressionName",
            "expressionVar",
            "parameter"
        ]);
    });

    test("ignores malformed statements, cases, and var declarators", () => {
        const switchScope = synthetic("SwitchStatement", {
            cases: [
                null,
                synthetic("SwitchCase", { consequent: "not-an-array" }),
                synthetic("SwitchCase", {
                    consequent: [
                        null,
                        synthetic("VariableDeclaration", {
                            kind: "let",
                            declarations: [null]
                        })
                    ]
                })
            ]
        });
        const functionScope = synthetic("FunctionDeclaration", {
            params: [],
            body: synthetic("BlockStatement", {
                body: [
                    null,
                    synthetic("VariableDeclaration", {
                        kind: "var",
                        declarations: [null]
                    })
                ]
            })
        });

        expect(directLexicalBindings(switchScope)).toEqual(new Set());
        expect(functionScopedBindings(functionScope)).toEqual(new Set());
    });

    test.each([
        "for (let value = 0; value < 1; value++) consume(value);",
        "for (let value in values) consume(value);",
        "for (let value of values) consume(value);"
    ])("detects a shadow declared by %s", loop => {
        const program = parse(`function root(value) { ${loop} }`);
        const root = findNode(
            program,
            node =>
                node.type === "FunctionDeclaration" &&
                nodeName(node.id) === "root"
        ).node;
        const reference = findNode(
            root,
            (node, ancestors) =>
                node.name === "value" &&
                ancestors.some(parent => parent.type === "CallExpression")
        );

        expect(isNameShadowedBetween(root, "value", reference.ancestors)).toBe(
            true
        );
    });

    test("does not treat declaration-shaped unrelated scopes as shadows", () => {
        const root = synthetic("Program");
        const lexical = synthetic("VariableDeclaration", {
            kind: "let",
            declarations: [
                synthetic("VariableDeclarator", {
                    id: synthetic("Identifier", { name: "value" })
                })
            ]
        });
        const lookalikes = [
            synthetic("Literal", { body: [lexical] }),
            synthetic("Literal", {
                param: synthetic("Identifier", { name: "value" })
            }),
            synthetic("Literal", { init: lexical, left: lexical })
        ];

        for (const lookalike of lookalikes) {
            expect(isNameShadowedBetween(root, "value", [lookalike])).toBe(
                false
            );
        }
        expect(
            isNameShadowedBetween(root, "value", [
                synthetic("BlockStatement", { body: [lexical] })
            ])
        ).toBe(true);
    });

    test("rejects declaration-shaped fields on unsupported synthetic nodes", () => {
        const fakeDeclaration = synthetic("ExpressionStatement", {
            kind: "let",
            declarations: [
                synthetic("VariableDeclarator", {
                    id: synthetic("Identifier", { name: "fakeDeclaration" })
                })
            ],
            id: synthetic("Identifier", { name: "fakeId" })
        });
        const fakeSwitch = synthetic("Literal", {
            cases: [
                null,
                synthetic("SwitchCase", {
                    consequent: [
                        synthetic("VariableDeclaration", {
                            kind: "let",
                            declarations: [
                                synthetic("VariableDeclarator", {
                                    id: synthetic("Identifier", {
                                        name: "fakeCase"
                                    })
                                })
                            ]
                        })
                    ]
                })
            ],
            body: [fakeDeclaration]
        });
        const malformedBody = synthetic("FunctionDeclaration", {
            body: synthetic("Literal", {
                body: "not-an-array"
            })
        });

        expect(directLexicalBindings(fakeSwitch)).toEqual(new Set());
        expect(directLexicalBindings(malformedBody)).toEqual(new Set());
        expect(functionScopedBindings(fakeSwitch)).toEqual(new Set());
    });

    test("does not classify structural parent lookalikes as declarations", () => {
        const identifier = synthetic("IdentifierReference", { name: "value" });
        const lookalikes = [
            synthetic("Literal", {
                property: identifier,
                computed: false
            }),
            synthetic("Literal", {
                key: identifier,
                computed: false,
                shorthand: false
            }),
            synthetic("Literal", { id: identifier }),
            synthetic("Literal", { params: [identifier] }),
            synthetic("Literal", { param: identifier }),
            synthetic("Literal", { left: identifier }),
            synthetic("Literal", { argument: identifier })
        ];

        expect(
            lookalikes.map(parent =>
                isIdentifierReference(identifier, [parent])
            )
        ).toEqual(lookalikes.map(() => true));
        expect(
            isIdentifierReference(identifier, [
                synthetic("Property", {
                    key: identifier,
                    value: synthetic("IdentifierReference", { name: "other" }),
                    computed: true,
                    shorthand: false
                })
            ])
        ).toBe(true);
    });

    test("handles static-block shadows without treating lookalike loop fields as scopes", () => {
        const program = parse(
            "function root(value) { class Model { static { let value = 1; consume(value); } } return value; }"
        );
        const root = findNode(
            program,
            node =>
                node.type === "FunctionDeclaration" &&
                nodeName(node.id) === "root"
        ).node;
        const staticReference = findNode(
            root,
            (node, ancestors) =>
                node.name === "value" &&
                ancestors.some(ancestor => ancestor.type === "StaticBlock") &&
                isIdentifierReference(node, ancestors)
        );

        expect(
            isNameShadowedBetween(root, "value", staticReference.ancestors)
        ).toBe(true);
        expect(
            isNameShadowedBetween(root, "value", [
                root,
                synthetic("Literal", {
                    init: synthetic("VariableDeclaration", {
                        kind: "let",
                        declarations: [
                            synthetic("VariableDeclarator", {
                                id: synthetic("Identifier", { name: "value" })
                            })
                        ]
                    })
                })
            ])
        ).toBe(false);
    });
});
