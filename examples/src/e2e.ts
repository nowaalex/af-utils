import { expect, test as base } from "@playwright/test";

export { expect };
export type { Locator, Page } from "@playwright/test";

export const test = base.extend<{ unexpectedPageErrors: void }>({
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
