import {
    test as base,
    expect,
    type Locator,
    type Page
} from "@playwright/test";
import type { ExampleFramework } from "../config";
import { discoverExamples } from "../discovery";

export type { Page } from "@playwright/test";
export type { Locator };
export { expect };

export interface ExampleTestTarget {
    documentationPath: string;
    framework: ExampleFramework;
    previewPath: string;
    route: string;
}

export const test = base.extend<{ unexpectedPageErrors: undefined }>({
    unexpectedPageErrors: [
        async ({ page }, use) => {
            const unexpectedErrors = new Set<string>();
            const handlePageError = (error: Error) => {
                unexpectedErrors.add(error.message);
            };

            await page.exposeFunction(
                "__afReportWindowError",
                (message: string) => unexpectedErrors.add(message)
            );
            await page.addInitScript(() => {
                const report = (
                    globalThis as typeof globalThis & {
                        __afReportWindowError(message: string): Promise<void>;
                    }
                ).__afReportWindowError;

                // Vite handles ErrorEvents before Playwright emits `pageerror`.
                // Capture them first so ResizeObserver loop errors still fail e2e.
                globalThis.addEventListener(
                    "error",
                    event => {
                        if (event instanceof ErrorEvent && event.message) {
                            void report(event.message);
                        }
                    },
                    { capture: true }
                );
            });
            page.on("pageerror", handlePageError);

            await use();

            page.off("pageerror", handlePageError);
            expect([...unexpectedErrors]).toEqual([]);
        },
        { auto: true }
    ]
});

const discoveredExamples = discoverExamples();

export const describeExample = async (
    groupPath: string,
    defineTests: (target: ExampleTestTarget) => void
) => {
    const examples = (await discoveredExamples).filter(
        example => example.groupPath === groupPath
    );
    if (examples.length === 0) {
        throw new Error(`No implementations found for example: ${groupPath}`);
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

export function expectDefined<T>(
    value: T | null | undefined,
    message = "Expected value to be defined"
): T {
    expect(value, message).not.toBeNull();
    expect(value, message).not.toBeUndefined();
    if (value === null || value === undefined) throw new Error(message);
    return value;
}

export const getVerticalScrollbarX = (element: Locator) =>
    element.evaluate(node => {
        const bounds = node.getBoundingClientRect();
        const style = getComputedStyle(node);
        const borderLeft = Number.parseFloat(style.borderLeftWidth) || 0;
        const borderRight = Number.parseFloat(style.borderRightWidth) || 0;
        const scrollbarWidth =
            node.offsetWidth - node.clientWidth - borderLeft - borderRight;

        if (scrollbarWidth <= 0) {
            throw new Error("Expected a visible vertical scrollbar");
        }

        return bounds.right - borderRight - scrollbarWidth / 2;
    });

export const waitForExampleHydration = async (page: Page) => {
    await expect(page.locator("astro-island").first()).toBeAttached();
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

export const requireNativeScrollbarPointer = (browserName: string) => {
    test.skip(
        browserName !== "chromium" || test.info().project.name !== "chromium",
        "Playwright exposes pointer-draggable classic scrollbars only in desktop Chromium"
    );
};
