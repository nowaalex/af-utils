import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import type {
    HotAstEvidence,
    HotCpuProfileEntry,
    HotCpuProfileSummary
} from "../../types.js";

interface CpuProfileNode {
    id: number;
    hitCount?: number;
    callFrame: {
        functionName?: string;
        url?: string;
        lineNumber?: number;
        columnNumber?: number;
    };
}

interface CpuProfile {
    nodes?: unknown;
    samples?: unknown;
}

/** One source-hash-authenticated untransformed JavaScript owner. */
export interface AuthenticatedCpuOwner {
    candidateId: string;
    file: string;
    startLine: number;
    startColumn: number;
    endLine: number;
    endColumn: number;
}

const profilePath = (url: string) => {
    try {
        return fileURLToPath(url);
    } catch {
        return url;
    }
};

const ownerContains = (
    owner: AuthenticatedCpuOwner,
    file: string,
    line: number,
    column: number
) =>
    owner.file === file &&
    (line > owner.startLine ||
        (line === owner.startLine && column >= owner.startColumn)) &&
    (line < owner.endLine ||
        (line === owner.endLine && column < owner.endColumn));

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null;

const cpuProfileNode = (value: unknown): CpuProfileNode | undefined => {
    if (
        !isRecord(value) ||
        !Number.isSafeInteger(value.id) ||
        (value.id as number) < 1 ||
        !isRecord(value.callFrame)
    ) {
        return;
    }
    const frame = value.callFrame;
    return {
        id: value.id as number,
        hitCount: value.hitCount as number | undefined,
        callFrame: {
            ...(typeof frame.functionName === "string"
                ? { functionName: frame.functionName }
                : {}),
            ...(typeof frame.url === "string" ? { url: frame.url } : {}),
            ...(Number.isSafeInteger(frame.lineNumber) &&
            (frame.lineNumber as number) >= 0
                ? { lineNumber: frame.lineNumber as number }
                : {}),
            ...(Number.isSafeInteger(frame.columnNumber) &&
            (frame.columnNumber as number) >= 0
                ? { columnNumber: frame.columnNumber as number }
                : {})
        }
    };
};

/** Authenticate JS owner spans before permitting exact CPU-profile ranking. */
export const authenticateCpuOwners = async (
    evidence: readonly HotAstEvidence[]
): Promise<readonly AuthenticatedCpuOwner[]> => {
    const byCandidate = new Map<string, HotAstEvidence>();
    const conflictingCandidates = new Set<string>();
    for (const item of evidence) {
        if (!/\.(?:c|m)?js$/u.test(item.ownerSpan.file)) continue;
        const existing = byCandidate.get(item.candidateId);
        if (
            existing &&
            (existing.ownerSpan.file !== item.ownerSpan.file ||
                existing.ownerSpan.start !== item.ownerSpan.start ||
                existing.ownerSpan.end !== item.ownerSpan.end ||
                existing.ownerSpan.sourceSha256 !== item.ownerSpan.sourceSha256)
        ) {
            conflictingCandidates.add(item.candidateId);
            byCandidate.delete(item.candidateId);
            continue;
        }
        if (conflictingCandidates.has(item.candidateId)) continue;
        byCandidate.set(item.candidateId, item);
    }
    const owners: AuthenticatedCpuOwner[] = [];
    for (const item of byCandidate.values()) {
        // oxlint-disable-next-line no-await-in-loop -- Every distinct owner must match its analyzed source hash before exact correlation.
        const source = await readFile(item.ownerSpan.file);
        if (
            createHash("sha256").update(source).digest("hex") !==
            item.ownerSpan.sourceSha256
        ) {
            continue;
        }
        owners.push({
            candidateId: item.candidateId,
            file: item.ownerSpan.file,
            startLine: item.ownerSpan.line,
            startColumn: item.ownerSpan.column,
            endLine: item.ownerSpan.endLine,
            endColumn: item.ownerSpan.endColumn
        });
    }
    return owners;
};

