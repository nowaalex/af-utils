import type { HotMutationFamily, HotPreflightOutcome } from "../types.js";

const maximumFailureCandidates = 8;
const maximumCandidateIdLength = 80;
const maximumCandidateReasonLength = 120;

/** Exact obligation identity shared by every deterministic sample attempt. */
export interface HotSampleSelectionIdentity {
    obligationId: string;
    evidenceId: string;
    scenarioId: string;
    mutationFamily: HotMutationFamily;
}

/** Collapse deterministic candidate attempts into one terminal obligation outcome. */
export const finalizeHotSampleSelection = (
    sampleIds: readonly string[],
    candidateOutcomes: readonly HotPreflightOutcome[],
    identity: HotSampleSelectionIdentity
): HotPreflightOutcome => {
    if (sampleIds.length === 0) {
        throw new Error(
            `Automatic ${identity.mutationFamily} preflight has no declared semantic sample candidates`
        );
    }
    if (new Set(sampleIds).size !== sampleIds.length) {
        throw new Error(
            `Automatic ${identity.mutationFamily} preflight has duplicate semantic sample candidates`
        );
    }
    if (
        candidateOutcomes.length === 0 ||
        candidateOutcomes.length > sampleIds.length
    ) {
        throw new Error(
            `Automatic ${identity.mutationFamily} preflight produced ${candidateOutcomes.length} outcomes for ${sampleIds.length} semantic sample candidates`
        );
    }
    for (const [index, outcome] of candidateOutcomes.entries()) {
        if (outcome.sampleId !== sampleIds[index]) {
            throw new Error(
                `Automatic ${identity.mutationFamily} preflight returned out-of-order sample ${outcome.sampleId}; expected ${sampleIds[index]}`
            );
        }
        if (
            outcome.obligationId !== identity.obligationId ||
            outcome.evidenceId !== identity.evidenceId ||
            outcome.scenarioId !== identity.scenarioId ||
            outcome.mutationFamily !== identity.mutationFamily
        ) {
            throw new Error(
                `Automatic ${identity.mutationFamily} preflight returned an identity-mismatched outcome for ${outcome.sampleId}`
            );
        }
    }
    const acceptedIndex = candidateOutcomes.findIndex(
        outcome => outcome.status === "accepted"
    );
    if (acceptedIndex >= 0) {
        if (acceptedIndex !== candidateOutcomes.length - 1) {
            throw new Error(
                `Automatic ${identity.mutationFamily} preflight continued after accepting a semantic sample`
            );
        }
        return candidateOutcomes[acceptedIndex];
    }
    if (candidateOutcomes.length !== sampleIds.length) {
        throw new Error(
            `Automatic ${identity.mutationFamily} preflight stopped before every semantic sample was blocked`
        );
    }

    const fallback = candidateOutcomes[0] as HotPreflightOutcome;
    // The non-empty prefix contract above guarantees a fallback here.
    const shownOutcomes = candidateOutcomes.slice(0, maximumFailureCandidates);
    const failures = shownOutcomes
        .map(
            outcome =>
                `${outcome.sampleId.slice(0, maximumCandidateIdLength)}: ${(outcome.reason ?? "blocked without a reason").slice(0, maximumCandidateReasonLength)}`
        )
        .join("; ");
    const omitted = candidateOutcomes.length - shownOutcomes.length;
    return {
        ...fallback,
        status: "blocked",
        reason: `No accepted semantic sample for ${identity.obligationId.slice(0, maximumCandidateIdLength)}: ${failures}${omitted > 0 ? `; ${omitted} more candidate(s) omitted` : ""}`
    };
};

/** Validate a persisted sample choice before a fresh measurement process uses it. */
export const assertHotSelectedSample = (
    scenarioId: string,
    declaredSampleIds: readonly string[],
    availableSampleIds: ReadonlySet<string>,
    outcome: HotPreflightOutcome
) => {
    if (!declaredSampleIds.includes(outcome.sampleId)) {
        throw new Error(
            `Measurement refused ${scenarioId}: preflight selected undeclared sample ${outcome.sampleId}`
        );
    }
    if (!availableSampleIds.has(outcome.sampleId)) {
        throw new Error(
            `Measurement refused ${scenarioId}: preflight selected missing sample ${outcome.sampleId}`
        );
    }
    return outcome.sampleId;
};
