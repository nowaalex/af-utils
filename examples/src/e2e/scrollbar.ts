import type { Locator, Page } from "@playwright/test";
import { expectDefined } from "./values";
import { test } from "./fixture";

export interface VerticalScrollbarGeometry {
    bottom: number;
    start: number;
    top: number;
    x: number;
}

export const getVerticalScrollbarX = async (element: Locator) => {
    const [bounds, metrics] = await Promise.all([
        element.boundingBox(),
        element.evaluate(node => {
            const style = getComputedStyle(node);
            const borderLeft = Number.parseFloat(style.borderLeftWidth) || 0;
            const borderRight = Number.parseFloat(style.borderRightWidth) || 0;
            const scrollbarWidth =
                node.offsetWidth - node.clientWidth - borderLeft - borderRight;

            if (scrollbarWidth <= 0) {
                throw new Error("Expected a visible vertical scrollbar");
            }

            return { borderRight, scrollbarWidth };
        })
    ]);
    const pageBounds = expectDefined(
        bounds,
        "Expected the scroll viewport to be visible"
    );

    return (
        pageBounds.x +
        pageBounds.width -
        metrics.borderRight -
        metrics.scrollbarWidth / 2
    );
};

export const getVerticalScrollbarGeometry = async (element: Locator) => {
    const bounds = expectDefined(
        await element.boundingBox(),
        "Expected the scroll viewport to be visible"
    );

    return {
        bottom: bounds.y + bounds.height - 2,
        start: bounds.y + 24,
        top: bounds.y,
        x: await getVerticalScrollbarX(element)
    } satisfies VerticalScrollbarGeometry;
};

export const withHeldPointer = async <Result>(
    page: Page,
    x: number,
    y: number,
    run: () => Promise<Result>
) => {
    await page.mouse.move(x, y);
    await page.mouse.down();
    try {
        return await run();
    } finally {
        await page.mouse.up();
    }
};

export const movePointerVertically = async (
    page: Page,
    x: number,
    from: number,
    to: number,
    steps: number,
    frameDelay = 0
) => {
    // oxlint-disable eslint/no-await-in-loop -- Pointer positions model one ordered physical interaction.
    for (let step = 1; step <= steps; step++) {
        await page.mouse.move(x, from + ((to - from) * step) / steps);
        if (frameDelay > 0) await page.waitForTimeout(frameDelay);
    }
    // oxlint-enable eslint/no-await-in-loop
};

export const requireNativeScrollbarPointer = () => {
    test.skip(
        test.info().project.name !== "chromium",
        "Playwright exposes pointer-draggable classic scrollbars only in desktop Chromium"
    );
};
