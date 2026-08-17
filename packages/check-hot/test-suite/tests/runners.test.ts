import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";

import { describe, expect, test } from "vitest";

import automaticTestRunner from "../src/auto.js";
import dateFnsTestRunner, { dateFnsPackageRange } from "../src/date-fns.js";
import lodashTestRunner, { lodashPackageRange } from "../src/lodash.js";
import reactTestRunner, { reactPackageRange } from "../src/react.js";
import { createRecipeTestRunner, testRunnerVersion } from "../src/shared.js";
import svelteTestRunner, { sveltePackageRange } from "../src/svelte.js";
import threeTestRunner, { threePackageRange } from "../src/three.js";
import packageManifest from "../package.json" with { type: "json" };
import type {
    HotModuleFunction,
    HotModuleTestRunner,
    HotModuleTestRunnerContext
} from "@af-utils/check-hot";
import {
    discoverModuleFunctions,
    resolveRunnerFunctionLocators,
    runHotSuite
} from "@af-utils/check-hot";
import {
    analyzeHotModule,
    generateHotSuiteSource,
    probeHotModule
} from "@af-utils/check-hot/analyzer";

const contextFor = (
    packageName: string,
    packageVersion: string,
    functions: readonly HotModuleFunction[] = []
): HotModuleTestRunnerContext => ({
    namespace: {},
    functions: new Map(functions.map(candidate => [candidate.name, candidate])),
    package: { name: packageName, version: packageVersion },
    runtime: {
        name: "node",
        version: process.versions.node,
        engine: "v8",
        engineVersion: process.versions.v8
    }
});

const mapValues = (values: number[], callback: (value: number) => number) =>
    values.map(value => callback(value));
const require = createRequire(import.meta.url);
const installedVersion = (packageName: string, entry = packageName) => {
    let directory = dirname(require.resolve(entry));
    while (true) {
        const manifestPath = join(directory, "package.json");
        if (existsSync(manifestPath)) {
            const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as {
                name?: string;
                version?: string;
            };
            if (manifest.name === packageName && manifest.version) {
                return manifest.version;
            }
        }
        const parent = dirname(directory);
        if (parent === directory) {
            throw new Error(`Unable to find installed ${packageName} version`);
        }
        directory = parent;
    }
};

const childProcessesAvailable =
    process.env.CODEX_PERMISSION_PROFILE === undefined &&
    spawnSync(
        process.execPath,
        [
            "--allow-natives-syntax",
            "--trace-opt",
            "--trace-deopt",
            "--trace-file-names",
            "-e",
            ""
        ],
        { stdio: "ignore" }
    ).status === 0;
const nodeControlRequired =
    process.env.CHECK_HOT_REQUIRE_RUNTIMES?.split(",").includes("node") ??
    false;

test("provides the real ecosystem worker required by CI", () => {
    if (nodeControlRequired) {
        expect(
            childProcessesAvailable,
            "Node was required, but the installed-ecosystem V8 worker could not start"
        ).toBe(true);
    }
});

