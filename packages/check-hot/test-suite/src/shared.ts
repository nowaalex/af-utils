import { satisfies } from "semver";

import type {
    HotModuleFunction,
    HotModuleSample,
    HotModuleTestRunner,
    HotModuleTestRunnerContext,
    HotPublicFunctionLocator,
    HotRuntimeName
} from "@af-utils/check-hot";

/** Runtime versions declared compatible with these recipe implementations. */
export const supportedRuntimeRanges: Readonly<Record<HotRuntimeName, string>> =
    {
        node: ">=20.19 <21 || >=22.12 <28",
        deno: ">=2 <3",
        bun: ">=1.2 <2"
    };

/** Version shared by every runner exported from this package release. */
export const testRunnerVersion = "0.1.0";

/** Resolve candidate samples for one discovered function. */
export type HotRecipeResolver = (
    candidate: HotModuleFunction,
    context: HotModuleTestRunnerContext
) => readonly HotModuleSample[];

/** Declarative policy used to construct one version-aware test runner. */
export interface HotRecipeTestRunnerOptions {
    /** Stable runner ID stored in generated probe manifests. */
    id: string;
    /** Exact runner implementation version. */
    version: string;
    /** Package names accepted by this runner; omit for a generic runner. */
    packageNames?: readonly string[];
    /** Supported target-package versions. */
    packageRange?: string;
    /** Supported JavaScript runtime versions. */
    runtimeRanges?: Readonly<Partial<Record<HotRuntimeName, string>>>;
    /** Produce deterministic candidate samples. */
    resolve: HotRecipeResolver;
    /** Locate package-owned public callables below the top-level namespace. */
    discover?: (
        context: HotModuleTestRunnerContext
    ) => readonly HotPublicFunctionLocator[];
    /** Maximum duration of one disposable recipe invocation. */
    perSampleTimeoutMs?: number;
}

const validateVersion = (
    label: string,
    version: string | undefined,
    range: string,
    issues: string[]
) => {
    if (!version || version === "unknown") {
        issues.push(`${label} has no exact version; expected ${range}`);
    } else if (!satisfies(version, range, { includePrerelease: true })) {
        issues.push(
            `${label}@${version} is outside the declared compatible range ${range}`
        );
    }
};

/** Build a declarative runner whose recipes are executed only by core workers. */
export const createRecipeTestRunner = (
    options: HotRecipeTestRunnerOptions
): HotModuleTestRunner => ({
    id: options.id,
    version: options.version,
    coveragePolicy: "seed-only",
    perSampleTimeoutMs: options.perSampleTimeoutMs ?? 1_000,
    ...(options.discover ? { discover: options.discover } : {}),
    validate(context) {
        const issues: string[] = [];
        if (options.packageNames) {
            if (!context.package.name) {
                issues.push(
                    `target package has no name; expected ${options.packageNames.join(" or ")}`
                );
            } else if (!options.packageNames.includes(context.package.name)) {
                issues.push(
                    `target package ${context.package.name} is not ${options.packageNames.join(" or ")}`
                );
            }
        }
        if (options.packageRange) {
            validateVersion(
                context.package.name ?? "target package",
                context.package.version,
                options.packageRange,
                issues
            );
        }
        const runtimeRange =
            options.runtimeRanges?.[context.runtime.name] ??
            supportedRuntimeRanges[context.runtime.name];
        validateVersion(
            context.runtime.name,
            context.runtime.version,
            runtimeRange,
            issues
        );
        return issues;
    },
    listSamples(context) {
        const selected: Record<string, string[]> = {};
        for (const [name, candidate] of context.functions) {
            const labels = options
                .resolve(candidate, context)
                .map(sample => sample.label);
            if (labels.length > 0) selected[name] = labels;
        }
        return selected;
    },
    createSamples(context, selected) {
        const samples: Record<string, HotModuleSample[]> = {};
        for (const [name, labels] of Object.entries(selected)) {
            const candidate = context.functions.get(name);
            if (!candidate) {
                throw new Error(
                    `Probe selected ${name}, but that function is absent from the loaded module`
                );
            }
            const available = new Map(
                options
                    .resolve(candidate, context)
                    .map(sample => [sample.label, sample])
            );
            samples[name] = labels.map(label => {
                const sample = available.get(label);
                if (!sample) {
                    throw new Error(
                        `Probe selected ${name}:${label}, but runner ${options.id}@${options.version} no longer provides it`
                    );
                }
                return sample;
            });
        }
        return samples;
    }
});
