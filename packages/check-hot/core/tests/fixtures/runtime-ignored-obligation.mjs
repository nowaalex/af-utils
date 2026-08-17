import { fileURLToPath } from "node:url";

import { hot } from "./runtime-ignored-target.mjs";

const sourceFile = fileURLToPath(
    new URL("./runtime-ignored-target.mjs", import.meta.url)
);
const span = {
    file: sourceFile,
    relativeFile: "runtime-ignored-target.mjs",
    sourceSha256:
        "17fa14c15d05ebf07ddeeaa7e986fea95d43ac9c43ecfdf9183f887717ac1905",
    start: 0,
    end: 39,
    line: 1,
    column: 1,
    endLine: 1,
    endColumn: 40
};

const target = {
    id: "hot",
    annotation: false,
    resolve: state => state.hot
};

export default {
    name: "runtime ignored obligation control",
    evidence: [
        {
            id: "evidence:excluded",
            rule: "numeric-representation",
            candidateId: "candidate:excluded",
            confidence: "dataflow-proven",
            subject: "excluded target",
            automation: {
                version: 1,
                mutationFamily: "numeric-representation",
                parameterIndex: 0,
                parameterPath: []
            },
            span,
            ownerSpan: span
        }
    ],
    obligations: [
        {
            id: "obligation:excluded",
            evidenceId: "evidence:excluded",
            candidateId: "candidate:excluded",
            mutationFamily: "numeric-representation",
            exportName: "hot",
            parameterIndex: 0,
            parameterPath: [],
            blockedReason: "Excluded by user function selection"
        }
    ],
    setup: () => ({ hot }),
    scenarios: [
        {
            id: "selected",
            targets: [target],
            run({ invoke, iteration }) {
                invoke(target, undefined, [iteration]);
            }
        }
    ]
};
