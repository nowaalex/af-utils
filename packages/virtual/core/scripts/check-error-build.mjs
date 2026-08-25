import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";

const outputFileNames = {
    browserDevelopment: "index.development.js",
    browserProduction: "index.production.js",
    nodeDevelopment: "index.node.development.js",
    nodeProduction: "index.node.production.js"
};
const paths = Object.fromEntries(
    Object.entries(outputFileNames).map(([name, fileName]) => [
        name,
        new URL(`../dist/${fileName}`, import.meta.url)
    ])
);

await Promise.all([
    assert.rejects(access(new URL("../dist/index.js", import.meta.url))),
    assert.rejects(access(new URL("../dist/index.node.js", import.meta.url)))
]);

const buildSources = Object.fromEntries(
    await Promise.all(
        Object.entries(outputFileNames).map(async ([name, fileName]) => {
            const source = await readFile(paths[name], "utf8");
            const sourceMapFileName = `${fileName}.map`;
            const sourceMap = JSON.parse(
                await readFile(
                    new URL(`../dist/${sourceMapFileName}`, import.meta.url),
                    "utf8"
                )
            );

            assert.equal(
                source
                    .trimEnd()
                    .endsWith(`//# sourceMappingURL=${sourceMapFileName}`),
                true,
                `${fileName} must link its external source map`
            );
            assert.equal(sourceMap.version, 3);
            assert(sourceMap.mappings.length > 0);
            assert.equal(
                sourceMap.sourcesContent?.length,
                sourceMap.sources.length
            );

            return [name, source];
        })
    )
);
const {
    browserDevelopment: browserDevelopmentSource,
    browserProduction: browserProductionSource,
    nodeDevelopment: nodeDevelopmentSource,
    nodeProduction: nodeProductionSource
} = buildSources;

delete globalThis.ResizeObserver;
const nodeProduction = await import(paths.nodeProduction.href);
assert.equal(typeof globalThis.ResizeObserver, "function");

const [browserDevelopment, browserProduction, nodeDevelopment] =
    await Promise.all([
        import(paths.browserDevelopment.href),
        import(paths.browserProduction.href),
        import(paths.nodeDevelopment.href)
    ]);

const captureInvalidCount = module => {
    try {
        void new module.VirtualScroller({ itemCount: -1 });
    } catch (error) {
        return error;
    }
    assert.fail("Invalid itemCount did not throw");
};

const productionError = captureInvalidCount(browserProduction);
const developmentError = captureInvalidCount(browserDevelopment);
const codeIndex = 2;
const code = browserProduction.VirtualScrollerErrorCode[codeIndex];
const builtInClassProperties = ["length", "name", "prototype"];

assert(productionError instanceof browserProduction.VirtualScrollerError);
assert.equal(productionError.code, code);
assert.equal(productionError.message, code);
assert(!browserProductionSource.includes("itemCount must be a safe integer"));
assert(!nodeProductionSource.includes("itemCount must be a safe integer"));
assert(!browserProductionSource.includes("useVirtualLayout requires"));
assert(!browserProductionSource.includes("process.env"));
assert(!browserProductionSource.includes("globalThis.ResizeObserver"));
assert(!browserProductionSource.includes("/**"));
assert(nodeProductionSource.includes("globalThis.ResizeObserver"));
assert.equal(
    browserProductionSource.match(/AFV_/gu)?.length,
    browserProduction.VirtualScrollerErrorCode.length
);
assert.equal(
    nodeProductionSource.match(/AFV_/gu)?.length,
    nodeProduction.VirtualScrollerErrorCode.length
);
assert.deepEqual(
    Object.getOwnPropertyNames(
        browserProduction.VirtualScrollerError
    ).toSorted(),
    builtInClassProperties
);

assert(developmentError instanceof browserDevelopment.VirtualScrollerError);
assert.equal(developmentError.code, code);
assert.match(developmentError.message, /itemCount must be a safe integer/u);
assert(browserDevelopmentSource.includes("itemCount must be a safe integer"));
assert(nodeDevelopmentSource.includes("itemCount must be a safe integer"));
assert.deepEqual(
    Object.getOwnPropertyNames(
        browserDevelopment.VirtualScrollerError
    ).toSorted(),
    builtInClassProperties
);

assert.equal(
    captureInvalidCount(nodeProduction).message,
    code,
    "The Node production entrypoint must select compact errors"
);
assert.match(
    captureInvalidCount(nodeDevelopment).message,
    /itemCount must be a safe integer/u,
    "The Node development entrypoint must select detailed errors"
);
