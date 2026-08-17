import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { createModuleSuite } from "../../src/index.ts";

const targetUrl = new URL(
    "./runtime-stateful-site-target.mjs",
    import.meta.url
);
const targetFile = fileURLToPath(targetUrl);
const targetSource = readFileSync(targetFile, "utf8");
const sourceSha256 = createHash("sha256").update(targetSource).digest("hex");
const expression = "value + 1";
const start = targetSource.indexOf(expression);

export default createModuleSuite({
    name: "stateful preflight-only AST site control",
    load: () => import(targetUrl.href),
    evidence: [
        {
            id: "evidence:stateful-numeric",
            rule: "numeric-operation",
            candidateId: "runtime-stateful-site-target.mjs#statefulNumeric@3",
            confidence: "dataflow-proven",
            subject: "stateful numeric expression",
            automation: {
                version: 1,
                mutationFamily: "numeric-representation",
                parameterIndex: 0,
                parameterPath: []
            },
            span: {
                file: targetFile,
                relativeFile: "runtime-stateful-site-target.mjs",
                sourceSha256,
                start,
                end: start + expression.length,
                line: 5,
                column: 25,
                endLine: 5,
                endColumn: 34
            },
            ownerSpan: {
                file: targetFile,
                relativeFile: "runtime-stateful-site-target.mjs",
                sourceSha256,
                start: targetSource.indexOf("export function"),
                end: targetSource.length,
                line: 3,
                column: 1,
                endLine: 9,
                endColumn: 2
            }
        }
    ],
    obligations: [
        {
            id: "obligation:stateful-numeric",
            evidenceId: "evidence:stateful-numeric",
            candidateId: "runtime-stateful-site-target.mjs#statefulNumeric@3",
            mutationFamily: "numeric-representation",
            exportName: "statefulNumeric",
            parameterIndex: 0
        }
    ],
    samples: {
        statefulNumeric: [
            {
                label: "same-output-stateful-branch",
                args: () => [1],
                verify(result) {
                    if (typeof result !== "number") {
                        throw new Error("numeric result expected");
                    }
                },
                verifyMutation({ result, args }) {
                    if (
                        !Object.is(result, args[0]) &&
                        !(Number.isNaN(result) && Number.isNaN(args[0]))
                    ) {
                        throw new Error("stateful mutation changed output");
                    }
                }
            }
        ]
    }
});
