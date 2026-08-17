import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, test } from "vitest";

import { createHotPackageTreeIdentity } from "../src/source-identity.js";

describe("package source identity", () => {
    test("uses locale-independent path ordering and ignores documentation", async () => {
        const left = await mkdtemp(join(tmpdir(), "check-hot-identity-"));
        const right = await mkdtemp(join(tmpdir(), "check-hot-identity-"));
        try {
            for (const [directory, names] of [
                [left, ["a.js", "A.js", "ä.js"]],
                [right, ["ä.js", "A.js", "a.js"]]
            ] as const) {
                for (const name of names) {
                    // oxlint-disable-next-line no-await-in-loop -- Creation order is deliberately varied to test canonical sorting.
                    await writeFile(
                        join(directory, name),
                        `export default ${JSON.stringify(name)};`
                    );
                }
                // oxlint-disable-next-line no-await-in-loop -- Documentation is deliberately outside the resolver-sensitive identity.
                await writeFile(join(directory, "README.md"), directory);
                // oxlint-disable-next-line no-await-in-loop -- Arbitrary result JSON is not a resolver config or selected graph asset.
                await writeFile(join(directory, "result.json"), directory);
                // oxlint-disable-next-line no-await-in-loop -- Resolver manifests must remain part of the identity.
                await writeFile(
                    join(directory, "package.json"),
                    JSON.stringify({ name: "identity-fixture" })
                );
                // oxlint-disable-next-line no-await-in-loop -- A source directory may legitimately be named coverage.
                await mkdir(join(directory, "coverage"));
                // oxlint-disable-next-line no-await-in-loop -- Resolver-sensitive sources cannot be excluded by directory basename.
                await writeFile(
                    join(directory, "coverage/dep.js"),
                    "export default 1;"
                );
            }

            expect(await createHotPackageTreeIdentity(left)).toEqual(
                await createHotPackageTreeIdentity(right)
            );
            await writeFile(
                join(right, "coverage/dep.ts"),
                "export default 2;"
            );
            expect(await createHotPackageTreeIdentity(left)).not.toEqual(
                await createHotPackageTreeIdentity(right)
            );
        } finally {
            await Promise.all([
                rm(left, { force: true, recursive: true }),
                rm(right, { force: true, recursive: true })
            ]);
        }
    });
});
