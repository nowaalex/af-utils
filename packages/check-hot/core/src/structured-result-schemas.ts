import { z } from "zod";

import { getProblemDefinition } from "./problems/catalog.js";

export const finiteNumberSchema = z.number().finite();
export const nonnegativeIntegerSchema = z.number().int().nonnegative().safe();
export const sha256Schema = z.string().regex(/^[0-9a-f]{64}$/u);
export const problemSchema = z.object({
    problemId: z
        .string()
        .refine(problemId => getProblemDefinition(problemId) !== undefined),
    message: z.string(),
    targetId: z.string().optional(),
    detail: z.string().optional(),
    confidence: z.enum(["low", "medium", "high"]).optional()
});
export const eventSchema = z.object({
    sequence: nonnegativeIntegerSchema,
    streamId: z.string(),
    purpose: z.enum(["preflight", "validation", "measurement", "diagnostic"]),
    phase: z.enum([
        "setup",
        "warmup",
        "optimization",
        "stress",
        "checks",
        "teardown",
        "diagnostic"
    ]),
    kind: z.enum([
        "phase-start",
        "phase-end",
        "target-tier",
        "deoptimization",
        "inline-cache-transition",
        "map-transition",
        "sampling-profile",
        "diagnostic-gap"
    ]),
    source: z.enum([
        "worker-lifecycle",
        "v8-native-intrinsics",
        "v8-log",
        "jsc-public-api",
        "cpu-profile"
    ]),
    correlation: z.enum([
        "exact-site",
        "source-line",
        "target",
        "scenario",
        "phase",
        "name-only",
        "unavailable"
    ]),
    message: z.string(),
    scenarioId: z.string().optional(),
    obligationId: z.string().optional(),
    variant: z.string().optional(),
    targetId: z.string().optional(),
    functionName: z.string().optional(),
    engineTimestamp: finiteNumberSchema.optional(),
    detail: z.string().optional()
});
const mutationFamilySchema = z.enum([
    "allocation-pressure",
    "array-elements",
    "callback-identity",
    "control-flow",
    "dynamic-code",
    "numeric-representation",
    "object-shape",
    "property-key",
    "prototype-chain",
    "return-representation"
]);
const sourceSpanSchema = z.object({
    file: z.string(),
    relativeFile: z.string(),
    sourceSha256: sha256Schema,
    start: nonnegativeIntegerSchema,
    end: nonnegativeIntegerSchema,
    line: nonnegativeIntegerSchema,
    column: nonnegativeIntegerSchema,
    endLine: nonnegativeIntegerSchema,
    endColumn: nonnegativeIntegerSchema
});
const v8CodeCreationLocationSchema = z.object({
    schemaVersion: z.literal(1),
    sourceSha256: sha256Schema,
    line: nonnegativeIntegerSchema,
    column: nonnegativeIntegerSchema,
    anchor: z.enum([
        "parameter-list-start",
        "parameter-start",
        "async-keyword-start"
    ]),
    syntaxKind: z.enum([
        "FunctionDeclaration",
        "FunctionExpression",
        "ArrowFunctionExpression",
        "ObjectMethod",
        "ObjectGetter",
        "ObjectSetter",
        "ClassMethod",
        "ClassGetter",
        "ClassSetter"
    ]),
    async: z.boolean(),
    generator: z.boolean(),
    static: z.boolean(),
    computed: z.boolean()
});
const astEvidenceSchema = z.object({
    id: z.string(),
    rule: z.string(),
    candidateId: z.string(),
    confidence: z.enum(["syntactic", "dataflow-proven"]),
    subject: z.string(),
    automation: z
        .object({
            version: z.literal(1),
            mutationFamily: mutationFamilySchema,
            parameterIndex: nonnegativeIntegerSchema,
            parameterPath: z.array(z.union([z.string(), finiteNumberSchema]))
        })
        .optional(),
    span: sourceSpanSchema,
    ownerSpan: sourceSpanSchema,
    runtimeLocations: z
        .object({ v8CodeCreation: v8CodeCreationLocationSchema.optional() })
        .optional()
});
const mutationPlanSchema = z.object({
    mode: z.enum(["stable-baseline-to-stress-variants", "adapter-owned"]),
    warmupVariants: z.array(z.string()),
    stressVariants: z.array(z.string()),
    excludedVariants: z.array(
        z.object({ variant: z.string(), reason: z.string() })
    ),
    observations: z.array(
        z.object({
            variant: z.string(),
            representation: z.string(),
            verified: z.boolean(),
            siteHitCount: nonnegativeIntegerSchema,
            guardedSiteHitCount: nonnegativeIntegerSchema.optional(),
            replayFingerprint: sha256Schema
        })
    )
});
export const preflightSchema = z.object({
    obligationId: z.string(),
    scenarioId: z.string(),
    sampleId: z.string(),
    evidenceId: z.string(),
    mutationFamily: mutationFamilySchema,
    status: z.enum(["accepted", "blocked"]),
    reason: z.string().optional(),
    siteHitCount: nonnegativeIntegerSchema.optional(),
    semanticVerification: z.enum([
        "invocation-only",
        "result-verified",
        "mutation-verified"
    ]),
    mutationPlan: mutationPlanSchema.optional()
});
export const coverageSchema = z.object({
    obligationId: z.string(),
    status: z.enum(["passed", "failed", "blocked", "unsupported", "ignored"]),
    reason: z.string(),
    scenarios: z.array(z.string()),
    evidence: astEvidenceSchema.optional(),
    preflight: preflightSchema.optional()
});
const v8DiagnosticSchema = z.object({
    oracleVersion: z.string(),
    engineVersion: z.string(),
    events: z.array(eventSchema),
    graph: z.object({
        maps: z.array(
            z.object({
                id: z.string(),
                elementsKind: z.string().optional(),
                properties: z.array(z.string())
            })
        ),
        transitions: z.array(
            z.object({
                from: z.string(),
                to: z.string(),
                property: z.string().optional(),
                reason: z.string()
            })
        ),
        inlineCaches: z.array(
            z.object({
                siteId: z.string(),
                operation: z.string(),
                from: z.string(),
                to: z.string(),
                mapId: z.string().optional(),
                key: z.string().optional(),
                line: nonnegativeIntegerSchema.optional(),
                column: nonnegativeIntegerSchema.optional(),
                correlation: eventSchema.shape.correlation,
                targetId: z.string().optional(),
                functionName: z.string().optional()
            })
        )
    }),
    targetScope: z.object({
        requestedTargetIds: z.array(z.string()),
        matchedTargetIds: z.array(z.string()),
        unmatchedTargetIds: z.array(z.string()),
        ambiguousTargetIds: z.array(z.string())
    }),
    artifact: z.string().optional(),
    gap: z.string().optional()
});
const jscDiagnosticSchema = z.object({
    oracleVersion: z.string(),
    sampleIntervalMicroseconds: nonnegativeIntegerSchema,
    totalSamples: nonnegativeIntegerSchema,
    tiers: z.record(
        z.string(),
        z.object({
            samples: nonnegativeIntegerSchema,
            percent: finiteNumberSchema
        })
    ),
    functions: z.string(),
    bytecodes: z.string(),
    stackTraces: z.array(z.string()),
    stackTraceCount: nonnegativeIntegerSchema,
    stackTracesTruncated: z.boolean(),
    gap: z.string().optional()
});
export const diagnosticsSchema = z.object({
    v8IcMaps: v8DiagnosticSchema.optional(),
    cpuProfile: z
        .object({
            oracleVersion: z.string(),
            totalSamples: nonnegativeIntegerSchema,
            unattributedSamples: nonnegativeIntegerSchema,
            functions: z.array(
                z.object({
                    functionName: z.string(),
                    url: z.string().optional(),
                    line: nonnegativeIntegerSchema.optional(),
                    column: nonnegativeIntegerSchema.optional(),
                    candidateId: z.string().optional(),
                    targetId: z.string().optional(),
                    samples: nonnegativeIntegerSchema,
                    sampleShare: finiteNumberSchema,
                    correlation: z.enum([
                        "target",
                        "source-line",
                        "name-only",
                        "unavailable"
                    ])
                })
            ),
            unobservedCandidateIds: z.array(z.string()),
            artifact: z.string().optional(),
            gap: z.string().optional()
        })
        .optional(),
    jscSampling: jscDiagnosticSchema.optional(),
    problems: z.array(problemSchema).optional()
});
const runtimeSchema = z.discriminatedUnion("engine", [
    z.object({
        name: z.enum(["node", "deno"]),
        version: z.string(),
        engine: z.literal("v8"),
        engineVersion: z.string().optional(),
        tier: z.enum(["maglev", "turbofan"]),
        oracleId: z.literal("v8-native-intrinsics"),
        oracleVersion: z.string()
    }),
    z.object({
        name: z.literal("bun"),
        version: z.string(),
        engine: z.literal("jsc"),
        engineVersion: z.string().optional(),
        tier: z.literal("jsc"),
        oracleId: z.literal("bun-jsc-public-api"),
        oracleVersion: z.string()
    })
]);

