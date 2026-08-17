import { isNode, nodeName, walk } from "../../ast.js";
import type { AstNode } from "../../ast.js";
import type { CandidateNode, ParsedFile } from "../../internal-model.js";
import { expressionKind, functionTypes, memberLabel } from "../syntax.js";
import { defineAnalyzerProblems } from "../shared.js";
import type { AddFinding } from "../shared.js";
import { concreteValueKind, isConcreteValueKind } from "../value-kinds.js";

const arrayGuidance = {
    likelyCauses: [
        "One array site observes incompatible element representations or holes."
    ],
    confirmWith: [
        "Run packed SMI, double, object, holey, and sparse variants and inspect the engine-observed elements kind."
    ],
    remediations: [
        {
            action: "Keep a genuinely hot collection representation stable or separate heterogeneous data by role.",
            when: "Engine evidence shows representation transitions or deoptimization on the real workload."
        }
    ]
} as const;

/** Rules implemented by this feature. */
export const ruleDefinitions = defineAnalyzerProblems("array-elements", [
    {
        id: "heterogeneous-array-literal",
        title: "Heterogeneous array literal",
        mutationFamily: "array-elements",
        runtimeExperiment: false,
        ...arrayGuidance
    },
    {
        id: "mixed-array-element-kinds",
        title: "Mixed array element kinds",
        mutationFamily: "array-elements",
        runtimeExperiment: false,
        ...arrayGuidance
    },
    {
        id: "sparse-array-write",
        title: "Sparse array write",
        mutationFamily: "array-elements",
        runtimeExperiment: false,
        ...arrayGuidance
    }
] as const);

/** Mutable aggregate retained by the shared candidate traversal. */
export interface ArrayElementsState {
    pushKinds: Map<string, { kinds: Set<string>; node: AstNode }>;
}

/** Collect locally created arrays without entering a differently owned closure. */
export const collectKnownArrays = (candidate: CandidateNode) => {
    const names = new Set<string>();
    walk(candidate.node, [], node => {
        if (node !== candidate.node && functionTypes.has(node.type)) {
            return false;
        }
        if (
            node.type === "VariableDeclarator" &&
            isNode(node.init) &&
            node.init.type === "ArrayExpression"
        ) {
            const name = nodeName(node.id);
            if (name) names.add(name);
        }
    });
    return names;
};

/** Detect local array literals, push domains, and sparse writes. */
export const detectArrayElements = (
    node: AstNode,
    parsed: ParsedFile,
    knownArrays: ReadonlySet<string>,
    state: ArrayElementsState,
    addFinding: AddFinding
) => {
    if (node.type === "ArrayExpression") {
        const elements = Array.isArray(node.elements) ? node.elements : [];
        const kinds = elements.map(element => expressionKind(element));
        const elementKinds = new Set(
            kinds.flatMap(kind => {
                const concrete = concreteValueKind(kind);
                return concrete ? [concrete] : [];
            })
        );
        if (elementKinds.size > 1) {
            addFinding(
                "heterogeneous-array-literal",
                "warning",
                `A single array literal contains statically different element classes (${[...elementKinds].join(", ")}); it is created with a generalized elements representation rather than transitioning later.`,
                "Verify whether the heterogeneous representation reaches a hot loop; do not describe this literal as a runtime elements-kind transition.",
                node
            );
        }
    }
    if (
        node.type === "CallExpression" &&
        memberLabel(node.callee)?.endsWith(".push")
    ) {
        const callee = node.callee as AstNode;
        const receiver = parsed.source.slice(
            (callee.object as AstNode).start,
            (callee.object as AstNode).end
        );
        const pushed = state.pushKinds.get(receiver) ?? {
            kinds: new Set<string>(),
            node
        };
        if (Array.isArray(node.arguments)) {
            for (const argument of node.arguments) {
                const kind = expressionKind(argument);
                if (isConcreteValueKind(kind)) pushed.kinds.add(kind);
            }
        }
        state.pushKinds.set(receiver, pushed);
    }
    if (node.type !== "AssignmentExpression") return;
    const left = node.left;
    if (
        isNode(left) &&
        left.type === "MemberExpression" &&
        knownArrays.has(nodeName(left.object) ?? "") &&
        isNode(left.property) &&
        left.property.type === "Literal" &&
        typeof left.property.value === "number" &&
        left.property.value >= 64
    ) {
        addFinding(
            "sparse-array-write",
            "warning",
            `A locally created array is written at static index ${left.property.value}, which may introduce holes or sparse storage if the array has not already grown to that index.`,
            "Exercise the far-index write explicitly and inspect the runtime's packed, holey, and sparse representations.",
            node
        );
    }
};

/** Emit aggregate push-domain findings after the shared traversal. */
export const finishArrayElements = (
    state: ArrayElementsState,
    addFinding: AddFinding
) => {
    for (const [receiver, pushed] of state.pushKinds) {
        if (pushed.kinds.size < 2) continue;
        addFinding(
            "mixed-array-element-kinds",
            "warning",
            `Array receiver ${receiver} receives statically different pushed value kinds (${[...pushed.kinds].join(", ")}).`,
            "Use scenarios that verify SMI, double, object, packed, and holey transitions for this exact array receiver.",
            pushed.node
        );
    }
};