const runInstalledRecipeInV8 = async (options: {
    packageName: string;
    packageVersion: string;
    importSpecifier: string;
    runner: HotModuleTestRunner;
    runnerSource: URL;
    functionValue: HotModuleFunction;
    analyze?: boolean;
    diagnostics?: boolean;
    expectGraphIncomplete?: boolean;
    expectedSelectedSampleIds?: readonly string[];
    testedPrimary?: {
        runtimeVersion: string;
        engineVersion: string;
        outcome: "pass" | "tier-mismatch";
    };
}) => {
    const functionName = options.functionValue.name;
    const directory = await mkdtemp(join(import.meta.dirname, ".runtime-"));
    const suitePath = join(directory, "suite.mjs");
    const filteredRunnerPath = join(directory, "runner.ts");
    try {
        await writeFile(
            filteredRunnerPath,
            [
                `import runner from ${JSON.stringify(options.runnerSource.href)};`,
                `const functionName = ${JSON.stringify(functionName)};`,
                "export default {",
                "  ...runner,",
                "  listSamples(context) {",
                "    const selected = runner.listSamples(context);",
                "    return selected[functionName] ? { [functionName]: selected[functionName] } : {};",
                "  },",
                "  createSamples(context, selected) { return runner.createSamples(context, selected); }",
                "};"
            ].join("\n")
        );
        const runnerUrl = pathToFileURL(filteredRunnerPath);
        const manifest = await probeHotModule({
            specifier: options.importSpecifier,
            parentUrl: pathToFileURL(suitePath).href,
            testRunnerSpecifier: runnerUrl.href,
            package: {
                name: options.packageName,
                version: options.packageVersion
            },
            runtime: "node",
            timeoutMs: 60_000
        });
        if (!manifest.samples[functionName]) {
            throw new Error(
                `${options.packageName}:${functionName} produced no accepted isolated recipe: ${JSON.stringify(manifest.attempts)}`
            );
        }
        const analysis = options.analyze
            ? await analyzeHotModule({ input: options.importSpecifier })
            : undefined;
        const source = analysis
            ? generateHotSuiteSource(analysis, {
                  importSpecifier: options.importSpecifier,
                  testRunnerSpecifier: runnerUrl.href,
                  probeManifest: manifest,
                  functions: [functionName]
              })
            : [
                  'import { createModuleSuite } from "@af-utils/check-hot";',
                  `import testRunner from ${JSON.stringify(runnerUrl.href)};`,
                  `const specifier = ${JSON.stringify(options.importSpecifier)};`,
                  `export default createModuleSuite({`,
                  `  name: ${JSON.stringify(`ecosystem-${options.packageName}`)},`,
                  `  workerLoader: "tsx",`,
                  `  analysis: { graphComplete: true, diagnostics: [] },`,
                  `  load: () => import(specifier),`,
                  `  resolve: () => import.meta.resolve(specifier),`,
                  `  package: ${JSON.stringify({ name: options.packageName, version: options.packageVersion })},`,
                  `  testRunner,`,
                  `  probeManifest: ${JSON.stringify(manifest)},`,
                  `  options: { warmupIterations: 200, stressIterations: 20 }`,
                  `});`
              ].join("\n");
        await writeFile(suitePath, source);
        const summary = await runHotSuite({
            suite: pathToFileURL(suitePath),
            runtimes: ["node"],
            v8Tiers: ["turbofan"],
            modes: ["combined"],
            repetitions: 1,
            deoptScope: "none",
            timeoutMs: 60_000,
            diagnostics: options.diagnostics
                ? ["v8-ic-maps", "cpu-profile"]
                : undefined,
            diagnosticStressIterations: options.diagnostics
                ? {
                      "v8-ic-maps": 1_000,
                      "cpu-profile": 50_000
                  }
                : undefined,
            diagnosticMaxBytes: 128 * 1024 * 1024
        });
        const reconciledObligationIds = analysis
            ? analysis.evidence
                  .filter(evidence => {
                      if (!evidence.automation) return false;
                      const candidate = analysis.candidates.find(
                          value => value.id === evidence.candidateId
                      );
                      return (
                          candidate?.sourceSha256 ===
                          manifest.targets[functionName]?.sourceSha256
                      );
                  })
                  .map(evidence => `obligation:${evidence.id}`)
            : [];
        return {
            summary,
            analysisGraphComplete: analysis?.graphComplete,
            obligationIds: analysis
                ? [
                      ...new Set([
                          ...analysis.obligations.map(
                              obligation => obligation.id
                          ),
                          ...reconciledObligationIds
                      ])
                  ]
                : undefined
        };
    } finally {
        await rm(directory, { force: true, recursive: true });
    }
};

