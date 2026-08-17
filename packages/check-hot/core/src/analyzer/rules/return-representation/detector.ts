import type { AstNode } from "../../ast.js";
import { expressionKind } from "../syntax.js";
import { defineAnalyzerProblems } from "../shared.js";
import type { AddFinding } from "../shared.js";
import { isConcreteValueKind } from "../value-kinds.js";

const returnGuidance = {
    likelyCauses: [
        "A function exposes several caller-visible result representations across branches."
    ],
    confirmWith: [
        "Exercise every legitimate return branch and inspect callers, not only the producing function."
    ],
    remediations: [
        {
            action: "Use a stable result envelope or split APIs by result role.",
            when: "Caller-side engine evidence shows harmful representation instability and the API change is acceptable."
        }
    ]
} as const;

/** Rules implemented by this feature. */
export const ruleDefinitions = defineAnalyzerProblems("return-representation", [
    {
        id: "mixed-return-kinds",
        title: "Mixed return representations",
        mutationFamily: "return-representation",
        runtimeExperiment: false,
        ...returnGuidance
    }
] as const);

/** Collect statically concrete return classes. */
export const detectReturnRepresentation = (
    node: AstNode,
    returnKinds: Set<string>
) => {
    if (node.type !== "ReturnStatement") return;
    const kind = expressionKind(node.argument);
    if (isConcreteValueKind(kind)) returnKinds.add(kind);
};

/** Report caller-visible return diversity after candidate traversal. */
export const finishReturnRepresentation = (
    owner: AstNode,
    returnKinds: ReadonlySet<string>,
    addFinding: AddFinding
) => {
    if (returnKinds.size < 3) return;
    addFinding(
        "mixed-return-kinds",
        "info",
        `The function has several statically distinct return forms (${[...returnKinds].join(", ")}).`,
        "Exercise each return form in isolated and combined modes to reveal caller-side representation changes.",
        owner
    );
};
