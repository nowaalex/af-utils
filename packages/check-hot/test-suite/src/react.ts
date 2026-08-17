import type {
    HotModuleTestRunner,
    HotPublicFunctionLocator
} from "@af-utils/check-hot";

import type { HotRecipeResolver } from "./shared.js";
import { createRecipeTestRunner, testRunnerVersion } from "./shared.js";

/** React peer range covered by this adapter. */
export const reactPackageRange = ">=18 <20";

const assertElementObject = (result: unknown) => {
    if (typeof result !== "object" || result === null) {
        throw new TypeError("React.createElement must return an element");
    }
};

const verifyCreateElementMutation = ({
    args,
    result
}: {
    args: readonly unknown[];
    result: unknown;
}) => {
    assertElementObject(result);
    const [type, configValue, ...children] = args;
    const element = result as {
        type?: unknown;
        key?: unknown;
        props?: Record<string, unknown>;
    };
    if (element.type !== type || !element.props) {
        throw new TypeError(
            "React.createElement mutation changed the requested element type"
        );
    }
    const config =
        typeof configValue === "object" && configValue !== null
            ? (configValue as Record<string, unknown>)
            : undefined;
    const expectedKey = config?.key === undefined ? null : String(config.key);
    if (element.key !== expectedKey) {
        throw new TypeError(
            `React.createElement mutation produced key ${String(element.key)}, expected ${String(expectedKey)}`
        );
    }
    const expectedProps: Record<string, unknown> = {};
    if (config) {
        for (const [key, value] of Object.entries(config)) {
            if (key !== "key" && key !== "__self" && key !== "__source") {
                expectedProps[key] = value;
            }
        }
    }
    if (children.length > 0) {
        expectedProps.children = children.length === 1 ? children[0] : children;
    }
    const defaultProps =
        (typeof type === "object" && type !== null) ||
        typeof type === "function"
            ? (type as { defaultProps?: unknown }).defaultProps
            : undefined;
    if (typeof defaultProps === "object" && defaultProps !== null) {
        for (const [key, value] of Object.entries(defaultProps)) {
            if (expectedProps[key] === undefined) expectedProps[key] = value;
        }
    }
    const expectedKeys = Object.keys(expectedProps).toSorted();
    const actualKeys = Object.keys(element.props).toSorted();
    if (
        expectedKeys.length !== actualKeys.length ||
        expectedKeys.some((key, index) => key !== actualKeys[index])
    ) {
        throw new TypeError(
            "React.createElement mutation changed its prop set"
        );
    }
    for (const key of expectedKeys) {
        if (!Object.is(element.props[key], expectedProps[key])) {
            throw new TypeError(
                `React.createElement mutation changed prop ${key}`
            );
        }
    }
};

