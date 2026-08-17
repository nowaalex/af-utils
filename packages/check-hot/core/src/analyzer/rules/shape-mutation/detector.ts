import { isNode, nodeName, walk } from "../../ast.js";
import type { AstNode } from "../../ast.js";
import type { CandidateNode } from "../../internal-model.js";
import { memberLabel, memberPropertyName } from "../syntax.js";
import { defineAnalyzerProblems } from "../shared.js";
import type { AddFinding } from "../shared.js";

const shapeGuidance = {
    likelyCauses: [
        "Fields or prototypes change after objects have already trained optimized code."
    ],
    confirmWith: [
        "Compare object maps and prototype state across setup, warmup, and guarded stress."
    ],
    remediations: [
        {
            action: "Initialize fields in a consistent order and complete structural changes before warmup.",
            when: "Map or deoptimization evidence links the late mutation to the hot workload."
        }
    ]
} as const;

/** Rules implemented by this feature. */
export const ruleDefinitions = defineAnalyzerProblems("shape-mutation", [
    {
        id: "late-instance-property-write",
        title: "Late instance property write",
        mutationFamily: "object-shape",
        runtimeExperiment: false,
        ...shapeGuidance
    },
    {
        id: "shape-or-prototype-mutation",
        title: "Shape or prototype mutation",
        mutationFamily: "prototype-chain",
        runtimeExperiment: false,
        ...shapeGuidance
    }
] as const);

/** Collect fields initialized declaratively or by the constructor. */
export const initializedClassProperties = (classNode?: AstNode) => {
    const initialized = new Set<string>();
    if (
        classNode?.type !== "ClassDeclaration" &&
        classNode?.type !== "ClassExpression"
    ) {
        return initialized;
    }
    const body = isNode(classNode.body) ? classNode.body.body : undefined;
    if (!Array.isArray(body)) return initialized;
    for (const element of body) {
        if (!isNode(element)) continue;
        if (element.type === "PropertyDefinition" && element.static !== true) {
            const property = nodeName(element.key);
            if (property) initialized.add(property);
        }
        if (
            element.type === "MethodDefinition" &&
            element.static !== true &&
            (element.kind === "constructor" ||
                nodeName(element.key) === "constructor") &&
            isNode(element.value)
        ) {
            walk(element.value, [], child => {
                if (child.type !== "AssignmentExpression") return;
                const left = child.left;
                if (
                    isNode(left) &&
                    left.type === "MemberExpression" &&
                    isNode(left.object) &&
                    left.object.type === "ThisExpression"
                ) {
                    const property = memberPropertyName(left);
                    if (property) initialized.add(property);
                }
            });
        }
    }
    return initialized;
};

/** Detect prototype operations and first writes to undeclared instance fields. */
export const detectShapeMutation = (
    node: AstNode,
    candidate: CandidateNode,
    declaredNames: ReadonlySet<string>,
    initializedProperties: ReadonlySet<string>,
    addFinding: AddFinding
) => {
    if (node.type === "CallExpression") {
        const label = memberLabel(node.callee);
        if (
            ((label === "Object.defineProperty" ||
                label === "Object.setPrototypeOf") &&
                !declaredNames.has("Object")) ||
            ((label === "Reflect.defineProperty" ||
                label === "Reflect.setPrototypeOf") &&
                !declaredNames.has("Reflect"))
        ) {
            addFinding(
                "shape-or-prototype-mutation",
                "critical",
                `${label} can invalidate hidden-class or prototype-chain assumptions.`,
                "Move structural initialization out of the hot phase or add before/after map and deopt checks.",
                node
            );
        }
    }
    if (node.type !== "AssignmentExpression") return;
    const left = node.left;
    const property = memberPropertyName(left);
    if (property === "__proto__") {
        addFinding(
            "shape-or-prototype-mutation",
            "warning",
            "An assignment to __proto__ may invoke the legacy prototype setter and invalidate prototype-chain assumptions.",
            "Prefer Object.setPrototypeOf during structural setup, or verify that the receiver intentionally owns a data property named __proto__.",
            node
        );
    }
    if (
        candidate.kind === "method" &&
        candidate.name !== "constructor" &&
        isNode(left) &&
        left.type === "MemberExpression" &&
        isNode(left.object) &&
        left.object.type === "ThisExpression" &&
        property !== "__proto__" &&
        !initializedProperties.has(property ?? "")
    ) {
        addFinding(
            "late-instance-property-write",
            "warning",
            "A method writes an instance property outside the constructor; the first write may transition the receiver shape.",
            "Initialize the field consistently in the constructor or explicitly test pre- and post-transition instances.",
            node
        );
    }
};
