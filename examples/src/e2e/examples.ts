import type { Page } from "@playwright/test";
import type { ExampleFramework } from "../../config";
import { discoverExamples } from "../../discovery";
import { expect, test } from "./fixture";

export interface ExampleTestTarget {
    documentationPath: string;
    framework: ExampleFramework;
    previewPath: string;
    route: string;
}

const discoveredExamples = discoverExamples();

export const describeExample = async (
    groupPath: string,
    defineTests: (target: ExampleTestTarget) => void,
    expectedFrameworks: readonly ExampleFramework[] = []
) => {
    const examples = (await discoveredExamples).filter(
        example => example.groupPath === groupPath
    );
    if (examples.length === 0) {
        throw new Error(`No implementations found for example: ${groupPath}`);
    }
    const missingFrameworks = expectedFrameworks.filter(
        framework => !examples.some(example => example.framework === framework)
    );
    if (missingFrameworks.length > 0) {
        throw new Error(
            `Missing ${groupPath} implementations: ${missingFrameworks.join(", ")}`
        );
    }

    for (const example of examples) {
        const [project, ...route] = example.route.split("/");
        test.describe(example.framework, () =>
            defineTests({
                documentationPath: `/${project}/examples/${route.join("/")}`,
                framework: example.framework,
                previewPath: `/examples/${example.route}`,
                route: example.route
            })
        );
    }
};

export const waitForExampleHydration = async (page: Page) => {
    await expect(
        page.locator("astro-island, [data-example-ready]").first()
    ).toBeAttached();
    await expect.poll(() => page.locator("astro-island[ssr]").count()).toBe(0);
    await page.evaluate(
        () =>
            new Promise<void>(resolve => {
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => resolve());
                });
            })
    );
};

export const openExample = async (page: Page, path: string) => {
    const response = await page.goto(path);
    expect(response?.ok()).toBe(true);
    await waitForExampleHydration(page);
};