const resolveReactRecipes: HotRecipeResolver = (candidate, context) => {
    const normalized = candidate.name.toLowerCase();
    if (/^children\.(?:map|foreach)$/u.test(normalized)) {
        return [
            {
                label: "child-list-callback",
                args: iteration => [
                    ["first", "second", "third"],
                    [
                        (child: unknown) => child,
                        (child: unknown) => String(child),
                        (child: unknown) => [child],
                        (child: unknown) => Boolean(child),
                        (child: unknown) => ({ child })
                    ][iteration % 5]
                ],
                verify(result) {
                    if (normalized.endsWith(".map") && !Array.isArray(result)) {
                        throw new TypeError(
                            "React.Children.map must return an array"
                        );
                    }
                    if (
                        normalized.endsWith(".foreach") &&
                        result !== undefined
                    ) {
                        throw new TypeError(
                            "React.Children.forEach must return undefined"
                        );
                    }
                }
            }
        ];
    }
    if (/^children\.(?:count|toarray)$/u.test(normalized)) {
        return [
            {
                label: "child-list",
                args: () => [["first", "second", "third"]],
                verify(result) {
                    if (
                        normalized.endsWith(".count")
                            ? typeof result !== "number"
                            : !Array.isArray(result)
                    ) {
                        throw new TypeError(
                            `React ${candidate.name} returned an unexpected value`
                        );
                    }
                }
            }
        ];
    }
    if (normalized === "children.only") {
        const createElement = context.functions.get("createElement");
        if (createElement) {
            return [
                {
                    label: "single-child",
                    args: () => [
                        Reflect.apply(
                            createElement.fn,
                            createElement.receiver,
                            ["span", null, "only child"]
                        )
                    ],
                    verify(result) {
                        if (typeof result !== "object" || result === null) {
                            throw new TypeError(
                                "React.Children.only must preserve the element"
                            );
                        }
                    }
                }
            ];
        }
    }
    if (normalized === "cloneelement") {
        const owner = candidate.receiver as {
            createElement?: (...args: unknown[]) => unknown;
        };
        const createElement = owner.createElement;
        if (typeof createElement === "function") {
            return [
                {
                    label: "element-clone",
                    args: () => [
                        Reflect.apply(createElement, owner, [
                            "div",
                            { className: "before" },
                            "child"
                        ]),
                        { className: "after" },
                        "next child"
                    ],
                    verify(result) {
                        if (typeof result !== "object" || result === null) {
                            throw new TypeError(
                                "React.cloneElement must return an element"
                            );
                        }
                    }
                }
            ];
        }
    }
    if (normalized === "createelement") {
        return [
            {
                label: "element-with-props",
                args: iteration => [
                    "div",
                    iteration % 2 === 0
                        ? { className: "item", id: "hot" }
                        : { id: "hot", className: "item" },
                    "text"
                ],
                verify(result) {
                    assertElementObject(result);
                },
                verifyMutation: verifyCreateElementMutation
            },
            {
                label: "element-with-special-key",
                args: () => [
                    "div",
                    {
                        key: "stable-key",
                        className: "item",
                        __keep: "tail"
                    },
                    "text"
                ],
                verify: assertElementObject,
                verifyMutation: verifyCreateElementMutation
            },
            {
                label: "element-with-default-props",
                args: () => [
                    {
                        defaultProps: {
                            role: "button",
                            tabIndex: 0,
                            children: "default child"
                        },
                        __keep: "tail"
                    },
                    { id: "hot" },
                    "text"
                ],
                verify: assertElementObject,
                verifyMutation: verifyCreateElementMutation
            }
        ];
    }
    if (normalized === "createcontext") {
        return [
            {
                label: "context-default-value",
                args: iteration => [
                    iteration % 2 === 0
                        ? { theme: "light", density: "compact" }
                        : { density: "compact", theme: "light" }
                ],
                verify(result) {
                    if (typeof result !== "object" || result === null) {
                        throw new TypeError(
                            "React.createContext must return a context"
                        );
                    }
                }
            }
        ];
    }
    if (normalized === "createref") {
        return [
            {
                label: "empty-ref",
                args: () => [],
                verify(result) {
                    if (typeof result !== "object" || result === null) {
                        throw new TypeError(
                            "React.createRef must return a ref"
                        );
                    }
                }
            }
        ];
    }
    if (normalized === "isvalidelement") {
        const owner = candidate.receiver as {
            createElement?: (...args: unknown[]) => unknown;
        };
        const createElement = owner.createElement;
        if (typeof createElement === "function") {
            return [
                {
                    label: "created-element",
                    args: () => [
                        Reflect.apply(createElement, owner, ["span", null])
                    ],
                    verify(result) {
                        if (result !== true) {
                            throw new TypeError(
                                "React.isValidElement must accept a created element"
                            );
                        }
                    }
                }
            ];
        }
    }
    if (/^(?:forwardref|memo|cache)$/u.test(normalized)) {
        return [
            {
                label: "stable-component-or-callback",
                args: () => [(properties: unknown) => properties],
                verify(result) {
                    if (
                        (typeof result !== "object" || result === null) &&
                        typeof result !== "function"
                    ) {
                        throw new TypeError(
                            `React ${candidate.name} returned an unexpected wrapper`
                        );
                    }
                },
                probeFingerprint({ result }) {
                    if (typeof result === "function") {
                        return {
                            kind: "function",
                            name: result.name,
                            length: result.length
                        };
                    }
                    const wrapper = result as Record<PropertyKey, unknown>;
                    const tag = wrapper.$$typeof;
                    return {
                        kind: "object",
                        tag:
                            typeof tag === "symbol"
                                ? (Symbol.keyFor(tag) ?? tag.description)
                                : typeof tag,
                        type: typeof wrapper.type,
                        render: typeof wrapper.render
                    };
                }
            }
        ];
    }
    if (normalized === "starttransition") {
        return [
            {
                label: "synchronous-transition",
                args: () => [() => 42],
                verify(result) {
                    if (result !== undefined) {
                        throw new TypeError(
                            "React.startTransition must return undefined"
                        );
                    }
                }
            }
        ];
    }
    if (normalized === "lazy") {
        return [
            {
                label: "lazy-loader",
                args: () => [() => Promise.resolve({ default: () => null })],
                verify(result) {
                    if (typeof result !== "object" || result === null) {
                        throw new TypeError(
                            "React.lazy must return a lazy type"
                        );
                    }
                }
            }
        ];
    }
    return [];
};

const recipeTestRunner = createRecipeTestRunner({
    id: "react-public-api",
    version: testRunnerVersion,
    packageNames: ["react"],
    packageRange: reactPackageRange,
    resolve: resolveReactRecipes
});

const childrenMethodNames = ["map", "forEach", "count", "toArray", "only"];

/** Public-helper recipes declared compatible with selected React releases. */
const reactTestRunner: HotModuleTestRunner = {
    ...recipeTestRunner,
    discover(context) {
        const childrenDescriptor = Object.getOwnPropertyDescriptor(
            context.namespace,
            "Children"
        );
        const children =
            childrenDescriptor && "value" in childrenDescriptor
                ? childrenDescriptor.value
                : undefined;
        if (!children || typeof children !== "object") return [];
        return childrenMethodNames.flatMap(name => {
            const descriptor = Object.getOwnPropertyDescriptor(children, name);
            const fn =
                descriptor && "value" in descriptor
                    ? descriptor.value
                    : undefined;
            return typeof fn === "function"
                ? [
                      {
                          modulePath: ".",
                          exportPath: ["Children", name]
                      } satisfies HotPublicFunctionLocator
                  ]
                : [];
        });
    }
};

export default reactTestRunner;
