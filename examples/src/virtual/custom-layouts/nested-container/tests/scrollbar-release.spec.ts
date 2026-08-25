import {
    describeExample,
    expect,
    getVerticalScrollbarGeometry,
    openExample,
    requireNativeScrollbarPointer,
    test,
    withHeldPointer
} from "../../../../e2e";

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

await describeExample("virtual/custom-layouts/nested-container", example => {
    test("keeps the final item visible after a fast scrollbar release", async ({
        page
    }) => {
        requireNativeScrollbarPointer();
        await openExample(page, example.previewPath);

        const list = page.getByRole("list");
        await expect(page.getByText("row 0", { exact: true })).toBeVisible();
        const scrollbar = await getVerticalScrollbarGeometry(list);

        await withHeldPointer(page, scrollbar.x, scrollbar.start, async () => {
            await page.mouse.move(scrollbar.x, scrollbar.bottom - 2, {
                steps: 1
            });
        });

        await expect
            .poll(() => list.evaluate(getEndState))
            .toEqual({ fullyVisible: true, lastIndex: 4_999 });

        // Let post-release ResizeObserver deliveries and the debounced offset
        // window settle; native scroll anchoring must not move the list away.
        await page.waitForTimeout(300);
        expect(await list.evaluate(getEndState)).toEqual({
            fullyVisible: true,
            lastIndex: 4_999
        });
    });
});
