import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

const source = readFileSync(import.meta.filename, "utf8");
const sourceSha256 = createHash("sha256").update(source).digest("hex");
const ownerStart =
    source.indexOf("const hotIdentity") + "const hotIdentity = ".length;
const hotIdentity = value => value;

const target = {
    id: "hotIdentity",
    annotation: false,
    resolve: state => state.hotIdentity
};

export default {
    name: "preflight crash control",
    evidence: [
        {
            id: "evidence:preflight-crash",
            rule: "numeric-operation",
            candidateId: "fixture#hotIdentity",
            confidence: "dataflow-proven",
            subject: "fixture",
            automation: {
                version: 1,
                mutationFamily: "numeric-representation",
                parameterIndex: 0,
                parameterPath: []
            },
            span: {
                file: import.meta.filename,
                relativeFile: "runtime-preflight-crash.mjs",
                sourceSha256,
                start: ownerStart,
                end: ownerStart + "value".length,
                line: 8,
                column: 21,
                endLine: 8,
                endColumn: 26
            },
            ownerSpan: {
                file: import.meta.filename,
                relativeFile: "runtime-preflight-crash.mjs",
                sourceSha256,
                start: ownerStart,
                end: ownerStart + "value => value".length,
                line: 8,
                column: 21,
                endLine: 8,
                endColumn: 35
            }
        }
    ],
    obligations: [
        {
            id: "obligation:preflight-crash",
            evidenceId: "evidence:preflight-crash",
            candidateId: "fixture#hotIdentity",
            mutationFamily: "numeric-representation",
            exportName: "hotIdentity",
            parameterIndex: 0
        }
    ],
    preflight() {
        throw new Error("intentional preflight crash");
    },
    setup: () => ({ hotIdentity }),
    scenarios: [
        {
            id: "numbers",
            targets: [target],
            obligations: ["obligation:preflight-crash"],
            run({ invoke, iteration }) {
                invoke(target, undefined, [iteration]);
            }
        }
    ]
};