/** Rank a CPU profile by samples without turning absence into success. */
export const parseCpuProfile = (
    raw: string,
    owners: readonly AuthenticatedCpuOwner[] = []
): HotCpuProfileSummary => {
    let profile: CpuProfile;
    try {
        profile = JSON.parse(raw) as CpuProfile;
    } catch {
        return {
            oracleVersion: "1",
            totalSamples: 0,
            unattributedSamples: 0,
            functions: [],
            unobservedCandidateIds: owners.map(owner => owner.candidateId),
            gap: "The runtime did not produce valid CPU profile JSON."
        };
    }
    if (!isRecord(profile) || !Array.isArray(profile.nodes)) {
        return {
            oracleVersion: "1",
            totalSamples: 0,
            unattributedSamples: 0,
            functions: [],
            unobservedCandidateIds: owners
                .map(owner => owner.candidateId)
                .toSorted(),
            gap: "The CPU profile has no valid node table."
        };
    }
    const issues: string[] = [];
    const nodes = profile.nodes.flatMap(value => {
        const node = cpuProfileNode(value);
        if (!node) issues.push("invalid profile node");
        return node ? [node] : [];
    });
    const byId = new Map<number, CpuProfileNode>();
    const duplicateIds = new Set<number>();
    for (const node of nodes) {
        if (byId.has(node.id)) {
            duplicateIds.add(node.id);
            byId.delete(node.id);
        } else if (!duplicateIds.has(node.id)) {
            byId.set(node.id, node);
        }
    }
    if (duplicateIds.size > 0) issues.push("duplicate profile node IDs");
    const counts = new Map<number, number>();
    let unattributedSamples = 0;
    if (profile.samples !== undefined && !Array.isArray(profile.samples)) {
        issues.push("invalid profile sample table");
    }
    if (Array.isArray(profile.samples)) {
        for (const value of profile.samples) {
            if (!Number.isSafeInteger(value) || !byId.has(value as number)) {
                unattributedSamples++;
                continue;
            }
            const id = value as number;
            counts.set(id, (counts.get(id) ?? 0) + 1);
        }
    } else {
        for (const node of nodes) {
            const hitCount = node.hitCount ?? 0;
            if (!Number.isSafeInteger(hitCount) || hitCount < 0) {
                issues.push(`invalid hit count for node ${node.id}`);
                continue;
            }
            if (hitCount === 0) continue;
            if (duplicateIds.has(node.id)) {
                unattributedSamples += hitCount;
            } else {
                counts.set(node.id, hitCount);
            }
        }
    }
    const totalSamples = [...counts.values()].reduce(
        (total, count) => total + count,
        0
    );
    const aggregated = new Map<string, HotCpuProfileEntry>();
    for (const [id, samples] of counts) {
        const frame = (byId.get(id) as CpuProfileNode).callFrame;
        const url = frame.url || undefined;
        const file = url ? profilePath(url) : undefined;
        const line =
            frame.lineNumber === undefined ? undefined : frame.lineNumber + 1;
        const column =
            frame.columnNumber === undefined
                ? undefined
                : frame.columnNumber + 1;
        const matches =
            file === undefined || line === undefined || column === undefined
                ? []
                : owners.filter(owner =>
                      ownerContains(owner, file, line, column)
                  );
        const candidateId =
            matches.length === 1 ? matches[0].candidateId : undefined;
        const functionName = frame.functionName || "anonymous";
        const correlation = candidateId
            ? "target"
            : url && line !== undefined
              ? "source-line"
              : functionName !== "anonymous"
                ? "name-only"
                : "unavailable";
        const key = JSON.stringify([
            candidateId,
            functionName,
            url,
            line,
            column
        ]);
        const current = aggregated.get(key);
        aggregated.set(key, {
            functionName,
            url,
            line,
            column,
            candidateId,
            samples: (current?.samples ?? 0) + samples,
            sampleShare: 0,
            correlation
        });
    }
    const functions = [...aggregated.values()]
        .map(entry =>
            Object.assign(entry, {
                sampleShare: entry.samples / totalSamples
            })
        )
        .toSorted((left, right) => right.samples - left.samples);
    const observedCandidates = new Set(
        functions.flatMap(entry =>
            entry.candidateId ? [entry.candidateId] : []
        )
    );
    if (
        owners.length > 0 &&
        totalSamples > 0 &&
        observedCandidates.size === 0
    ) {
        issues.push("no authenticated analyzer candidate was sampled");
    }
    return {
        oracleVersion: "1",
        totalSamples,
        unattributedSamples,
        functions,
        unobservedCandidateIds: [
            ...new Set(
                owners
                    .map(owner => owner.candidateId)
                    .filter(candidateId => !observedCandidates.has(candidateId))
            )
        ].toSorted(),
        gap:
            issues.length > 0
                ? `The CPU profile is only partially usable: ${[...new Set(issues)].join("; ")}.`
                : unattributedSamples > 0 && totalSamples === 0
                  ? `None of ${unattributedSamples} CPU sample(s) could be attributed to a valid profile node.`
                  : unattributedSamples > 0
                    ? `${unattributedSamples} CPU sample(s) could not be attributed; shares use only the ${totalSamples} attributable sample(s).`
                    : totalSamples === 0
                      ? "The profiler observed zero samples; target hotness is unobserved, not passed."
                      : undefined
    };
};
