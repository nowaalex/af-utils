import { spawnSync } from "node:child_process";
import {
    cpSync,
    existsSync,
    mkdtempSync,
    mkdirSync,
    readFileSync,
    readdirSync,
    rmSync,
    writeFileSync
} from "node:fs";
import { tmpdir } from "node:os";
import { join, relative, resolve } from "node:path";
import { chromium } from "@playwright/test";
import { build } from "esbuild";
import { adapters } from "./contract.mjs";

const packageRoot = resolve(import.meta.dirname, "..");
const workspaceRoot = resolve(packageRoot, "../../..");
const fixturesRoot = join(packageRoot, "fixtures");
const temporaryRoot = mkdtempSync(
    join(tmpdir(), "af-utils-virtual-compatibility-")
);
const tarballsRoot = join(temporaryRoot, "tarballs");
const casesRoot = join(temporaryRoot, "cases");
const pnpm = process.platform === "win32" ? "pnpm.cmd" : "pnpm";

const readJson = path => JSON.parse(readFileSync(path, "utf8"));
const writeJson = (path, value) =>
    writeFileSync(path, `${JSON.stringify(value, null, 4)}\n`);
const writeTypeScriptConfig = (directory, include) =>
    writeJson(join(directory, "tsconfig.json"), {
        compilerOptions: {
            lib: ["ES2022", "DOM", "DOM.Iterable"],
            module: "ESNext",
            moduleResolution: "Bundler",
            noEmit: true,
            skipLibCheck: false,
            strict: true,
            target: "ES2022"
        },
        include
    });

const run = (command, args, cwd, capture = false) => {
    const result = spawnSync(command, args, {
        cwd,
        encoding: "utf8",
        stdio: capture ? "pipe" : "inherit"
    });
    if (result.status !== 0) {
        const details = [result.stdout, result.stderr]
            .filter(Boolean)
            .join("\n");
        throw new Error(
            `${command} ${args.join(" ")} failed${details ? `:\n${details}` : ""}`
        );
    }
    return result.stdout ?? "";
};

const frameworkFloors = range =>
    range.split(/\s*\|\|\s*/u).map(alternative => {
        const match = alternative.match(/^\^(\d+\.\d+\.\d+)$/u);
        if (!match) {
            throw new Error(
                `Unsupported peer range ${JSON.stringify(range)}. ` +
                    "Use explicit caret ranges so every supported line has a testable floor."
            );
        }
        return match[1];
    });

const getFrameworkFloors = adapter => {
    const manifestPath = join(
        workspaceRoot,
        "packages/virtual",
        adapter.id,
        "package.json"
    );
    const manifest = readJson(manifestPath);
    const range = manifest.peerDependencies?.[adapter.peerName];
    if (!range) {
        throw new Error(
            `${relative(workspaceRoot, manifestPath)} has no ${adapter.peerName} peer dependency`
        );
    }
    return frameworkFloors(range);
};

const pack = packageName => {
    const descriptor = adapters.find(item => item.packageName === packageName);
    const directory = descriptor
        ? join(workspaceRoot, "packages/virtual", descriptor.id)
        : join(workspaceRoot, "packages/virtual/core");
    const before = new Set(readdirSync(tarballsRoot));
    run(pnpm, ["pack", "--pack-destination", tarballsRoot], directory, true);
    const created = readdirSync(tarballsRoot).filter(file => !before.has(file));
    if (created.length !== 1) {
        throw new Error(
            `Expected one tarball for ${packageName}, found ${created.length}`
        );
    }
    return join(tarballsRoot, created[0]);
};

const createCase = (adapter, version, tarballs) => {
    const name = `${adapter.id}-${version.replaceAll(".", "-")}`;
    const directory = join(casesRoot, name);
    mkdirSync(directory, { recursive: true });

    writeJson(join(directory, "package.json"), {
        name: `@af-utils/virtual-compatibility-${name}`,
        private: true,
        type: "module",
        dependencies: {
            "@af-utils/virtual-core": `file:${tarballs.get("@af-utils/virtual-core")}`,
            [adapter.packageName]: `file:${tarballs.get(adapter.packageName)}`,
            [adapter.peerName]: version,
            ...adapter.companionDependencies?.(version)
        }
    });
    cpSync(
        join(fixturesRoot, adapter.id, "browser.mjs"),
        join(directory, "browser.mjs")
    );
    cpSync(
        join(fixturesRoot, adapter.id, "types.ts"),
        join(directory, "types.ts")
    );
    writeTypeScriptConfig(directory, ["types.ts"]);
    writeFileSync(
        join(directory, "node.mjs"),
        `import * as adapter from ${JSON.stringify(adapter.packageName)};\n` +
            `const expected = ${JSON.stringify(adapter.exports)};\n` +
            "for (const name of expected) {\n" +
            "    if (!(name in adapter)) throw new Error(`Missing export ${name}`);\n" +
            "}\n"
    );

    return { adapter, directory, name, version };
};