describe("external ecosystem test runners", () => {
    test("keeps the protocol version equal to the package release", () => {
        expect(testRunnerVersion).toBe(packageManifest.version);
    });

    test("validates package and runtime versions", () => {
        expect(
            lodashTestRunner.validate(contextFor("lodash", "4.17.21"))
        ).toEqual([]);
        expect(
            lodashTestRunner.validate(contextFor("lodash", "5.0.0"))[0]
        ).toContain("outside the declared compatible range");
        expect(
            lodashTestRunner.validate({
                ...contextFor("lodash", "4.17.21"),
                runtime: {
                    name: "bun",
                    version: "2.0.0",
                    engine: "jsc",
                    engineVersion: "unknown"
                }
            })
        ).toEqual([
            "bun@2.0.0 is outside the declared compatible range >=1.2 <2"
        ]);
    });

    test("auto-selects package recipes and recreates only selected labels", () => {
        const context = contextFor("lodash", "4.17.21", [
            { name: "map", fn: mapValues, receiver: null }
        ]);

        const selected = automaticTestRunner.listSamples(context);
        const samples = automaticTestRunner.createSamples(context, selected);

        expect(selected).toEqual({ map: ["collection-map"] });
        expect(samples.map[0].args(0, "stress")[0]).toEqual([1, 2, 3, 4]);
    });

    test("enumerates recipes without invoking target code", () => {
        let invocations = 0;
        const runner = createRecipeTestRunner({
            id: "declarative-control",
            version: "1.0.0",
            packageRange: "*",
            resolve: () => [{ label: "attempt", args: () => [] }]
        });
        const context = contextFor("fixture", "1.0.0", [
            {
                name: "first",
                fn: () => {
                    invocations++;
                },
                receiver: null
            },
            {
                name: "second",
                fn: () => {
                    invocations++;
                },
                receiver: null
            }
        ]);

        expect(runner.listSamples(context)).toEqual({
            first: ["attempt"],
            second: ["attempt"]
        });
        expect(invocations).toBe(0);
    });

    test("declares every advertised integration in package metadata", () => {
        expect(packageManifest.peerDependencies).toMatchObject({
            "date-fns": expect.any(String),
            lodash: expect.any(String),
            react: expect.any(String),
            svelte: expect.any(String),
            three: expect.any(String)
        });
        expect(packageManifest.devDependencies).toMatchObject({
            "date-fns": expect.any(String),
            lodash: expect.any(String),
            react: expect.any(String),
            svelte: expect.any(String),
            three: expect.any(String)
        });
        expect(packageManifest.peerDependencies).toMatchObject({
            "date-fns": dateFnsPackageRange,
            lodash: lodashPackageRange,
            react: reactPackageRange,
            svelte: sveltePackageRange,
            three: threePackageRange
        });
    });

    test("verifies each supported date-fns arithmetic family independently", async () => {
        const dateFns = (await import("date-fns")) as Record<string, unknown>;
        const names = [
            "addDays",
            "subDays",
            "addHours",
            "subHours",
            "addMinutes",
            "subMinutes",
            "addMonths",
            "subMonths",
            "addWeeks",
            "subWeeks",
            "addYears",
            "subYears"
        ];
        const amounts = [1, 2.25, -0, Number.NaN, 2 ** 31, 2 ** 32];

        for (const name of names) {
            const fn = dateFns[name];
            if (typeof fn !== "function") {
                throw new TypeError(`Installed date-fns has no ${name}`);
            }
            const candidate = { name, fn, receiver: null };
            const context = contextFor(
                "date-fns",
                installedVersion("date-fns"),
                [candidate]
            );
            const samples = dateFnsTestRunner.createSamples(
                context,
                dateFnsTestRunner.listSamples(context)
            );
            const sample = samples[name]?.[0];
            if (!sample?.verifyMutation) {
                throw new TypeError(`${name} has no exact mutation verifier`);
            }
            for (const [index, amount] of amounts.entries()) {
                const args = [...sample.args(index, "stress")];
                args[1] = amount;
                const result = Reflect.apply(fn, null, args);
                // oxlint-disable-next-line no-await-in-loop -- Every arithmetic family/representation pair is an independent semantic oracle control.
                await sample.verifyMutation({
                    obligationId: `fixture:${name}`,
                    mutationFamily: "numeric-representation",
                    variant: `amount-${index}`,
                    receiver: null,
                    args,
                    result,
                    iteration: index,
                    phase: "stress"
                });
            }
        }

        const businessCandidate = {
            name: "addBusinessDays",
            fn: dateFns.addBusinessDays as CallableFunction,
            receiver: null
        };
        const businessContext = contextFor(
            "date-fns",
            installedVersion("date-fns"),
            [businessCandidate]
        );
        expect(dateFnsTestRunner.listSamples(businessContext)).toEqual({});
    });

    test("seeds the date-fns invalid-amount branch and excludes early-return numeric variants", async () => {
        const dateFns = await import("date-fns");
        const candidate = {
            name: "addDays",
            fn: dateFns.addDays,
            receiver: null
        };
        const context = contextFor("date-fns", installedVersion("date-fns"), [
            candidate
        ]);
        const samples = dateFnsTestRunner.createSamples(
            context,
            dateFnsTestRunner.listSamples(context)
        ).addDays;

        expect(samples?.map(sample => sample.label)).toEqual([
            "date-and-amount",
            "date-invalid-amount-branch"
        ]);
        const arithmetic = samples?.[0];
        const invalidBranch = samples?.[1];
        if (!arithmetic?.acceptMutation || !invalidBranch?.verifyMutation) {
            throw new TypeError("date-fns branch controls are incomplete");
        }
        const excluded = await arithmetic.acceptMutation({
            obligationId: "fixture:addDays",
            mutationFamily: "numeric-representation",
            variant: "negative-zero",
            receiver: null,
            args: [new Date(), -0, { in: undefined }],
            iteration: 0,
            phase: "stress"
        });
        expect(excluded).toMatch(/return before the date arithmetic/u);

        const args = invalidBranch.args(0, "stress");
        const result = dateFns.addDays(
            ...(args as Parameters<typeof dateFns.addDays>)
        );
        await invalidBranch.verifyMutation({
            obligationId: "fixture:addDays-options",
            mutationFamily: "object-shape",
            variant: "original-order",
            receiver: null,
            args,
            result,
            iteration: 0,
            phase: "stress"
        });
        expect(Number.isNaN(result.getTime())).toBe(true);
    });

    test("keeps React key and defaultProps branches live across shape variants", async () => {
        const react = await import("react");
        const candidate = {
            name: "createElement",
            fn: react.createElement,
            receiver: null
        };
        const context = contextFor("react", installedVersion("react"), [
            candidate
        ]);
        const samples = reactTestRunner.createSamples(
            context,
            reactTestRunner.listSamples(context)
        ).createElement;
        expect(samples?.map(sample => sample.label)).toEqual([
            "element-with-props",
            "element-with-special-key",
            "element-with-default-props"
        ]);
        for (const [label, parameterIndex] of [
            ["element-with-special-key", 1],
            ["element-with-default-props", 0]
        ] as const) {
            const sample = samples?.find(value => value.label === label);
            if (!sample?.verifyMutation) {
                throw new TypeError(`React branch recipe ${label} is missing`);
            }
            const baselineArgs = [...sample.args(0, "stress")];
            const seed = baselineArgs[parameterIndex];
            if (typeof seed !== "object" || seed === null) {
                throw new TypeError(
                    `React branch recipe ${label} is not shaped`
                );
            }
            expect(Object.keys(seed).at(-1)).toBe("__keep");
            for (const [index, variant] of [
                seed as Record<string, unknown>,
                { __extra: true, ...(seed as Record<string, unknown>) }
            ].entries()) {
                const args = [...baselineArgs];
                args[parameterIndex] = variant;
                const result = Reflect.apply(react.createElement, null, args);
                // oxlint-disable-next-line no-await-in-loop -- Every branch/shape pair independently controls React's semantic verifier.
                await sample.verifyMutation({
                    obligationId: `fixture:${label}`,
                    mutationFamily: "object-shape",
                    variant: `shape-${index}`,
                    receiver: null,
                    args,
                    result,
                    iteration: 0,
                    phase: "stress"
                });
            }
        }
        for (const [label, mutateArgs] of [
            [
                "element-with-special-key",
                (args: unknown[]) => {
                    args[1] = { key: null, __keep: "tail" };
                }
            ],
            [
                "element-with-default-props",
                (args: unknown[]) => {
                    args[2] = undefined;
                }
            ]
        ] as const) {
            const sample = samples?.find(value => value.label === label);
            if (!sample?.verifyMutation) {
                throw new TypeError(`React edge recipe ${label} is missing`);
            }
            const args = [...sample.args(0, "stress")];
            mutateArgs(args);
            const result = Reflect.apply(react.createElement, null, args);
            // oxlint-disable-next-line no-await-in-loop -- Null-key coercion and defaultProps ordering are independent React semantic controls.
            await sample.verifyMutation({
                obligationId: `fixture:${label}:edge`,
                mutationFamily: "object-shape",
                variant: "semantic-edge",
                receiver: null,
                args,
                result,
                iteration: 0,
                phase: "stress"
            });
        }
    });

    test("keeps Svelte compiler mutations inside each recipe's option domain", async () => {
        const svelte = await import("svelte/compiler");
        const candidate = {
            name: "compile",
            fn: svelte.compile,
            receiver: null
        };
        const context = contextFor("svelte", installedVersion("svelte"), [
            candidate
        ]);
        const sample = svelteTestRunner.createSamples(
            context,
            svelteTestRunner.listSamples(context)
        ).compile?.[0];
        if (!sample?.acceptMutation || !sample.verifyMutation) {
            throw new TypeError(
                "Svelte compiler mutation controls are missing"
            );
        }
        const base = sample.args(0, "stress");
        const accepted = await sample.acceptMutation({
            obligationId: "fixture:svelte-options",
            mutationFamily: "object-shape",
            variant: "missing-field",
            receiver: null,
            args: [base[0], { filename: "CheckHot.svelte", dev: false }],
            iteration: 0,
            phase: "stress"
        });
        expect(accepted).toBe(true);
        const excluded = await sample.acceptMutation({
            obligationId: "fixture:svelte-options",
            mutationFamily: "object-shape",
            variant: "extra-field",
            receiver: null,
            args: [base[0], { ...(base[1] as object), unsupported: true }],
            iteration: 0,
            phase: "stress"
        });
        expect(excluded).toBe(
            "the generated compiler options are outside this recipe's declared domain: unsupported"
        );
        const result = svelte.compile(
            base[0] as string,
            base[1] as Parameters<typeof svelte.compile>[1]
        );
        await sample.verifyMutation({
            obligationId: "fixture:svelte-options",
            mutationFamily: "object-shape",
            variant: "original-order",
            receiver: null,
            args: base,
            result,
            iteration: 0,
            phase: "stress"
        });
    });

    test("discovers nested Three.js MathUtils and verifies numeric mutations", async () => {
        const three = await import("three");
        const baseContext = {
            ...contextFor("three", installedVersion("three")),
            namespace: three as unknown as Record<string, unknown>
        };
        const discovered = threeTestRunner.discover?.(baseContext) ?? [];
        expect(
            automaticTestRunner
                .discover?.(baseContext)
                .map(candidate => candidate.exportPath.join("."))
        ).toContain("MathUtils.lerp");
        expect(discovered).toContainEqual({
            modulePath: ".",
            exportPath: ["MathUtils", "lerp"]
        });
        const discoveredContext = resolveRunnerFunctionLocators(
            {
                ...baseContext,
                functions: discoverModuleFunctions(baseContext.namespace)
            },
            threeTestRunner
        );
        const targetId = ".::MathUtils/lerp";
        const lerp = discoveredContext.functions.get(targetId);
        expect(lerp).toBeDefined();
        if (!lerp) return;
        const selected = threeTestRunner.listSamples(discoveredContext);
        expect(selected).toEqual(
            expect.objectContaining({
                [targetId]: ["math-utils-lerp"]
            })
        );
        const sample = threeTestRunner.createSamples(
            discoveredContext,
            selected
        )[targetId]?.[0];
        expect(sample?.verifyMutation).toBeTypeOf("function");
        if (!sample?.verifyMutation) return;
        const values = [0, -0, 2.5, 2 ** 31, 2 ** 32];
        for (const [index, value] of values.entries()) {
            const args = [...sample.args(index, "stress")];
            args[0] = value;
            const result = Reflect.apply(lerp.fn, lerp.receiver, args);
            // oxlint-disable-next-line no-await-in-loop -- Each representation is an independent semantic-oracle control.
            await sample.verifyMutation({
                obligationId: "fixture:three:lerp",
                mutationFamily: "numeric-representation",
                variant: `value-${index}`,
                receiver: lerp.receiver,
                args,
                result,
                iteration: index,
                phase: "stress"
            });
        }
        const invalidArgs = [...sample.args(0, "stress")];
        invalidArgs[0] = Number.NaN;
        const invalidResult = Reflect.apply(
            lerp.fn,
            lerp.receiver,
            invalidArgs
        );
        expect(() =>
            sample.verifyMutation?.({
                obligationId: "fixture:three:lerp",
                mutationFamily: "numeric-representation",
                variant: "non-finite",
                receiver: lerp.receiver,
                args: invalidArgs,
                result: invalidResult,
                iteration: values.length,
                phase: "stress"
            })
        ).toThrowError("outside this recipe's semantic domain");
    });

    test("runs recipes against the installed Lodash, date-fns, React, Svelte, and Three.js exports", async () => {
        const integrations = [
            {
                runner: lodashTestRunner,
                context: contextFor("lodash", installedVersion("lodash"), [
                    {
                        name: "map",
                        fn: (await import("lodash")).default.map,
                        receiver: (await import("lodash")).default
                    }
                ]),
                expected: "map"
            },
            {
                runner: dateFnsTestRunner,
                context: contextFor("date-fns", installedVersion("date-fns"), [
                    {
                        name: "addDays",
                        fn: (await import("date-fns")).addDays,
                        receiver: null
                    }
                ]),
                expected: "addDays"
            },
            {
                runner: reactTestRunner,
                context: contextFor("react", installedVersion("react"), [
                    {
                        name: "createElement",
                        fn: (await import("react")).createElement,
                        receiver: null
                    }
                ]),
                expected: "createElement"
            },
            {
                runner: svelteTestRunner,
                context: contextFor(
                    "svelte",
                    installedVersion("svelte", "svelte/compiler"),
                    [
                        {
                            name: "compile",
                            fn: (await import("svelte/compiler")).compile,
                            receiver: null
                        }
                    ]
                ),
                expected: "compile"
            },
            {
                runner: threeTestRunner,
                context: contextFor("three", installedVersion("three"), [
                    {
                        name: "MathUtils.lerp",
                        fn: (await import("three")).MathUtils.lerp,
                        receiver: (await import("three")).MathUtils
                    }
                ]),
                expected: "MathUtils.lerp"
            }
        ];

        for (const integration of integrations) {
            expect(integration.runner.validate(integration.context)).toEqual(
                []
            );
            const selected = integration.runner.listSamples(
                integration.context
            );
            const selectedCount = selected[integration.expected]?.length ?? 0;
            if (selectedCount === 0) {
                throw new Error(`${integration.expected}: no recipe`);
            }
            expect(selectedCount).toBeGreaterThan(0);
            const replayed = integration.runner.createSamples(
                integration.context,
                selected
            );
            const sample = replayed[integration.expected]?.[0];
            expect(sample).toBeDefined();
            if (sample) {
                const candidate = integration.context.functions.get(
                    integration.expected
                ) as HotModuleFunction;
                // oxlint-disable-next-line no-await-in-loop -- Each installed adapter replay must settle before its assertion and the next package.
                const replayResult = await Reflect.apply(
                    candidate.fn,
                    sample.receiver?.(0, "stress") ?? candidate.receiver,
                    sample.args(0, "stress")
                );
                // oxlint-disable-next-line no-await-in-loop -- Adapter correctness verification belongs to the matching sequential replay.
                await sample.verify?.(replayResult, 0, "stress");
            }
        }
    });

    test("builds static plans for representative installed public entrypoints", async () => {
        const controls = [
            {
                input: "lodash/map",
                exportName: "default",
                obligations: 0,
                graphComplete: true
            },
            {
                input: "date-fns/addDays",
                exportName: "addDays",
                obligations: 1,
                graphComplete: true
            },
            {
                input: "react",
                exportName: "createElement",
                obligations: 1,
                graphComplete: true
            },
            {
                input: "svelte/compiler",
                exportName: "compile",
                obligations: 1,
                graphComplete: false
            },
            {
                input: "three/src/math/MathUtils.js",
                exportName: "lerp",
                obligations: 1,
                graphComplete: true
            }
        ];
        const reports = await Promise.all(
            controls.map(control => analyzeHotModule({ input: control.input }))
        );

        for (const [index, report] of reports.entries()) {
            const control = controls[index];
            expect(report.graphComplete, control.input).toBe(
                control.graphComplete
            );
            if (!control.graphComplete) {
                expect(report.diagnostics.join("\n"), control.input).toContain(
                    "leave the selected package and are not transitively source-authenticated"
                );
            }
            const candidate = report.candidates.find(
                value => value.exportName === control.exportName
            );
            expect(candidate, control.input).toBeDefined();
            expect(
                report.obligations.filter(
                    obligation => obligation.candidateId === candidate?.id
                ).length,
                control.input
            ).toBeGreaterThanOrEqual(control.obligations);
        }
        const reactReport = reports[2];
        expect(
            reactReport.findings.filter(
                finding =>
                    finding.rule === "numeric-operation" &&
                    finding.sourceLine.includes("Expected")
            )
        ).toEqual([]);
    }, 30_000);

    test.runIf(process.env.CHECK_HOT_HEAVY_ECOSYSTEM === "1")(
        "audits the heavy Three.js root without claiming incomplete examples as covered",
        async () => {
            const report = await analyzeHotModule({ input: "three" });

            expect(report.files).toBeGreaterThan(500);
            expect(report.candidates.length).toBeGreaterThan(1_000);
            expect(report.findings.length).toBeGreaterThan(5_000);
            expect(report.obligations.length).toBeGreaterThan(100);
            expect(report.graphComplete).toBe(false);
            expect(report.diagnostics.length).toBeGreaterThan(0);
            expect(
                report.diagnostics.some(
                    diagnostic =>
                        diagnostic.includes("nonliteral dynamic import") ||
                        diagnostic.includes("https://")
                )
            ).toBe(true);
            expect(
                report.diagnostics.filter(diagnostic =>
                    /(?:README|\.(?:css|json|wasm|ttf|woff2?)(?:\b|$))/iu.test(
                        diagnostic
                    )
                )
            ).toEqual([]);
            expect(
                report.limitations.some(limitation =>
                    limitation.includes("Static findings are risk indicators")
                )
            ).toBe(true);
        },
        180_000
    );

    test.runIf(childProcessesAvailable)(
        "replays one accepted recipe per installed ecosystem through a real V8 worker",
        async () => {
            const lodash = (await import("lodash")).default;
            const dateFns = await import("date-fns");
            const react = await import("react");
            const svelte = await import("svelte/compiler");
            const integrations = [
                {
                    packageName: "lodash",
                    packageVersion: installedVersion("lodash"),
                    importSpecifier: "lodash",
                    runner: lodashTestRunner,
                    runnerSource: new URL("../dist/lodash.js", import.meta.url),
                    functionValue: {
                        name: "head",
                        fn: lodash.head,
                        receiver: lodash
                    },
                    analyze: true,
                    testedPrimary: {
                        runtimeVersion: "26.7.0",
                        engineVersion: "14.6.202.34-node.28",
                        outcome: "tier-mismatch"
                    }
                },
                {
                    packageName: "date-fns",
                    packageVersion: installedVersion("date-fns"),
                    importSpecifier: "date-fns/addDays",
                    runner: dateFnsTestRunner,
                    runnerSource: new URL(
                        "../dist/date-fns.js",
                        import.meta.url
                    ),
                    functionValue: {
                        name: "addDays",
                        fn: dateFns.addDays,
                        receiver: null
                    },
                    analyze: true,
                    testedPrimary: {
                        runtimeVersion: "26.7.0",
                        engineVersion: "14.6.202.34-node.28",
                        outcome: "tier-mismatch"
                    },
                    expectedSelectedSampleIds: [
                        "addDays:date-invalid-amount-branch"
                    ]
                },
                {
                    packageName: "react",
                    packageVersion: installedVersion("react"),
                    importSpecifier: "react",
                    runner: reactTestRunner,
                    runnerSource: new URL("../dist/react.js", import.meta.url),
                    functionValue: {
                        name: "createElement",
                        fn: react.createElement,
                        receiver: null
                    },
                    analyze: true,
                    diagnostics: true,
                    expectedSelectedSampleIds: [
                        "createElement:element-with-special-key",
                        "createElement:element-with-default-props"
                    ],
                    testedPrimary: {
                        runtimeVersion: "26.7.0",
                        engineVersion: "14.6.202.34-node.28",
                        outcome: "tier-mismatch"
                    }
                },
                {
                    packageName: "svelte",
                    packageVersion: installedVersion(
                        "svelte",
                        "svelte/compiler"
                    ),
                    importSpecifier: "svelte/compiler",
                    runner: svelteTestRunner,
                    runnerSource: new URL("../dist/svelte.js", import.meta.url),
                    functionValue: {
                        name: "compile",
                        fn: svelte.compile,
                        receiver: null
                    },
                    analyze: true,
                    expectGraphIncomplete: true
                },
                {
                    packageName: "three",
                    packageVersion: installedVersion("three"),
                    importSpecifier: "three/src/math/MathUtils.js",
                    runner: threeTestRunner,
                    runnerSource: new URL("../dist/three.js", import.meta.url),
                    functionValue: {
                        name: "lerp",
                        fn: (await import("three")).MathUtils.lerp,
                        receiver: (await import("three")).MathUtils
                    },
                    analyze: true,
                    testedPrimary: {
                        runtimeVersion: "26.7.0",
                        engineVersion: "14.6.202.34-node.28",
                        outcome: "pass"
                    }
                }
            ] satisfies readonly Parameters<typeof runInstalledRecipeInV8>[0][];

            const results: Awaited<
                ReturnType<typeof runInstalledRecipeInV8>
            >[] = [];
            /* oxlint-disable no-await-in-loop -- Each temporary runner tree must finish and clean up before the next integrity snapshot. */
            for (const integration of integrations) {
                results.push(await runInstalledRecipeInV8(integration));
            }
            /* oxlint-enable no-await-in-loop */
            for (const [index, integration] of integrations.entries()) {
                const { analysisGraphComplete, summary, obligationIds } =
                    results[index];
                if (integration.analyze) {
                    expect(analysisGraphComplete).toBe(
                        !integration.expectGraphIncomplete
                    );
                    expect(obligationIds?.length).toBeGreaterThan(0);
                    expect(summary.runs.length).toBeGreaterThan(0);
                    expect(
                        summary.runs.every(run => run.worker !== undefined),
                        summary.runs
                            .map(
                                run =>
                                    `${run.runtime}/${run.mode}: ${run.problems.map(problem => problem.message).join("; ")}\n${run.stderr}`
                            )
                            .join("\n")
                    ).toBe(true);
                    for (const run of summary.runs) {
                        expect(
                            run.coverage
                                .map(entry => entry.obligationId)
                                .toSorted()
                        ).toEqual([...(obligationIds ?? [])].toSorted());
                        expect(
                            run.problems.filter(problem =>
                                [
                                    "runtime-worker-timeout",
                                    "runtime-worker-result-missing",
                                    "runtime-worker-exit-failure",
                                    "runtime-worker-execution-failure",
                                    "source-integrity-mismatch",
                                    "runtime-resolution-mismatch"
                                ].includes(problem.problemId)
                            ),
                            `${integration.packageName}: infrastructure/integrity failure`
                        ).toEqual([]);
                    }
                    const coverage = summary.runs.flatMap(run => run.coverage);
                    const selectedSampleIds = new Set(
                        coverage.flatMap(entry =>
                            entry.preflight ? [entry.preflight.sampleId] : []
                        )
                    );
                    for (const expectedSampleId of integration.expectedSelectedSampleIds ??
                        []) {
                        expect(
                            selectedSampleIds.has(expectedSampleId),
                            `${integration.packageName}: adaptive preflight did not select ${expectedSampleId}; selected ${[...selectedSampleIds].join(", ")}`
                        ).toBe(true);
                    }
                    expect(
                        coverage.every(
                            entry =>
                                entry.evidence !== undefined &&
                                [
                                    "passed",
                                    "failed",
                                    "blocked",
                                    "unsupported",
                                    "ignored"
                                ].includes(entry.status)
                        )
                    ).toBe(true);
                    expect(
                        coverage.some(entry =>
                            entry.preflight?.mutationPlan?.observations.some(
                                observation =>
                                    observation.variant !==
                                        "adapter-baseline" &&
                                    (observation.guardedSiteHitCount ?? 0) > 0
                            )
                        ),
                        `${integration.packageName}: no guarded exact-site observation in ${JSON.stringify(coverage)}`
                    ).toBe(true);
                    const selectedCoverage = coverage.filter(
                        entry => entry.status !== "ignored"
                    );
                    expect(
                        selectedCoverage.length,
                        `${integration.packageName}: the selected recipe did not reconcile with any analyzed obligation`
                    ).toBeGreaterThan(0);
                    const ignoredObligationIds = new Set(
                        coverage
                            .filter(entry => entry.status === "ignored")
                            .map(entry => entry.obligationId)
                            .filter(
                                obligationId =>
                                    !coverage.some(
                                        entry =>
                                            entry.obligationId ===
                                                obligationId &&
                                            entry.status !== "ignored"
                                    )
                            )
                    );
                    expect(
                        summary.problems.filter(
                            problem =>
                                problem.problemId.startsWith("coverage-") &&
                                problem.targetId !== undefined &&
                                ignoredObligationIds.has(problem.targetId)
                        ),
                        `${integration.packageName}: user-excluded obligations were falsely reported as proof failures`
                    ).toEqual([]);
                    const tierMismatch = summary.runs.some(run =>
                        run.problems.some(
                            problem => problem.problemId === "v8-tier-mismatch"
                        )
                    );
                    expect(
                        summary.runs.flatMap(run =>
                            run.problems.filter(
                                problem =>
                                    problem.problemId !== "v8-tier-mismatch"
                            )
                        ),
                        `${integration.packageName}: unexpected primary worker problem`
                    ).toEqual([]);
                    const primaryOutcome = tierMismatch
                        ? selectedCoverage.length > 0 &&
                          selectedCoverage.every(entry =>
                              ["passed", "failed"].includes(entry.status)
                          ) &&
                          selectedCoverage.some(
                              entry =>
                                  entry.status === "failed" &&
                                  entry.preflight?.status === "accepted" &&
                                  entry.preflight.semanticVerification ===
                                      "mutation-verified" &&
                                  entry.preflight.mutationPlan?.observations.some(
                                      observation =>
                                          observation.variant !==
                                              "adapter-baseline" &&
                                          (observation.guardedSiteHitCount ??
                                              0) > 0
                                  )
                          )
                            ? "tier-mismatch"
                            : "invalid"
                        : selectedCoverage.every(
                                entry => entry.status === "passed"
                            )
                          ? "pass"
                          : "invalid";
                    expect(
                        primaryOutcome,
                        `${integration.packageName}: selected obligations neither passed nor produced a clean independent tier verdict: ${JSON.stringify(selectedCoverage)}`
                    ).not.toBe("invalid");
                    const unexpectedCoverageProblems = summary.problems.filter(
                        problem =>
                            problem.problemId.startsWith("coverage-") &&
                            (primaryOutcome === "tier-mismatch"
                                ? problem.problemId !==
                                  "coverage-obligation-failed"
                                : true)
                    );
                    expect(
                        unexpectedCoverageProblems,
                        `${integration.packageName}: a tier verdict masked blocked or unsupported analyzer coverage`
                    ).toEqual([]);
                    if (integration.testedPrimary) {
                        const runtime = summary.runs[0].worker?.runtime;
                        if (
                            runtime?.version ===
                                integration.testedPrimary.runtimeVersion &&
                            runtime.engineVersion ===
                                integration.testedPrimary.engineVersion
                        ) {
                            expect(
                                primaryOutcome,
                                `${integration.packageName}: pinned Node/V8 outcome changed`
                            ).toBe(integration.testedPrimary.outcome);
                        }
                    }
                    const graphProblems = summary.problems.filter(
                        problem =>
                            problem.problemId ===
                            "analysis-module-graph-incomplete"
                    );
                    if (integration.expectGraphIncomplete) {
                        expect(graphProblems.length).toBeGreaterThan(0);
                        expect(summary.passed).toBe(false);
                    } else {
                        expect(graphProblems).toEqual([]);
                    }
                    if (integration.diagnostics) {
                        for (const run of summary.runs) {
                            expect(run.diagnostics?.v8IcMaps).toBeDefined();
                            expect(run.diagnostics?.cpuProfile).toBeDefined();
                            const v8 = run.diagnostics?.v8IcMaps;
                            if (v8?.gap) {
                                expect(
                                    v8.gap,
                                    `${integration.packageName}: unexpected V8 diagnostic failure`
                                ).toMatch(/checked compatibility registry/iu);
                                expect(
                                    run.diagnostics?.problems?.some(
                                        problem =>
                                            problem.problemId ===
                                                "v8-ic-map-diagnostic-gap" &&
                                            problem.message === v8.gap
                                    )
                                ).toBe(true);
                            } else {
                                expect(
                                    v8?.targetScope.matchedTargetIds.length,
                                    `${integration.packageName}: no authenticated V8 target range`
                                ).toBeGreaterThan(0);
                                expect(
                                    v8?.graph.inlineCaches.some(
                                        entry =>
                                            entry.correlation === "target" &&
                                            entry.targetId !== undefined
                                    ),
                                    `${integration.packageName}: V8 IC evidence was not source-owner scoped`
                                ).toBe(true);
                            }
                            const cpu = run.diagnostics?.cpuProfile;
                            expect(
                                cpu?.gap,
                                `${integration.packageName}: CPU diagnostic did not observe authenticated target work`
                            ).toBeUndefined();
                            expect(
                                cpu?.functions.some(
                                    entry =>
                                        entry.candidateId?.includes(
                                            "createElement"
                                        ) && entry.samples > 0
                                ),
                                `${integration.packageName}: whole-process CPU profile never sampled the authenticated createElement owner`
                            ).toBe(true);
                            expect(
                                run.diagnostics?.problems?.filter(
                                    problem =>
                                        problem.problemId === "v8-tier-mismatch"
                                ).length ?? 0,
                                `${integration.packageName}: independent diagnostic reruns duplicated one primary tier verdict`
                            ).toBeLessThanOrEqual(1);
                        }
                    }
                    continue;
                }
                expect(
                    summary.passed,
                    `${integration.packageName}: ${summary.runs
                        .flatMap(run =>
                            run.problems
                                .map(problem => problem.message)
                                .concat(
                                    run.stderr,
                                    run.stdout,
                                    run.command.join(" ")
                                )
                        )
                        .filter(Boolean)
                        .join("\n")}`
                ).toBe(true);
            }
        },
        240_000
    );
});
