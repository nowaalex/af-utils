import {
    describeExample,
    expect,
    expectDefined,
    getVerticalScrollbarX,
    requireNativeScrollbarPointer,
    test,
    waitForExampleHydration
} from "../../../../e2e";

await describeExample("virtual/primitives/simple", example => {
    test("fills the viewport and preserves the final item across scrollbar release", async ({
        browserName,
        page
    }) => {
        requireNativeScrollbarPointer(browserName);
        await page.goto(example.previewPath);
        await waitForExampleHydration(page);

        const list = page.getByRole("list", { name: "Simple primitives list" });
        const items = page.getByRole("listitem");
        await expect(items.first()).toBeVisible();
        const itemCount = Number(
            await items.first().getAttribute("aria-setsize")
        );
        expect(itemCount).toBeGreaterThan(0);

        const viewport = expectDefined(
            await list.boundingBox(),
            "Expected the list viewport to be visible"
        );
        const scrollbarX = await getVerticalScrollbarX(list);

        const getEndState = () =>
            list.evaluate(element => {
                const itemsElement =
                    element.firstElementChild?.firstElementChild;
                const firstItem = itemsElement?.firstElementChild;
                const lastItem = itemsElement?.lastElementChild;
                if (!itemsElement || !firstItem || !lastItem) {
                    throw new Error("Expected rendered list items");
                }
                const listBounds = element.getBoundingClientRect();
                const firstBounds = firstItem.getBoundingClientRect();
                const lastBounds = lastItem.getBoundingClientRect();

                return {
                    firstGap: Math.max(0, firstBounds.top - listBounds.top),
                    lastGap: Math.max(0, listBounds.bottom - lastBounds.bottom),
                    lastPosition: Number(lastItem.getAttribute("aria-posinset"))
                };
            });

        await page.mouse.move(scrollbarX, viewport.y + 24);
        await page.mouse.down();
        try {
            await page.mouse.move(
                scrollbarX,
                viewport.y + viewport.height - 2,
                {
                    steps: 1
                }
            );

            await expect.poll(getEndState).toEqual({
                firstGap: 0,
                lastGap: 0,
                lastPosition: itemCount
            });
        } finally {
            await page.mouse.up();
        }

        await expect.poll(getEndState).toEqual({
            firstGap: 0,
            lastGap: 0,
            lastPosition: itemCount
        });
    });
});