/** Runtime schema shared by live worker protocol and offline artifacts. */
export const hotWorkerResultSchema = z.object({
    suite: z.string(),
    runtime: runtimeSchema,
    adapter: z
        .object({
            id: z.string(),
            version: z.string(),
            sourceSha256: sha256Schema,
            packageTreeSha256: sha256Schema,
            probeRuntime: z.enum(["node", "deno", "bun"]),
            probeRuntimeVersion: z.string()
        })
        .optional(),
    scenarios: z.array(z.string()),
    targets: z.array(
        z.union([
            z.object({
                id: z.string(),
                functionName: z.string(),
                engine: z.literal("v8"),
                optimized: z.boolean(),
                requestedTier: z.enum(["maglev", "turbofan"]),
                activeTier: z.enum([
                    "maglev",
                    "turbofan",
                    "none",
                    "other-optimized"
                ]),
                status: nonnegativeIntegerSchema
            }),
            z.object({
                id: z.string(),
                functionName: z.string(),
                engine: z.literal("jsc"),
                compiledHistorically: z.boolean(),
                currentTier: z.literal("not-observable"),
                dfgCompiles: nonnegativeIntegerSchema,
                reoptimizationRetries: nonnegativeIntegerSchema,
                compileTime: finiteNumberSchema
            })
        ])
    ),
    checks: z.array(z.string()),
    invocations: z.record(z.string(), nonnegativeIntegerSchema),
    coverage: z.array(coverageSchema),
    preflight: z.array(preflightSchema).optional(),
    problems: z.array(problemSchema),
    events: z.array(eventSchema),
    diagnostics: z
        .object({ jscSampling: jscDiagnosticSchema.optional() })
        .optional()
});

/** Versioned terminal envelope emitted by exactly one runtime worker request. */
export const hotWorkerResultEnvelopeSchema = z
    .object({
        protocolVersion: z.literal(1),
        requestId: z.string().uuid(),
        runtime: z.enum(["node", "deno", "bun"]),
        tier: z.enum(["maglev", "turbofan", "jsc"]),
        mode: z.enum(["combined", "isolated"]),
        scenarios: z.array(z.string()),
        purpose: z.enum([
            "preflight",
            "validation",
            "measurement",
            "diagnostic"
        ]),
        diagnostic: z
            .enum(["v8-ic-maps", "cpu-profile", "jsc-sampling"])
            .optional(),
        result: hotWorkerResultSchema.strict()
    })
    .strict();
