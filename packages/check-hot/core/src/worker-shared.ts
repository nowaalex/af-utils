import type {
    HotCheckContext,
    HotCheckPhase,
    HotCoverageLedgerEntry,
    HotEngineInspection,
    HotMutationFamily,
    HotPhase,
    HotPreflightOutcome,
    HotRuntimeInfo,
    HotScenario,
    HotScenarioContext,
    HotSuite,
    HotTarget
} from "./types.js";
import { sourceIntegrityFailure } from "./problems/source-integrity/check.js";
import { hotMutationVariantLabels } from "./mutations.js";

/** Runtime-independent resolved state used by V8 and JavaScriptCore workers. */
export interface ResolvedHotWork {
    /** Imported suite. */
    suite: HotSuite<unknown>;
    /** Fresh suite state. */
    state: unknown;
    /** Selected scenarios. */
    scenarios: readonly HotScenario<unknown>[];
    /** Selected direct targets. */
    targets: ReadonlyMap<string, CallableFunction>;
    /** Direct invocation counters. */
    invocations: Map<string, number>;
    /** Targets required to be reached through the phase-aware invocation API. */
    requiredInvocations: ReadonlySet<string>;
}

const awaitPossiblePromise = async (value: void | Promise<void>) => {
    await value;
};

/** Import a suite and, inside workers, authenticate its runtime artifacts. */
export const loadHotSuite = async (
    suiteUrl: string,
    runtime?: HotRuntimeInfo
) => {
    const imported = (await import(suiteUrl)) as { default?: unknown };
    const suite = imported.default as HotSuite<unknown> | undefined;

    if (!suite || typeof suite !== "object") {
        throw new Error(`Hot suite ${suiteUrl} has no default object export`);
    }
    if (!suite.name || typeof suite.setup !== "function") {
        throw new Error(`Hot suite ${suiteUrl} is missing its name or setup`);
    }
    if (!Array.isArray(suite.scenarios)) {
        throw new Error(`Hot suite ${suite.name} has invalid scenarios`);
    }
    if (suite.workerLoader !== undefined && suite.workerLoader !== "tsx") {
        throw new Error(`Hot suite ${suite.name} has an invalid worker loader`);
    }
    if (
        suite.analysis?.sourceLoader !== undefined &&
        suite.analysis.sourceLoader !== "tsx"
    ) {
        throw new Error(`Hot suite ${suite.name} has an invalid source loader`);
    }
    if (
        suite.analysis?.runtime !== undefined &&
        !["node", "deno", "bun"].includes(suite.analysis.runtime)
    ) {
        throw new Error(
            `Hot suite ${suite.name} has an invalid analysis runtime`
        );
    }
    if (
        runtime &&
        suite.analysis?.runtime !== undefined &&
        suite.analysis.runtime !== runtime.name
    ) {
        throw new Error(
            `Suite evidence was analyzed for ${suite.analysis.runtime}, but worker runtime is ${runtime.name}`
        );
    }
    if (suite.analysis?.entryPackagePath) {
        const entryPackagePath = suite.analysis.entryPackagePath;
        if (
            entryPackagePath.startsWith("/") ||
            entryPackagePath === ".." ||
            entryPackagePath.startsWith("../") ||
            entryPackagePath.includes("\\")
        ) {
            throw new Error(
                `Hot suite ${suite.name} has an invalid package-relative entry path`
            );
        }
    }
    if (suite.analysis?.sourceGraph) {
        const sourcePaths = suite.analysis.sourceGraph.map(
            source => source.relativeFile
        );
        if (new Set(sourcePaths).size !== sourcePaths.length) {
            throw new Error(
                `Hot suite ${suite.name} has duplicate analyzed source paths`
            );
        }
        for (const source of suite.analysis.sourceGraph) {
            if (
                !source.relativeFile ||
                source.relativeFile.startsWith("/") ||
                source.relativeFile === ".." ||
                source.relativeFile.startsWith("../") ||
                source.relativeFile.includes("\\") ||
                !/^[a-f\d]{64}$/u.test(source.sourceSha256)
            ) {
                throw new Error(
                    `Hot suite ${suite.name} has an invalid analyzed source identity`
                );
            }
        }
        if (
            suite.analysis.entryPackagePath &&
            suite.analysis.entrySourceSha256 &&
            !suite.analysis.sourceGraph.some(
                source =>
                    source.relativeFile === suite.analysis?.entryPackagePath &&
                    source.sourceSha256 === suite.analysis.entrySourceSha256
            )
        ) {
            throw new Error(
                `Hot suite ${suite.name} source graph does not contain its analyzed entry identity`
            );
        }
    }
    if (suite.analysis?.externalBoundaries) {
        const boundaryKeys = suite.analysis.externalBoundaries.map(
            boundary =>
                `${boundary.importer}\0${boundary.mode}\0${boundary.request}\0${boundary.packageName ?? ""}\0${boundary.packageRelativeFile}`
        );
        if (new Set(boundaryKeys).size !== boundaryKeys.length) {
            throw new Error(
                `Hot suite ${suite.name} has duplicate external module boundaries`
            );
        }
        for (const boundary of suite.analysis.externalBoundaries) {
            if (
                !boundary.importer ||
                boundary.importer.startsWith("/") ||
                boundary.importer === ".." ||
                boundary.importer.startsWith("../") ||
                boundary.importer.includes("\\") ||
                !boundary.request ||
                (boundary.mode !== "import" && boundary.mode !== "require") ||
                !boundary.packageRelativeFile ||
                boundary.packageRelativeFile.startsWith("/") ||
                boundary.packageRelativeFile === ".." ||
                boundary.packageRelativeFile.startsWith("../") ||
                boundary.packageRelativeFile.includes("\\")
            ) {
                throw new Error(
                    `Hot suite ${suite.name} has an invalid external module boundary`
                );
            }
        }
    }
    if (suite.analysis?.packageTree) {
        const tree = suite.analysis.packageTree;
        if (
            !/^[a-f\d]{64}$/u.test(tree.sourceSha256) ||
            !Number.isSafeInteger(tree.fileCount) ||
            tree.fileCount < 0 ||
            new Set(tree.ignoredRelativeFiles).size !==
                tree.ignoredRelativeFiles.length ||
            tree.ignoredRelativeFiles.some(
                file =>
                    !file ||
                    file.startsWith("/") ||
                    file === ".." ||
                    file.startsWith("../") ||
                    file.includes("\\")
            )
        ) {
            throw new Error(
                `Hot suite ${suite.name} has an invalid package-tree identity`
            );
        }
    }
    if (runtime) await suite.prepare?.({ runtime });
    if (suite.targets !== undefined && !Array.isArray(suite.targets)) {
        throw new Error(`Hot suite ${suite.name} has invalid targets`);
    }
    const evidenceIds = (suite.evidence ?? []).map(item => item.id);
    if (new Set(evidenceIds).size !== evidenceIds.length) {
        throw new Error(`Hot suite ${suite.name} has duplicate evidence IDs`);
    }
    const obligationIds = (suite.obligations ?? []).map(item => item.id);
    if (new Set(obligationIds).size !== obligationIds.length) {
        throw new Error(`Hot suite ${suite.name} has duplicate obligation IDs`);
    }
    const obligationIdSet = new Set(obligationIds);
    const scenarioIds = suite.scenarios.map(item => item.id);
    if (new Set(scenarioIds).size !== scenarioIds.length) {
        throw new Error(`Hot suite ${suite.name} has duplicate scenario IDs`);
    }
    for (const scenario of suite.scenarios) {
        const claims = scenario.obligations ?? [];
        if (new Set(claims).size !== claims.length) {
            throw new Error(
                `Hot scenario ${scenario.id} has duplicate obligation claims`
            );
        }
        for (const obligationId of claims) {
            if (!obligationIdSet.has(obligationId)) {
                throw new Error(
                    `Hot scenario ${scenario.id} refers to unknown obligation ${obligationId}`
                );
            }
        }
    }
    if ((suite.obligations?.length ?? 0) > 0) {
        const evidenceById = new Map(
            (suite.evidence ?? []).map(evidence => [evidence.id, evidence])
        );
        const path = await import("node:path");
        const sourceTools = runtime
            ? await Promise.all([
                  import("node:fs/promises"),
                  import("node:crypto")
              ])
            : undefined;
        const verifiedFiles = new Map<string, number>();
        const obligatedEvidence = new Set<string>();
        for (const obligation of suite.obligations ?? []) {
            const evidence = evidenceById.get(obligation.evidenceId);
            if (!evidence) {
                throw new Error(
                    `Hot obligation ${obligation.id} refers to missing evidence ${obligation.evidenceId}`
                );
            }
            if (obligation.candidateId !== evidence.candidateId) {
                throw new Error(
                    `Hot obligation ${obligation.id} and evidence ${evidence.id} have different candidate identities`
                );
            }
            if (obligatedEvidence.has(evidence.id)) {
                throw new Error(
                    `Hot evidence ${evidence.id} is referenced by more than one obligation`
                );
            }
            obligatedEvidence.add(evidence.id);
            const proof = evidence.automation;
            const obligationPath = obligation.parameterPath ?? [];
            if (
                evidence.confidence !== "dataflow-proven" ||
                proof?.version !== 1 ||
                proof.mutationFamily !== obligation.mutationFamily ||
                proof.parameterIndex !== obligation.parameterIndex ||
                proof.parameterPath.length !== obligationPath.length ||
                proof.parameterPath.some(
                    (part, index) => part !== obligationPath[index]
                )
            ) {
                throw new Error(
                    `Hot obligation ${obligation.id} does not match a dataflow-proven analyzer automation proof`
                );
            }
            if (
                obligation.parameterIndex !== undefined &&
                (!Number.isSafeInteger(obligation.parameterIndex) ||
                    obligation.parameterIndex < 0)
            ) {
                throw new Error(
                    `Hot obligation ${obligation.id} has an invalid parameter index`
                );
            }
            const span = evidence.span;
            if (
                !path.isAbsolute(span.file) ||
                !span.relativeFile ||
                !/^[a-f\d]{64}$/u.test(span.sourceSha256) ||
                evidence.ownerSpan.file !== span.file ||
                evidence.ownerSpan.relativeFile !== span.relativeFile ||
                evidence.ownerSpan.sourceSha256 !== span.sourceSha256
            ) {
                throw new Error(
                    `Hot evidence ${evidence.id} has no absolute file, relative locator, and SHA-256 source identity`
                );
            }
            if (
                span.start < 0 ||
                span.end <= span.start ||
                evidence.ownerSpan.start < 0 ||
                evidence.ownerSpan.end <= evidence.ownerSpan.start ||
                evidence.ownerSpan.start > span.start ||
                evidence.ownerSpan.end < span.end
            ) {
                throw new Error(
                    `Hot evidence ${evidence.id} has invalid or out-of-owner source offsets`
                );
            }
            if (sourceTools) {
                const [{ readFile }, { createHash }] = sourceTools;
                const identity = `${span.file}\u0000${span.sourceSha256}`;
                let sourceLength = verifiedFiles.get(identity);
                if (sourceLength === undefined) {
                    // oxlint-disable-next-line no-await-in-loop -- Every distinct evidence source must be authenticated before execution.
                    const source = await readFile(span.file, "utf8");
                    const actual = createHash("sha256")
                        .update(source)
                        .digest("hex");
                    if (actual !== span.sourceSha256) {
                        throw sourceIntegrityFailure(
                            `Hot evidence source changed after analysis: ${span.relativeFile} (${actual} != ${span.sourceSha256})`
                        );
                    }
                    sourceLength = source.length;
                    verifiedFiles.set(identity, sourceLength);
                }
                if (
                    span.end > sourceLength ||
                    evidence.ownerSpan.end > sourceLength
                ) {
                    throw new Error(
                        `Hot evidence ${evidence.id} points outside ${span.relativeFile}`
                    );
                }
            }
        }
    }

    return suite;
};

