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

await describeExample("virtual/basics/variable-size", example => {
    test("remeasures a row whose content changes at runtime", async ({
        page
    }) => {
        await openExample(page, example.previewPath);

        const firstItem = page.getByRole("listitem").first();
        const toggle = page.getByRole("button", { name: "Toggle first row" });
        await expect(firstItem).toBeVisible();
        const collapsedHeight = await firstItem.evaluate(
            element => element.getBoundingClientRect().height
        );

        await toggle.click();
        await expect(toggle).toHaveAttribute("aria-expanded", "true");
        await expect
            .poll(() =>
                firstItem.evaluate(
                    element => element.getBoundingClientRect().height
                )
            )
            .toBeGreaterThan(collapsedHeight + 70);

        await toggle.click();
        await expect(toggle).toHaveAttribute("aria-expanded", "false");
        await expect
            .poll(() =>
                firstItem.evaluate(
                    element => element.getBoundingClientRect().height
                )
            )
            .toBeLessThan(collapsedHeight + 2);
    });

    test("measures different row sizes while keeping the DOM virtualized", async ({
        page
    }) => {
        await openExample(page, example.previewPath);

        const list = page.getByRole("list");
        const items = page.getByRole("listitem");
        await expect(items.first()).toBeVisible();
        await getVirtualItemCount(items);
        expect(await items.count()).toBeLessThan(100);

        const getRenderedSizes = () =>
            items.evaluateAll(elements => [
                ...new Set(
                    elements.map(
                        element => element.getBoundingClientRect().height
                    )
                )
            ]);
        expect((await getRenderedSizes()).length).toBeGreaterThan(1);

        await list.evaluate(element => {
            element.scrollTop = 1_000_000;
        });
        await expect
            .poll(() =>
                items.first().getAttribute("aria-posinset").then(Number)
            )
            .toBeGreaterThan(1_000);
        expect((await getRenderedSizes()).length).toBeGreaterThan(1);
        expect(await items.count()).toBeLessThan(100);
    });

    test("fully renders the final item without resizing a held scrollbar", async ({
        page
    }) => {
        requireNativeScrollbarPointer();
        await openExample(page, example.previewPath);

        const list = page.getByRole("list");
        const items = page.getByRole("listitem");
        await expect(items.first()).toBeVisible();
        const itemCount = await getVirtualItemCount(items);
        const scrollbar = await getVerticalScrollbarGeometry(list);

        await withHeldPointer(page, scrollbar.x, scrollbar.start, async () => {
            const heldScrollHeight = await list.evaluate(
                element => element.scrollHeight
            );
            await page.mouse.move(scrollbar.x, scrollbar.bottom - 2, {
                steps: 1
            });

            await expect
                .poll(async () => {
                    const state = await getVirtualListState(list);
                    return state.lastFullyVisible ? state.lastPosition : 0;
                })
                .toBe(itemCount);
            expect(await list.evaluate(element => element.scrollHeight)).toBe(
                heldScrollHeight
            );
        });
    });
});
