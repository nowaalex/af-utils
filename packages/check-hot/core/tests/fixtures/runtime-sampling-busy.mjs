import { fileURLToPath } from "node:url";

import { busyCompute } from "./runtime-sampling-target.mjs";

const sourceFile = fileURLToPath(
    new URL("./runtime-sampling-target.mjs", import.meta.url)
);
const ownerSpan = {
    file: sourceFile,
    relativeFile: "runtime-sampling-target.mjs",
    sourceSha256:
        "c68ee5ce0a928ad700459309d1f51d958bbd482a0a759733562d16f1eb3f2596",
    start: 0,
    end: 198,
    line: 1,
    column: 1,
    endLine: 7,
    endColumn: 3
};

const target = {
    id: "busyCompute",
    annotation: false,
    resolve: state => state.busyCompute
};

export default {
    name: "runtime sampling busy control",
    evidence: [
        {
            id: "evidence:busy-compute",
            rule: "numeric-representation",
            candidateId: "candidate:busy-compute",
            confidence: "syntactic",
            subject: "busy compute",
            span: ownerSpan,
            ownerSpan
        }
    ],
    setup: () => ({ busyCompute }),
    scenarios: [
        {
            id: "sustained-compute",
            targets: [target],
            run({ invoke, iteration }) {
                invoke(target, undefined, [iteration]);
            }
        }
    ]
};