/** Return the stable ID for either target declaration form. */
export const getHotTargetId = <State>(target: string | HotTarget<State>) =>
    typeof target === "string" ? target : target.id;

/** Collect top-level and scenario-local targets without duplicating IDs. */
export const collectHotTargets = <State>(suite: HotSuite<State>) => {
    const targetById = new Map<string, HotTarget<State>>();
    const register = (target: HotTarget<State>) => {
        const existing = targetById.get(target.id);
        if (existing && existing !== target) {
            throw new Error(
                `Hot target ${target.id} is declared more than once`
            );
        }
        targetById.set(target.id, target);
    };

    for (const target of suite.targets ?? []) register(target);
    for (const scenario of suite.scenarios) {
        for (const target of scenario.targets) {
            if (typeof target !== "string") register(target);
        }
    }
    return targetById;
};

/** Resolve selected scenarios and the exact target functions they cover. */
export const resolveHotWork = async (
    suite: HotSuite<unknown>,
    selectedScenarioIds: readonly string[],
    runtime: HotRuntimeInfo,
    inspect: boolean,
    preflightOutcomes: readonly HotPreflightOutcome[] = []
): Promise<ResolvedHotWork> => {
    if (
        suite.analysis?.runtime !== undefined &&
        suite.analysis.runtime !== runtime.name
    ) {
        throw new Error(
            `Suite evidence was analyzed for ${suite.analysis.runtime}, but worker runtime is ${runtime.name}; generate a separate evidence plan for this runtime`
        );
    }
    const scenarioById = new Map<string, HotScenario<unknown>>();
    for (const scenario of suite.scenarios) {
        if (scenarioById.has(scenario.id)) {
            throw new Error(
                `Hot scenario ${scenario.id} is declared more than once`
            );
        }
        scenarioById.set(scenario.id, scenario);
    }

    const scenarios = selectedScenarioIds.map(id => {
        const scenario = scenarioById.get(id);
        if (!scenario) throw new Error(`Unknown hot scenario ${id}`);
        return scenario;
    });
    const selectedTargetIds = new Set(
        scenarios.flatMap(scenario => scenario.targets.map(getHotTargetId))
    );
    const targetById = collectHotTargets(suite);
    for (const targetId of selectedTargetIds) {
        if (!targetById.has(targetId)) {
            throw new Error(
                `Scenario refers to unknown hot target ${targetId}`
            );
        }
    }

    const state = await suite.setup({
        runtime,
        inspect,
        scenarios: selectedScenarioIds,
        preflightOutcomes
    });
    const targets = new Map<string, CallableFunction>();
    const functions = new Set<CallableFunction>();

    for (const targetId of selectedTargetIds) {
        const fn = targetById.get(targetId)?.resolve(state);
        if (typeof fn !== "function") {
            throw new Error(
                `Hot target ${targetId} did not resolve to a function`
            );
        }
        if (functions.has(fn)) {
            throw new Error(
                `Hot target ${targetId} duplicates another runtime function reference`
            );
        }
        functions.add(fn);
        targets.set(targetId, fn);
    }

    return {
        suite,
        state,
        scenarios,
        targets,
        invocations: new Map([...targets.keys()].map(id => [id, 0])),
        requiredInvocations: new Set(
            [...selectedTargetIds].filter(
                id => targetById.get(id)?.requireInvocation !== false
            )
        )
    };
};

