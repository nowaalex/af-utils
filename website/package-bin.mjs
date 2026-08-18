import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";

const require = createRequire(import.meta.url);

export const resolvePackageBin = (packageName, binName) => {
    const manifestPath = require.resolve(`${packageName}/package.json`);
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
