import { discoverExamples } from "../discovery";
import { expect, test, waitForExampleHydration } from "../src/e2e";

const examples = await discoverExamples();
const groups = Map.groupBy(examples, example => example.groupPath);

const captureStableScreenshot = async (
    page: import("@playwright/test").Page
) => {
    // Hydration can schedule framework effects after the first stable paint.
    // Give those effects and their first ResizeObserver delivery a chance to run.
    await page.waitForTimeout(250);
    let previous = await page.screenshot({ animations: "disabled" });
    // oxlint-disable eslint/no-await-in-loop -- Each screenshot is compared with the immediately preceding frame to detect stability.
    for (let attempt = 0; attempt < 20; attempt++) {
        await page.waitForTimeout(100);
        const current = await page.screenshot({ animations: "disabled" });
        if (current.equals(previous)) return current;
        previous = current;
    }
    // oxlint-enable eslint/no-await-in-loop
    throw new Error("Example screenshot did not stabilize within two seconds");
};

test.describe("all example integrations", () => {
    for (const example of examples) {
        test(`${example.route} hydrates without errors`, async ({ page }) => {
            const response = await page.goto(`/examples/${example.route}`);
            expect(response?.ok()).toBe(true);
            await waitForExampleHydration(page);
        });
    }
});

test.describe("cross-framework pixel parity", () => {
    for (const [groupPath, implementations] of groups) {
        if (implementations.length < 2) continue;

        test(`${groupPath} implementations render identically`, async ({
            page
        }, testInfo) => {
            const screenshots: { framework: string; screenshot: Buffer }[] = [];

            // oxlint-disable eslint/no-await-in-loop -- Implementations intentionally reuse one page and are captured in deterministic catalog order.
            for (const implementation of implementations) {
                await page.goto(`/examples/${implementation.route}`);
                await waitForExampleHydration(page);
                screenshots.push({
                    framework: implementation.framework,
                    screenshot: await captureStableScreenshot(page)
                });
            }
            // oxlint-enable eslint/no-await-in-loop

            const [expected, ...actual] = screenshots;
            if (!expected) throw new Error(`Empty example group: ${groupPath}`);
            // oxlint-disable eslint/no-await-in-loop -- Failure artifacts are attached in framework order for a readable report.
            for (const implementation of actual) {
                if (!implementation.screenshot.equals(expected.screenshot)) {
                    await testInfo.attach(`${expected.framework}-expected`, {
                        body: expected.screenshot,
                        contentType: "image/png"
                    });
                    await testInfo.attach(
                        `${implementation.framework}-actual`,
                        {
                            body: implementation.screenshot,
                            contentType: "image/png"
                        }
                    );
                }
                expect(
                    implementation.screenshot.equals(expected.screenshot),
                    `${implementation.framework} differs from ${expected.framework}`
                ).toBe(true);
            }
            // oxlint-enable eslint/no-await-in-loop
        });
    }
});
