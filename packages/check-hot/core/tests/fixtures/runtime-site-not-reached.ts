import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

import { createModuleSuite } from "../../src/index.ts";

const targetUrl = new URL("./runtime-branch-target.mjs", import.meta.url);
const targetFile = fileURLToPath(targetUrl);
const targetSource = readFileSync(targetFile, "utf8");
const expression = "Number(value)";
const start = targetSource.indexOf(expression);

export default createModuleSuite({
    name: "unreached AST site control",
    load: () => import(targetUrl.href),
    evidence: [
        {
            id: "evidence:guarded-numeric",
            rule: "numeric-operation",
            candidateId: "runtime-branch-target.mjs#guardedNumeric@1",
            confidence: "dataflow-proven",
            subject: "guarded numeric expression",
            automation: {
                version: 1,
                mutationFamily: "numeric-representation",
                parameterIndex: 0,
                parameterPath: []
            },
            span: {
                file: targetFile,
                relativeFile: "runtime-branch-target.mjs",
                sourceSha256: createHash("sha256")
                    .update(targetSource)
                    .digest("hex"),
                start,
                end: start + expression.length,
                line: 2,
                column: 25,
                endLine: 2,
                endColumn: 38
            },
            ownerSpan: {
                file: targetFile,
                relativeFile: "runtime-branch-target.mjs",
                sourceSha256: createHash("sha256")
                    .update(targetSource)
                    .digest("hex"),
                start: targetSource.indexOf("export function"),
                end: targetSource.length,
                line: 1,
                column: 1,
                endLine: 5,
                endColumn: 2
            }
        }
    ],
    obligations: [
        {
            id: "obligation:guarded-numeric",
            evidenceId: "evidence:guarded-numeric",
            candidateId: "runtime-branch-target.mjs#guardedNumeric@1",
            mutationFamily: "numeric-representation",
            exportName: "guardedNumeric",
            parameterIndex: 0
        }
    ],
    samples: {
        guardedNumeric: [
            {
                label: "disabled-branch",
                args: () => [1, false],
                verify(result) {
                    if (result !== 0)
                        throw new Error("guard must stay disabled");
                },
                verifyMutation({ result }) {
                    if (result !== 0)
                        throw new Error("disabled mutation returned a value");
                }
            }
        ]
    }
});