/** Run one complete warmup or stress phase without optimizing harness callbacks. */
export const runHotPhase = async (
    work: ResolvedHotWork,
    runtime: HotRuntimeInfo,
    phase: HotPhase,
    neverOptimize: (fn: CallableFunction) => void,
    iterationOverride?: number,
    measureIteration?: (
        scenario: HotScenario<unknown>,
        iteration: number,
        action: () => Promise<void>
    ) => Promise<void>,
    scenarioEvent?: (
        kind: "phase-start" | "phase-end",
        scenario: HotScenario<unknown>,
        phase: HotPhase
    ) => void
) => {
    const invocationsBefore = new Map(work.invocations);
    const defaultIterations =
        iterationOverride ??
        (phase === "warmup"
            ? (work.suite.options?.warmupIterations ?? 10_000)
            : (work.suite.options?.stressIterations ?? 2_000));
    const invoke = (
        targetReference: string | HotTarget<unknown>,
        receiver: unknown,
        args: readonly unknown[] = []
    ) => {
        const targetId = getHotTargetId(targetReference);
        const target = work.targets.get(targetId);
        if (!target) {
            throw new Error(
                `Scenario invoked ${targetId}, which it did not select`
            );
        }
        work.invocations.set(
            targetId,
            (work.invocations.get(targetId) ?? 0) + 1
        );
        return Reflect.apply(target, receiver, args);
    };

    for (const scenario of work.scenarios) {
        scenarioEvent?.("phase-start", scenario, phase);
        if (phase === "warmup") {
            neverOptimize(scenario.run);
            if (scenario.before) neverOptimize(scenario.before);
            if (scenario.after) neverOptimize(scenario.after);
        }

        const context: HotScenarioContext<unknown> = {
            state: work.state,
            phase,
            iteration: 0,
            runtime,
            invoke
        };
        // oxlint-disable-next-line no-await-in-loop -- Scenario lifecycle transitions must remain strictly ordered.
        await awaitPossiblePromise(scenario.before?.(context));

        const iterations =
            phase === "warmup"
                ? (scenario.warmupIterations ?? defaultIterations)
                : (scenario.stressIterations ?? defaultIterations);
        /* oxlint-disable no-await-in-loop -- Scenario iterations and coverage snapshots intentionally share ordered state. */
        for (let iteration = 0; iteration < iterations; iteration++) {
            context.iteration = iteration;
            const action = () => awaitPossiblePromise(scenario.run(context));
            if (measureIteration) {
                await measureIteration(scenario, iteration, action);
            } else {
                await action();
            }
        }
        /* oxlint-enable no-await-in-loop */

        // oxlint-disable-next-line no-await-in-loop -- Cleanup must finish before the next scenario starts.
        await awaitPossiblePromise(scenario.after?.(context));
        scenarioEvent?.("phase-end", scenario, phase);
    }

    for (const targetId of work.requiredInvocations) {
        const before = invocationsBefore.get(targetId) ?? 0;
        const after = work.invocations.get(targetId) ?? 0;
        if (after === before) {
            throw new Error(
                `Hot target ${targetId} was not invoked during ${phase}; call context.invoke() or set requireInvocation: false for an intentionally nested target`
            );
        }
    }
};

