import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, parse, resolve } from "node:path";

const require = createRequire(import.meta.url);

export const resolvePackageBin = (packageName, binName) => {
    let manifestPath;
    try {
        manifestPath = require.resolve(`${packageName}/package.json`);
    } catch (error) {
        if (error?.code !== "ERR_PACKAGE_PATH_NOT_EXPORTED") throw error;

        try {
            let directory = dirname(require.resolve(packageName));
            const root = parse(directory).root;
            while (directory !== root) {
                const candidate = resolve(directory, "package.json");
                if (existsSync(candidate)) {
                    manifestPath = candidate;
                    break;
                }
                directory = dirname(directory);
            }
        } catch (entryError) {
            if (entryError?.code !== "ERR_PACKAGE_PATH_NOT_EXPORTED") {
                throw entryError;
            }
        }

        for (const searchPath of require.resolve.paths(packageName) ?? []) {
            const candidate = resolve(searchPath, packageName, "package.json");
            if (existsSync(candidate)) {
                manifestPath = candidate;
                break;
            }
        }
        if (!manifestPath) {
            throw new Error(`Cannot find the ${packageName} manifest`, {
                cause: error
            });
        }
    }
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    const relativeBin =
        typeof manifest.bin === "string"
            ? manifest.bin
            : manifest.bin?.[binName];

    if (typeof relativeBin !== "string") {
        throw new Error(`${packageName} does not expose the ${binName} binary`);
    }

    return resolve(dirname(manifestPath), relativeBin);
};
