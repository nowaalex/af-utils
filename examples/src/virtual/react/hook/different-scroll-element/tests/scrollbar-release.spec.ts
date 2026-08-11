import { expect, test } from "../../../../../e2e";

const EXAMPLE_URL = "http://127.0.0.1:4180";

const getEndState = (element: HTMLElement) => {
    const sizeElement = element.children[1]?.children[1]?.firstElementChild;
    const itemsElement = sizeElement?.firstElementChild;
    const lastItem = itemsElement?.lastElementChild;
    const viewport = element.getBoundingClientRect();
    const lastBounds = lastItem?.getBoundingClientRect();

    return {
        fullyVisible:
            lastBounds !== undefined &&
            lastBounds.top >= viewport.top - 1 &&
            lastBounds.bottom <= viewport.bottom + 1,
        lastIndex: Number(lastItem?.textContent?.replace("row ", ""))
    };
};

test("keeps the final item visible after a fast scrollbar release", async ({
    page
}) => {
    await page.goto(EXAMPLE_URL);

    const list = page.locator("#root > div");
    await expect(page.getByText("row 0", { exact: true })).toBeVisible();
    const viewport = await list.boundingBox();
    expect(viewport).not.toBeNull();
    const scrollbarX = viewport!.x + viewport!.width - 2;

    await page.mouse.move(scrollbarX, viewport!.y + 24);
    await page.mouse.down();
    try {
        await page.mouse.move(scrollbarX, viewport!.y + viewport!.height - 2, {
            steps: 1
        });
        await page.mouse.up();

        const state = await list.evaluate(getEndState);
        expect(state.lastIndex).toBe(4_999);
        expect(state.fullyVisible).toBe(true);

        // Let post-release ResizeObserver deliveries and the debounced offset
        // window settle; native scroll anchoring must not move the list away.
        await page.waitForTimeout(300);
        expect(await list.evaluate(getEndState)).toEqual({
            fullyVisible: true,
            lastIndex: 4_999
        });
    } finally {
        await page.mouse.up();
    }
});
