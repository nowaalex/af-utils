import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach } from "vitest";

import { analyzeHotModule } from "../../analyzer.js";

/** Register isolated source fixtures and their automatic cleanup for a rule test. */
export const analyzerFixture = (prefix: string, extension = "js") => {
    const directories: string[] = [];
    afterEach(async () => {
        await Promise.all(
            directories
                .splice(0)
                .map(directory =>
                    rm(directory, { force: true, recursive: true })
                )
        );
    });
    return async (source: string) => {
        const directory = await mkdtemp(join(tmpdir(), `check-hot-${prefix}-`));
        directories.push(directory);
        const file = join(directory, `fixture.${extension}`);
        await writeFile(file, source);
        return analyzeHotModule({ input: file });
    };
};