const createTypeScript7Case = tarballs => {
    const directory = join(casesRoot, "typescript-7");
    const dependencies = {
        "@af-utils/virtual-core": `file:${tarballs.get("@af-utils/virtual-core")}`
    };
    mkdirSync(directory, { recursive: true });

    for (const adapter of adapters) {
        const version = getFrameworkFloors(adapter).at(-1);
        dependencies[adapter.packageName] =
            `file:${tarballs.get(adapter.packageName)}`;
        dependencies[adapter.peerName] = version;
        Object.assign(dependencies, adapter.companionDependencies?.(version));
        cpSync(
            join(fixturesRoot, adapter.id, "types.ts"),
            join(directory, `${adapter.id}.ts`)
        );
    }

    writeJson(join(directory, "package.json"), {
        name: "@af-utils/virtual-compatibility-typescript-7",
        private: true,
        type: "module",
        dependencies
    });
    writeTypeScriptConfig(directory, ["*.ts"]);
    return directory;
};

const runBrowserContract = async (browser, testCase) => {
    const bundle = join(testCase.directory, "browser.js");
    await build({
        absWorkingDir: testCase.directory,
        bundle: true,
        entryPoints: ["browser.mjs"],
        format: "iife",
        logLevel: "silent",
        outfile: bundle,
        platform: "browser",
        target: ["es2022"]
    });

    const page = await browser.newPage();
    try {
        await page.setContent('<main id="root"></main>');
        await page.addScriptTag({ path: bundle });
        await page.evaluate(() => globalThis.__virtualCompatibility);
    } finally {
        await page.close();
    }
};

let succeeded = false;
try {
    mkdirSync(tarballsRoot, { recursive: true });
    mkdirSync(casesRoot, { recursive: true });

    console.log("Packing virtual packages...");
    const packageNames = [
        "@af-utils/virtual-core",
        ...adapters.map(adapter => adapter.packageName)
    ];
    const tarballs = new Map(
        packageNames.map(packageName => [packageName, pack(packageName)])
    );

    const cases = adapters.flatMap(adapter =>
        getFrameworkFloors(adapter).map(version =>
            createCase(adapter, version, tarballs)
        )
    );
    const typeScript7Case = createTypeScript7Case(tarballs);
    const typeScript6Version = readJson(
        join(packageRoot, "node_modules/typescript/package.json")
    ).version;
    const typeScript7Version = readJson(
        join(packageRoot, "node_modules/@typescript/native/package.json")
    ).version;

    writeJson(join(temporaryRoot, "package.json"), {
        name: "af-utils-virtual-compatibility-workspace",
        private: true,
        type: "module",
        devDependencies: {
            "@typescript/native": `npm:typescript@${typeScript7Version}`,
            typescript: `npm:@typescript/typescript6@${typeScript6Version}`
        }
    });
    writeFileSync(
        join(temporaryRoot, "pnpm-workspace.yaml"),
        'packages:\n    - "cases/*"\n' +
            'overrides:\n    "@af-utils/virtual-core": ' +
            `${JSON.stringify(`file:${tarballs.get("@af-utils/virtual-core")}`)}\n`
    );

    console.log(`Installing ${cases.length} compatibility cases...`);
    run(
        pnpm,
        ["install", "--strict-peer-dependencies", "--no-frozen-lockfile"],
        temporaryRoot
    );

    console.log("Checking public types and Node exports...");
    for (const testCase of cases) {
        run(
            pnpm,
            [
                "exec",
                "tsc6",
                "--stableTypeOrdering",
                "--project",
                join(testCase.directory, "tsconfig.json")
            ],
            temporaryRoot,
            true
        );
        run(
            process.execPath,
            [join(testCase.directory, "node.mjs")],
            temporaryRoot,
            true
        );
        console.log(
            `  ${testCase.adapter.peerName}@${testCase.version}: types + Node`
        );
    }

    console.log(
        `Checking combined public types with TypeScript ${typeScript7Version}...`
    );
    run(
        pnpm,
        [
            "exec",
            "tsc",
            "--checkers",
            "1",
            "--project",
            join(typeScript7Case, "tsconfig.json")
        ],
        temporaryRoot,
        true
    );

    console.log("Checking browser lifecycles in Chromium...");
    const browser = await chromium.launch();
    try {
        await Promise.all(
            cases.map(async testCase => {
                await runBrowserContract(browser, testCase);
                console.log(
                    `  ${testCase.adapter.peerName}@${testCase.version}: browser`
                );
            })
        );
    } finally {
        await browser.close();
    }

    succeeded = true;
    console.log(
        `Compatibility contract passed for ${cases.length} framework floors and TypeScript ${typeScript7Version}.`
    );
} finally {
    if (succeeded || process.env.CI) {
        rmSync(temporaryRoot, { force: true, recursive: true });
    } else if (existsSync(temporaryRoot)) {
        console.error(`Failed workspace kept at ${temporaryRoot}`);
    }
}
