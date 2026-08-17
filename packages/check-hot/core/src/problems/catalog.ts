import { analyzerProblemDefinitions } from "../analyzer/rules/catalog.js";
import { runtimeProblemDefinitions } from "../runtime-oracles/catalog.js";
import type { HotProblemDefinition } from "./types.js";
import { problemDefinitions as coverageProof } from "./coverage-proof/problem.js";
import { problemDefinitions as annotationContract } from "./annotation-contract/problem.js";
import { problemDefinitions as moduleGraph } from "./module-graph/problem.js";
import { problemDefinitions as sourceIntegrity } from "./source-integrity/problem.js";

/** Single discoverable index of every problem check-hot can currently name. */
export const problemDefinitions = [
    ...analyzerProblemDefinitions,
    ...runtimeProblemDefinitions,
    ...annotationContract,
    ...coverageProof,
    ...moduleGraph,
    ...sourceIntegrity
] as const;

/** Stable closed union used by structured runtime occurrences. */
export type HotProblemId = (typeof problemDefinitions)[number]["id"];

const ids = problemDefinitions.map(definition => definition.id);
if (new Set(ids).size !== ids.length) {
    throw new Error("Problem catalog contains duplicate IDs");
}

/** Problem metadata indexed by analyzer rule/runtime occurrence ID. */
export const problemById = new Map<string, HotProblemDefinition>(
    problemDefinitions.map(definition => [definition.id, definition] as const)
);

/** Resolve one stable problem ID for reports and API consumers. */
export const getProblemDefinition = (problemId: string) =>
    problemById.get(problemId);