/** Run engine-aware suite checks registered for one lifecycle point. */
export const runHotChecks = async (
    work: ResolvedHotWork,
    runtime: HotRuntimeInfo,
    engine: HotEngineInspection,
    phase: HotCheckPhase,
    inspect: boolean,
    completed: string[]
) => {
    for (const check of work.suite.checks ?? []) {
        if ((check.phase ?? "afterStress") !== phase) continue;
        if (check.engines && !check.engines.includes(engine.kind)) continue;
        if (
            check.scenarios &&
            !work.scenarios.some(scenario =>
                check.scenarios?.includes(scenario.id)
            )
        )
            continue;

        const expect: HotCheckContext<unknown>["expect"] = (
            condition,
            message
        ): asserts condition => {
            if (!condition) throw new Error(`${check.id}: ${message}`);
        };
        // oxlint-disable-next-line no-await-in-loop -- Invariants may depend on effects of earlier checks.
        await check.run({
            state: work.state,
            runtime,
            engine,
            inspect,
            expect
        });
        completed.push(check.id);
    }
};

/** Convert invocation counters into stable JSON object order. */
export const serializeInvocations = (invocations: Map<string, number>) =>
    Object.fromEntries(
        [...invocations.entries()].toSorted(([left], [right]) =>
            left.localeCompare(right)
        )
    );

