import {
    describeExample,
    expect,
    expectDefined,
    getVerticalScrollbarX,
    requireNativeScrollbarPointer,
    test,
    waitForExampleHydration
} from "../../../../e2e";

await describeExample("virtual/list/variable-size-list", example => {
    test("fully renders the final item without resizing a held scrollbar", async ({
        browserName,
        page
    }) => {
        requireNativeScrollbarPointer(browserName);
        await page.goto(example.previewPath);
        await waitForExampleHydration(page);

        const list = page.getByRole("list");
        const items = page.getByRole("listitem");
        await expect(items.first()).toBeVisible();

        const itemCount = Number(
            await items.first().getAttribute("aria-setsize")
        );
        expect(itemCount).toBeGreaterThan(0);

        const bounds = expectDefined(
            await list.boundingBox(),
            "Expected the list viewport to be visible"
        );

        const scrollbarX = await getVerticalScrollbarX(list);
        await page.mouse.move(scrollbarX, bounds.y + 24);
        await page.mouse.down();
        try {
            const heldScrollHeight = await list.evaluate(
                element => element.scrollHeight
            );
            await page.mouse.move(scrollbarX, bounds.y + bounds.height - 4, {
                steps: 1
            });

            await expect
                .poll(() =>
                    list.evaluate(element => {
                        const viewport = element.getBoundingClientRect();
                        let lastVisiblePosition = 0;

                        for (const item of element.querySelectorAll<HTMLElement>(
                            '[role="listitem"]'
                        )) {
                            const itemBounds = item.getBoundingClientRect();
                            let visibleTop = Math.max(
                                itemBounds.top,
                                viewport.top
                            );
                            let visibleBottom = Math.min(
                                itemBounds.bottom,
                                viewport.bottom
                            );

                            for (
                                let ancestor = item.parentElement;
                                ancestor && ancestor !== element;
                                ancestor = ancestor.parentElement
                            ) {
                                const { overflowY } =
                                    getComputedStyle(ancestor);
                                if (
                                    overflowY === "hidden" ||
                                    overflowY === "clip" ||
                                    overflowY === "auto" ||
                                    overflowY === "scroll"
                                ) {
                                    const clippingBounds =
                                        ancestor.getBoundingClientRect();
                                    visibleTop = Math.max(
                                        visibleTop,
                                        clippingBounds.top
                                    );
                                    visibleBottom = Math.min(
                                        visibleBottom,
                                        clippingBounds.bottom
                                    );
                                }
                            }

                            if (
                                visibleTop <= itemBounds.top + 0.5 &&
                                visibleBottom >= itemBounds.bottom - 0.5
                            ) {
                                lastVisiblePosition = Number(
                                    item.getAttribute("aria-posinset")
                                );
                            }
                        }

                        return lastVisiblePosition;
                    })
                )
                .toBe(itemCount);
            expect(await list.evaluate(element => element.scrollHeight)).toBe(
                heldScrollHeight
            );
        } finally {
            await page.mouse.up();
        }
    });
});
