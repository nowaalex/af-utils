import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, test } from "vitest";

import {
    discoverHotAnnotations,
    hotAnnotationTargetAlias,
    validateHotAnnotations
} from "../src/annotations.js";

const temporaryDirectories: string[] = [];

afterEach(async () => {
    await Promise.all(
        temporaryDirectories
            .splice(0)
            .map(path => rm(path, { force: true, recursive: true }))
    );
});

const createTemporaryDirectory = async () => {
    const path = await mkdtemp(join(tmpdir(), "check-hot-test-"));
    temporaryDirectories.push(path);
    return path;
};

describe("check-hot source annotations", () => {
    test("derives deterministic catalog aliases from prototype markers", () => {
        expect(hotAnnotationTargetAlias("SizeIndex._getOffset")).toBe(
            "sizeIndexGetOffset"
        );
        expect(
            hotAnnotationTargetAlias("VirtualScrollerEvents._beginBatch")
        ).toBe("virtualScrollerEventsBeginBatch");
        expect(() => hotAnnotationTargetAlias("detached")).toThrow(
            "must contain an owner and method"
        );
    });

    test("discovers multiple language comment forms without matching strings", async () => {
        const directory = await createTemporaryDirectory();
        await writeFile(
            join(directory, "fixture.ts"),
            [
                '// "check-hot: ignored.string"',
                'const ignored = "// check-hot: ignored.inline";',
                "// check-hot: TypeScript.method",
                "/* check-hot: JavaScript.method */",
                "# check-hot: Python.method"
            ].join("\n")
        );
        await writeFile(
            join(directory, "fixture.py"),
            "# check-hot: Python.file_method\n"
        );

        const markers = await discoverHotAnnotations([directory]);

        expect(markers.map(marker => marker.id)).toEqual([
            "Python.file_method",
            "TypeScript.method",
            "JavaScript.method"
        ]);
    });

    test("reports missing, duplicate, and stale marker contracts", async () => {
        const directory = await createTemporaryDirectory();
        await writeFile(
            join(directory, "fixture.ts"),
            [
                "// check-hot: Present.method",
                "// check-hot: Present.method",
                "// check-hot: Stale.method"
            ].join("\n")
        );
        const suiteUrl = new URL("suite.mjs", `file://${directory}/`);
        const problems = await validateHotAnnotations(
            { roots: ["."], relativeTo: "suite", requireTargets: true },
            [
                { id: "Present.method", resolve: () => () => {} },
                { id: "Missing.method", resolve: () => () => {} }
            ],
            suiteUrl
        );

        expect(problems).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    problemId: "annotation-contract-mismatch",
                    message: expect.stringContaining(
                        "Present.method occurs 2 times"
                    )
                }),
                expect.objectContaining({
                    message: expect.stringContaining(
                        "Stale.method has no declared target"
                    )
                }),
                expect.objectContaining({
                    message: expect.stringContaining(
                        "Missing.method is missing source marker"
                    )
                })
            ])
        );
    });

    test("binds a default JS marker to its exact AST function owner", async () => {
        const directory = await createTemporaryDirectory();
        await writeFile(
            join(directory, "fixture.ts"),
            [
                "class Model {",
                "  // check-hot: Model.good",
                "  good() { return 1; }",
                "}",
                "// check-hot: Model.detached",
                "const value = 1;",
                "// check-hot: Model.wrong",
                "function other() { return value; }"
            ].join("\n")
        );
        const suiteUrl = new URL("suite.mjs", `file://${directory}/`);
        const problems = await validateHotAnnotations(
            { roots: ["."], relativeTo: "suite", requireTargets: true },
            [
                { id: "Model.good", resolve: () => () => {} },
                { id: "Model.detached", resolve: () => () => {} },
                { id: "Model.wrong", resolve: () => () => {} }
            ],
            suiteUrl
        );

        const messages = problems.map(problem => problem.message).join("\n");
        expect(messages).not.toContain("Model.good");
        expect(messages).toContain("Model.detached is not attached");
        expect(messages).toContain(
            "Model.wrong is attached to other, expected exact owner Model.wrong"
        );
    });
});