const planProvesTransition = (
    family: HotMutationFamily,
    preflight: HotPreflightOutcome
) => {
    const observations = preflight.mutationPlan?.observations ?? [];
    const stress = observations.filter(
        observation => observation.variant !== "adapter-baseline"
    );
    const exclusions = preflight.mutationPlan?.excludedVariants ?? [];
    const baselineRepresentation = observations[0]?.representation;
    const expectedStressVariants =
        preflight.mutationPlan?.mode === "stable-baseline-to-stress-variants"
            ? hotMutationVariantLabels(family)
            : Array.from(
                  { length: 6 },
                  (_, index) => `adapter-variant-${index}`
              );
    if (
        observations[0]?.variant !== "adapter-baseline" ||
        stress.length + exclusions.length !== expectedStressVariants.length ||
        new Set([
            ...stress.map(observation => observation.variant),
            ...exclusions.map(exclusion => exclusion.variant)
        ]).size !== expectedStressVariants.length ||
        expectedStressVariants.some(
            variant =>
                !stress.some(observation => observation.variant === variant) &&
                !exclusions.some(exclusion => exclusion.variant === variant)
        ) ||
        exclusions.some(
            exclusion =>
                exclusion.reason.length === 0 || exclusion.reason.length > 500
        ) ||
        preflight.mutationPlan?.stressVariants.length !== stress.length ||
        preflight.mutationPlan.stressVariants.some(
            (variant, index) => variant !== stress[index]?.variant
        )
    ) {
        return false;
    }
    switch (family) {
        case "dynamic-code":
            return stress.some(
                observation => observation.representation === "site-executed"
            );
        default:
            return (
                baselineRepresentation !== undefined &&
                stress.some(
                    observation =>
                        observation.representation !== baselineRepresentation
                )
            );
    }
};

