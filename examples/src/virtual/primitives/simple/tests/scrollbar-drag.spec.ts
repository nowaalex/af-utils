import {
    describeExample,
    expect,
    getVerticalScrollbarGeometry,
    getVirtualItemCount,
    getVirtualListState,
    openExample,
    requireNativeScrollbarPointer,
    test,
    withHeldPointer
} from "../../../../e2e";

await describeExample("virtual/primitives/simple", example => {
    test("fills the viewport and preserves the final item across scrollbar release", async ({
        page
    }) => {
        requireNativeScrollbarPointer();
        await openExample(page, example.previewPath);

        const list = page.getByRole("list", { name: "Simple primitives list" });
        const items = page.getByRole("listitem");
        await expect(items.first()).toBeVisible();
        const itemCount = await getVirtualItemCount(items);
        const scrollbar = await getVerticalScrollbarGeometry(list);
        const getEndState = async () => {
            const state = await getVirtualListState(list);
            return {
                firstGap: state.firstGap,
                lastGap: state.lastGap,
                lastPosition: state.lastPosition
            };
        };
        const expectedState = {
            firstGap: 0,
            lastGap: 0,
            lastPosition: itemCount
        };

        await withHeldPointer(page, scrollbar.x, scrollbar.start, async () => {
            await page.mouse.move(scrollbar.x, scrollbar.bottom, { steps: 1 });
            await expect.poll(getEndState).toEqual(expectedState);
        });

        await expect.poll(getEndState).toEqual(expectedState);
    });
});
