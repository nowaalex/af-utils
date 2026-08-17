import type { HotProblemDefinition } from "./types.js";

type ProblemInput = Pick<
    HotProblemDefinition,
    | "id"
    | "title"
    | "layer"
    | "outcome"
    | "evidence"
    | "likelyCauses"
    | "confirmWith"
    | "remediations"
>;

/** Add shared, structured diagnosis metadata to one feature's problem list. */
export const defineProblemDefinitions = <
    const Definitions extends readonly ProblemInput[]
>(
    feature: string,
    documentation: string,
    definitions: Definitions
) =>
    definitions.map(problem => ({
        ...problem,
        feature,
        documentation,
        evidence: problem.evidence,
        likelyCauses: problem.likelyCauses,
        confirmWith: problem.confirmWith,
        remediations: problem.remediations
    })) as unknown as {
        readonly [Index in keyof Definitions]: Definitions[Index] &
            HotProblemDefinition;
    };