/** Account for every AST obligation without treating absence as success. */
export const createCoverageLedger = <State>(
    suite: HotSuite<State>,
    selectedScenarioIds: readonly string[],
    runStatus: "passed" | "failed" | "unsupported",
    preflightOutcomes: readonly HotPreflightOutcome[] = []
): readonly HotCoverageLedgerEntry[] => {
    const selected = new Set(selectedScenarioIds);
    const allScenariosByObligation = new Map<string, string[]>();
    for (const scenario of suite.scenarios) {
        for (const obligationId of scenario.obligations ?? []) {
            const scenarios = allScenariosByObligation.get(obligationId) ?? [];
            scenarios.push(scenario.id);
            allScenariosByObligation.set(obligationId, scenarios);
        }
    }

    return (suite.obligations ?? []).map(obligation => {
        const evidence = suite.evidence?.find(
            item => item.id === obligation.evidenceId
        );
        const declaredScenarios =
            allScenariosByObligation.get(obligation.id) ?? [];
        const exercised = declaredScenarios.filter(id => selected.has(id));
        const matchingPreflights = preflightOutcomes.filter(
            outcome =>
                outcome.obligationId === obligation.id &&
                outcome.evidenceId === obligation.evidenceId &&
                outcome.mutationFamily === obligation.mutationFamily &&
                exercised.includes(outcome.scenarioId)
        );
        const preflight =
            matchingPreflights.length === 1 ? matchingPreflights[0] : undefined;
        const guardedMisses =
            preflight?.mutationPlan?.observations
                .filter(
                    observation =>
                        observation.variant !== "adapter-baseline" &&
                        (observation.guardedSiteHitCount ?? 0) < 1
                )
                .map(observation => observation.variant) ?? [];
        const attachEvidence = (entry: HotCoverageLedgerEntry) => {
            if (preflight) entry.preflight = preflight;
            if (evidence) entry.evidence = evidence;
            return entry;
        };
        if (obligation.blockedReason) {
            return attachEvidence({
                obligationId: obligation.id,
                status: obligation.blockedReason.startsWith("Excluded by user")
                    ? "ignored"
                    : "blocked",
                reason: obligation.blockedReason,
                scenarios: []
            });
        }
        if (exercised.length > 0) {
            if (
                !preflight ||
                preflight.status !== "accepted" ||
                preflight.semanticVerification !== "mutation-verified" ||
                (preflight.siteHitCount ?? 0) < 1 ||
                !preflight.mutationPlan ||
                preflight.mutationPlan.warmupVariants.length === 0 ||
                preflight.mutationPlan.stressVariants.length === 0 ||
                preflight.mutationPlan.observations.length === 0 ||
                preflight.mutationPlan.observations.some(
                    observation =>
                        !observation.verified ||
                        observation.siteHitCount < 1 ||
                        (observation.variant !== "adapter-baseline" &&
                            (observation.guardedSiteHitCount ?? 0) < 1) ||
                        !/^[a-f\d]{64}$/u.test(observation.replayFingerprint)
                ) ||
                !planProvesTransition(obligation.mutationFamily, preflight)
            ) {
                return attachEvidence({
                    obligationId: obligation.id,
                    status: "blocked",
                    reason:
                        preflight?.reason ??
                        (guardedMisses.length > 0
                            ? `Semantic ${obligation.mutationFamily} variants did not each reach exact AST evidence during guarded stress: ${guardedMisses.join(", ")}`
                            : matchingPreflights.length > 1
                              ? "Exact obligation has duplicate matching preflight outcomes"
                              : "Exact obligation has no identity-matched, args-aware, AST-site-reaching preflight evidence"),
                    scenarios: []
                });
            }
            return attachEvidence({
                obligationId: obligation.id,
                status: runStatus,
                reason:
                    runStatus === "passed"
                        ? `Exact ${obligation.mutationFamily} sample completed and the guarded target satisfied the runtime oracle`
                        : runStatus === "unsupported"
                          ? "The selected runtime cannot observe the required optimization state"
                          : "An exact-family scenario or its guarded runtime oracle failed",
                scenarios: exercised
            });
        }
        if (declaredScenarios.length > 0) {
            return attachEvidence({
                obligationId: obligation.id,
                status: "ignored",
                reason: "The matrix cell selected other scenarios",
                scenarios: []
            });
        }
        return attachEvidence({
            obligationId: obligation.id,
            status: "blocked",
            reason: `No scenario declares exact ${obligation.mutationFamily} coverage`,
            scenarios: []
        });
    });
};
