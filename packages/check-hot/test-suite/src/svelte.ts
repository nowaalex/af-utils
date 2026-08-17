import type { HotRecipeResolver } from "./shared.js";
import { createRecipeTestRunner, testRunnerVersion } from "./shared.js";
import type {
    HotModuleMutationInputContext,
    HotModuleMutationVerificationContext
} from "@af-utils/check-hot";

/** Svelte peer range covered by this adapter. */
export const sveltePackageRange = ">=5 <6";

const source = "<script>let count = 0;</script><button>{count}</button>";

const verifyObject = (result: unknown) => {
    if (typeof result !== "object" || result === null) {
        throw new TypeError("Svelte compiler recipe must return an object");
    }
};

const verifyCode = (result: unknown) => {
    verifyObject(result);
    const record = result as { code?: unknown; js?: { code?: unknown } };
    if (
        typeof record.code !== "string" &&
        typeof record.js?.code !== "string"
    ) {
        throw new TypeError(
            "Svelte compiler recipe must return generated code"
        );
    }
};

const fingerprintCode = ({ result }: { result: unknown }) => {
    verifyCode(result);
    const record = result as {
        code?: unknown;
        js?: { code?: unknown };
        css?: { code?: unknown };
        warnings?: readonly { code?: unknown; message?: unknown }[];
    };
    return {
        code: record.code ?? record.js?.code,
        css: record.css?.code,
        warnings: record.warnings?.map(warning => ({
            code: warning.code,
            message: warning.message
        }))
    };
};

const compileOptionKeys = new Set(["dev", "filename", "generate"]);

const acceptCompileOptionMutation = ({
    args
}: HotModuleMutationInputContext): true | string => {
    const options = args[1];
    if (
        typeof options !== "object" ||
        options === null ||
        Array.isArray(options)
    ) {
        return "the Svelte compile recipe requires a plain compiler-options object";
    }
    const unsupported = Object.keys(options).filter(
        key => !compileOptionKeys.has(key)
    );
    return unsupported.length === 0
        ? true
        : `the generated compiler options are outside this recipe's declared domain: ${unsupported.join(", ")}`;
};

const verifyCompileMutation = ({
    result
}: HotModuleMutationVerificationContext) => verifyCode(result);

const resolveSvelteRecipes: HotRecipeResolver = candidate => {
    const normalized = candidate.name.toLowerCase();
    if (normalized === "compile") {
        return [
            {
                label: "component-source",
                args: () => [
                    source,
                    {
                        dev: false,
                        filename: "CheckHot.svelte",
                        generate: "client"
                    }
                ],
                verify: verifyCode,
                acceptMutation: acceptCompileOptionMutation,
                verifyMutation: verifyCompileMutation,
                probeFingerprint: fingerprintCode,
                warmupIterations: 20,
                stressIterations: 5
            }
        ];
    }
    if (normalized === "compilemodule") {
        return [
            {
                label: "module-source",
                args: () => [
                    "export const answer = 42;",
                    {
                        dev: false,
                        filename: "check-hot.svelte.js",
                        generate: "client"
                    }
                ],
                verify: verifyCode,
                acceptMutation: acceptCompileOptionMutation,
                verifyMutation: verifyCompileMutation,
                probeFingerprint: fingerprintCode,
                warmupIterations: 20,
                stressIterations: 5
            }
        ];
    }
    if (/^(?:parse|parsecss)$/u.test(normalized)) {
        return [
            {
                label: "component-source",
                args: () => [source, { filename: "CheckHot.svelte" }],
                verify: verifyObject,
                warmupIterations: 100,
                stressIterations: 20
            }
        ];
    }
    if (normalized === "migrate") {
        return [
            {
                label: "legacy-component-source",
                args: () => [source, { filename: "CheckHot.svelte" }],
                verify: verifyCode,
                probeFingerprint: fingerprintCode,
                warmupIterations: 20,
                stressIterations: 5
            }
        ];
    }
    if (normalized === "preprocess") {
        return [
            {
                label: "identity-markup-preprocessor",
                args: () => [
                    source,
                    {
                        markup: ({ content }: { content: string }) => ({
                            code: content
                        })
                    },
                    { filename: "CheckHot.svelte" }
                ],
                verify: verifyCode,
                probeFingerprint: fingerprintCode,
                warmupIterations: 10,
                stressIterations: 3
            }
        ];
    }
    return [];
};

/** Compiler recipes declared compatible with the selected Svelte releases. */
const svelteTestRunner = createRecipeTestRunner({
    id: "svelte-compiler",
    version: testRunnerVersion,
    packageNames: ["svelte"],
    packageRange: sveltePackageRange,
    resolve: resolveSvelteRecipes
});

export default svelteTestRunner;
