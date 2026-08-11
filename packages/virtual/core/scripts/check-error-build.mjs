import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";

const paths = {
    browserDevelopment: new URL(
        "../dist/index.development.js",
        import.meta.url
    ),
    browserProduction: new URL("../dist/index.production.js", import.meta.url),
    nodeDevelopment: new URL(
        "../dist/index.node.development.js",
        import.meta.url
    ),
    nodeProduction: new URL("../dist/index.node.production.js", import.meta.url)
};

await Promise.all([
    assert.rejects(access(new URL("../dist/index.js", import.meta.url))),
    assert.rejects(access(new URL("../dist/index.node.js", import.meta.url)))
]);

const [
    browserDevelopmentSource,
    browserProductionSource,
    nodeDevelopmentSource,
    nodeProductionSource
] = await Promise.all([
    readFile(paths.browserDevelopment, "utf8"),
    readFile(paths.browserProduction, "utf8"),
    readFile(paths.nodeDevelopment, "utf8"),
    readFile(paths.nodeProduction, "utf8")
]);

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
        new module.VirtualScroller({ itemCount: -1 });
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

browserProduction.assert(true, codeIndex);
browserDevelopment.assert(true, codeIndex);
assert.throws(
    () => browserProduction.assert(false, codeIndex),
    error =>
        error instanceof browserProduction.VirtualScrollerError &&
        error.code === code &&
        error.message === code
);

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
assert.equal(browserProductionSource.match(/AFV_/g)?.length, 14);
assert.equal(nodeProductionSource.match(/AFV_/g)?.length, 14);
assert.deepEqual(
    Object.getOwnPropertyNames(browserProduction.VirtualScrollerError).sort(),
    builtInClassProperties
);

assert(developmentError instanceof browserDevelopment.VirtualScrollerError);
assert.equal(developmentError.code, code);
assert.match(developmentError.message, /itemCount must be a safe integer/);
assert(browserDevelopmentSource.includes("itemCount must be a safe integer"));
assert(nodeDevelopmentSource.includes("itemCount must be a safe integer"));
assert.deepEqual(
    Object.getOwnPropertyNames(browserDevelopment.VirtualScrollerError).sort(),
    builtInClassProperties
);

assert.equal(
    captureInvalidCount(nodeProduction).message,
    code,
    "The Node production entrypoint must select compact errors"
);
assert.match(
    captureInvalidCount(nodeDevelopment).message,
    /itemCount must be a safe integer/,
    "The Node development entrypoint must select detailed errors"
);
