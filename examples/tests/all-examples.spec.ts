import { discoverExamples } from "../discovery";
import {
    captureStableScreenshot,
    compareScreenshots,
    expect,
    openExample,
    test
} from "../src/e2e";

const examples = await discoverExamples();
const groups = Map.groupBy(examples, example => example.groupPath);

test.describe("all example integrations", () => {
    for (const example of examples) {
        test(`${example.route} hydrates without errors`, async ({ page }) => {
            await openExample(page, `/examples/${example.route}`);
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
                await openExample(page, `/examples/${implementation.route}`);
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
