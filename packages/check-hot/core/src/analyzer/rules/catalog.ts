import { ruleDefinitions as arrayElements } from "./array-elements/detector.js";
import { ruleDefinitions as callbackIdentity } from "./callback-identity/detector.js";
import { ruleDefinitions as compilationComplexity } from "./compilation-complexity/detector.js";
import { ruleDefinitions as dynamicCode } from "./dynamic-code/detector.js";
import { ruleDefinitions as loopPressure } from "./loop-pressure/detector.js";
import { ruleDefinitions as numericRepresentation } from "./numeric-representation/detector.js";
import { ruleDefinitions as parameterReceiver } from "./parameter-receiver/detector.js";
import { ruleDefinitions as propertyDeletion } from "./property-deletion/detector.js";
import { ruleDefinitions as propertyKey } from "./property-key/detector.js";
import { ruleDefinitions as returnRepresentation } from "./return-representation/detector.js";
import { ruleDefinitions as shapeMutation } from "./shape-mutation/detector.js";

/** Every static problem definition, owned beside its AST detector. */
export const analyzerProblemDefinitions = [
    ...arrayElements,
    ...callbackIdentity,
    ...compilationComplexity,
    ...dynamicCode,
    ...loopPressure,
    ...numericRepresentation,
    ...parameterReceiver,
    ...propertyDeletion,
    ...propertyKey,
    ...returnRepresentation,
    ...shapeMutation
] as const;

const ids = analyzerProblemDefinitions.map(definition => definition.id);
if (new Set(ids).size !== ids.length) {
    throw new Error("Analyzer rule catalog contains duplicate IDs");
}

/** Mutation family indexed by feature-owned analyzer rule ID. */
export const mutationFamilyByRule = Object.fromEntries(
    analyzerProblemDefinitions.map(definition => [
        definition.id,
        definition.mutationFamily
    ])
);

/** Rules whose detector and generic mutator can form runtime obligations. */
export const runtimeExperimentRules: ReadonlySet<string> = new Set(
    analyzerProblemDefinitions
        .filter(definition => definition.runtimeExperiment)
        .map(definition => definition.id)
);
