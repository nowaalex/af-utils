import type { Locator, Page } from "@playwright/test";

export const captureStableScreenshot = async (page: Page) => {
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

export interface ScreenshotComparison {
    differingPixels: number;
    matches: boolean;
    maxChannelDelta: number;
}

export const compareScreenshots = async (
    page: Page,
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

export interface DarkContentRowsOptions {
    bottomInsetSelector?: string;
    topInsetSelector?: string;
}

export const countDarkContentRows = async (
    page: Page,
    element: Locator,
    options: DarkContentRowsOptions = {}
) => {
    const [screenshot, geometry] = await Promise.all([
        element.screenshot(),
        element.evaluate((node, selectors) => {
            const bounds = node.getBoundingClientRect();
            const topInset = selectors.topInsetSelector
                ? node
                      .querySelector(selectors.topInsetSelector)
                      ?.getBoundingClientRect().height
                : 0;
            const bottomInset = selectors.bottomInsetSelector
                ? node
                      .querySelector(selectors.bottomInsetSelector)
                      ?.getBoundingClientRect().height
                : 0;

            return {
                height: bounds.height,
                topInset: topInset ?? 0,
                bottomInset: bottomInset ?? 0
            };
        }, options)
    ]);

    return page.evaluate(
        async ({ image, height, topInset, bottomInset }) => {
            const response = await fetch(`data:image/png;base64,${image}`);
            const bitmap = await createImageBitmap(await response.blob());
            const canvas = document.createElement("canvas");
            canvas.width = bitmap.width;
            canvas.height = bitmap.height;
            const context = canvas.getContext("2d", {
                willReadFrequently: true
            });
            if (!context) throw new Error("Canvas 2D context is unavailable");
            context.drawImage(bitmap, 0, 0);
            const pixels = context.getImageData(
                0,
                0,
                bitmap.width,
                bitmap.height
            ).data;
            const scale = bitmap.height / height;
            const firstContentRow = Math.ceil(topInset * scale) + 1;
            const lastContentRow =
                bitmap.height - Math.ceil(bottomInset * scale) - 1;
            const contentWidth = Math.max(
                1,
                bitmap.width - Math.ceil(20 * scale)
            );
            let paintedRows = 0;

            for (let y = firstContentRow; y < lastContentRow; y++) {
                let darkPixels = 0;
                for (let x = 1; x < contentWidth; x++) {
                    const pixel = (y * bitmap.width + x) * 4;
                    if (
                        pixels[pixel] < 235 &&
                        pixels[pixel + 1] < 235 &&
                        pixels[pixel + 2] < 235
                    ) {
                        darkPixels++;
                    }
                }
                if (darkPixels >= 5) paintedRows++;
            }

            return paintedRows;
        },
        {
            image: screenshot.toString("base64"),
            ...geometry
        }
    );
};

export const getDarkHorizontalEdgeCoverage = async (
    page: Page,
    element: Locator
) => {
    const screenshot = await element.screenshot();

    return page.evaluate(async image => {
        const response = await fetch(`data:image/png;base64,${image}`);
        const bitmap = await createImageBitmap(await response.blob());
        const canvas = document.createElement("canvas");
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        const context = canvas.getContext("2d", { willReadFrequently: true });
        if (!context) throw new Error("Canvas 2D context is unavailable");
        context.drawImage(bitmap, 0, 0);
        const pixels = context.getImageData(
            0,
            0,
            bitmap.width,
            bitmap.height
        ).data;
        // Sample only fully covered device pixels. On fractional mobile DPRs
        // the outer antialiased row belongs only partly to the 2 CSS px outline.
        const edgeWidth = Math.max(
            1,
            Math.floor(globalThis.devicePixelRatio * 2)
        );
        const horizontalEnd = Math.max(1, bitmap.width - 20);
        let dark = 0;
        let sampled = 0;

        for (const edgeStart of [0, bitmap.height - edgeWidth]) {
            for (let y = edgeStart; y < edgeStart + edgeWidth; y++) {
                for (let x = 0; x < horizontalEnd; x++) {
                    const pixel = (y * bitmap.width + x) * 4;
                    if (
                        pixels[pixel] < 80 &&
                        pixels[pixel + 1] < 80 &&
                        pixels[pixel + 2] < 100
                    ) {
                        dark++;
                    }
                    sampled++;
                }
            }
        }

        return dark / sampled;
    }, screenshot.toString("base64"));
};
