import {
    describeExample,
    countDarkContentRows,
    expect,
    getVerticalScrollbarGeometry,
    getVirtualListState,
    type Locator,
    movePointerVertically,
    requireNativeScrollbarPointer,
    test,
    withHeldPointer
} from "../../../../e2e";

const getEndState = async (list: Locator) => {
    const state = await getVirtualListState(list, {
        headerSelector: ":scope > :first-child"
    });
    return {
        firstGap: state.firstGap,
        lastGap: state.lastGap,
        lastPosition: state.lastPosition,
        itemCount: state.itemCount
    };
};

await describeExample("virtual/data-changes/prepend-items", example => {
    test("hydrates before exposing the documentation preview scrollbar", async ({
        page
    }) => {
        requireNativeScrollbarPointer();
        await page.goto(example.documentationPath);

        const preview = page.frameLocator("iframe").first();
        const list = preview.getByRole("list", { name: "Prepend items list" });
        const items = preview.getByRole("listitem");
        await expect(items.first()).toBeVisible();
        await expect(list).toHaveCSS("overflow", "auto");

        const itemCount = Number(
            await items.first().getAttribute("aria-setsize")
        );
        expect(itemCount).toBe(10_000);

        const scrollbar = await getVerticalScrollbarGeometry(list);

        await withHeldPointer(page, scrollbar.x, scrollbar.start, async () => {
            await movePointerVertically(
                page,
                scrollbar.x,
                scrollbar.start,
                scrollbar.bottom,
                60
            );
            await page.waitForTimeout(510);
        });

        const expectedEndState = {
            firstGap: 0,
            lastGap: 0,
            lastPosition: itemCount,
            itemCount
        };
        expect(await getEndState(list)).toEqual(expectedEndState);
        await expect.poll(() => getEndState(list)).toEqual(expectedEndState);

        // The old DOM-only assertion passed while Chromium displayed a white
        // composited layer. Inspect actual screenshot pixels after the delayed
        // frame that used to lose the item layer.
        await page.waitForTimeout(170);
        expect(
            await countDarkContentRows(page, list, {
                topInsetSelector: ":scope > :first-child"
            })
        ).toBeGreaterThan(20);
    });
});
