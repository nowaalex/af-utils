import { discoverExamples } from "../discovery";
import { expect, test, waitForExampleHydration } from "../src/e2e";

const examples = await discoverExamples();
const groups = Map.groupBy(examples, example => example.groupPath);

const captureStableScreenshot = async (
    page: import("@playwright/test").Page
) => {
    await page.evaluate(() => document.fonts.ready);
    // Hydration can schedule framework effects after the first stable paint.
    // Give those effects and their first ResizeObserver delivery a chance to run.
    await page.waitForTimeout(250);
    let previous = await page.screenshot({ animations: "disabled" });
    let consecutiveStableFrames = 0;
    // oxlint-disable eslint/no-await-in-loop -- Each screenshot is compared with the immediately preceding frame to detect stability.
    for (let attempt = 0; attempt < 20; attempt++) {
        await page.waitForTimeout(100);
        const current = await page.screenshot({ animations: "disabled" });
        consecutiveStableFrames = current.equals(previous)
            ? consecutiveStableFrames + 1
            : 0;
        if (consecutiveStableFrames >= 3) return current;
        previous = current;
    }
    // oxlint-enable eslint/no-await-in-loop
    throw new Error("Example screenshot did not stabilize within two seconds");
};

interface ScreenshotComparison {
    differingPixels: number;
    matches: boolean;
    maxChannelDelta: number;
}

const compareScreenshots = async (
    page: import("@playwright/test").Page,
    expected: Buffer,
    actual: Buffer
): Promise<ScreenshotComparison> => {
    if (actual.equals(expected)) {
        return { differingPixels: 0, matches: true, maxChannelDelta: 0 };
    }

    const comparison = await page.evaluate(
        async ({ actualBase64, expectedBase64 }) => {
            // oxlint-disable-next-line unicorn/consistent-function-scoping -- This helper must be created in the browser context serialized by page.evaluate.
            const decode = async (base64: string) => {
                const bytes = Uint8Array.from(atob(base64), character =>
                    character.charCodeAt(0)
                );
                const bitmap = await createImageBitmap(
                    new Blob([bytes], { type: "image/png" })
                );
                const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
                const context = canvas.getContext("2d");
                if (!context) throw new Error("Missing screenshot canvas");
                context.drawImage(bitmap, 0, 0);
                return context.getImageData(0, 0, bitmap.width, bitmap.height);
            };

            const [expectedImage, actualImage] = await Promise.all([
                decode(expectedBase64),
                decode(actualBase64)
            ]);
            if (
                expectedImage.width !== actualImage.width ||
                expectedImage.height !== actualImage.height
            ) {
                return {
                    differingPixels: Number.POSITIVE_INFINITY,
                    maxChannelDelta: 255,
                    totalPixels: 0
                };
            }

            let differingPixels = 0;
            let maxChannelDelta = 0;
            for (let index = 0; index < expectedImage.data.length; index += 4) {
                let pixelDiffers = false;
                for (let channel = 0; channel < 4; channel++) {
                    const delta = Math.abs(
                        expectedImage.data[index + channel]! -
                            actualImage.data[index + channel]!
                    );
                    if (delta > 0) pixelDiffers = true;
                    if (delta > maxChannelDelta) maxChannelDelta = delta;
                }
                if (pixelDiffers) differingPixels++;
            }

            return {
                differingPixels,
                maxChannelDelta,
                totalPixels: expectedImage.width * expectedImage.height
            };
        },
        {
            actualBase64: actual.toString("base64"),
            expectedBase64: expected.toString("base64")
        }
    );

    return {
        ...comparison,
        // Browser rasterizers can shade a very small number of text-edge
        // pixels differently across otherwise identical shadow-DOM and
        // light-DOM implementations, especially at mobile device scale.
        matches:
            comparison.differingPixels <=
                Math.max(4, Math.ceil(comparison.totalPixels * 0.0001)) &&
            comparison.maxChannelDelta <= 64
    };
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
                const comparison = await compareScreenshots(
                    page,
                    expected.screenshot,
                    implementation.screenshot
                );
                if (!comparison.matches) {
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
                    comparison.matches,
                    `${implementation.framework} differs from ${expected.framework}: ${comparison.differingPixels} pixels, maximum channel delta ${comparison.maxChannelDelta}`
                ).toBe(true);
            }
            // oxlint-enable eslint/no-await-in-loop
        });
    }
});
