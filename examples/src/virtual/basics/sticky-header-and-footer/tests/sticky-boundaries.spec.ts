import {
    describeExample,
    expect,
    getBoundaryGap,
    getVerticalScrollbarGeometry,
    getVirtualItemCount,
    openExample,
    requireNativeScrollbarPointer,
    test,
    withHeldPointer
} from "../../../../e2e";

await describeExample("virtual/basics/sticky-header-and-footer", example => {
    test.beforeEach(async ({ page }) => {
        await openExample(page, example.previewPath);
    });

    test("renders row 0 immediately below the sticky header", async ({
        page
    }) => {
        const items = page.getByRole("listitem");
        const firstItem = items.first();
        const header = page.getByTestId("sticky-header");
        await expect(header).toHaveCSS("position", "sticky");
        await expect(firstItem).toHaveText("row 0");
        await expect(firstItem).toHaveAttribute("aria-posinset", "1");
        await expect
            .poll(() => getBoundaryGap(firstItem, header, "top", "bottom"))
            .toBeLessThanOrEqual(1);
    });

    test("keeps the final row immediately above the sticky footer", async ({
        page
    }) => {
        requireNativeScrollbarPointer();
        const list = page.getByRole("list", {
            name: "Sticky header and footer list"
        });
        const items = page.getByRole("listitem");
        const footer = page.getByTestId("sticky-footer");
        await expect(footer).toHaveCSS("position", "sticky");
        await expect(items.first()).toBeVisible();
        const itemCount = await getVirtualItemCount(items);
        const scrollbar = await getVerticalScrollbarGeometry(list);

        await withHeldPointer(page, scrollbar.x, scrollbar.start, async () => {
            await page.mouse.move(scrollbar.x, scrollbar.bottom, { steps: 1 });
            await expect
                .poll(async () =>
                    Number(
                        await page
                            .getByRole("listitem")
                            .last()
                            .getAttribute("aria-posinset")
                    )
                )
                .toBe(itemCount);
            await expect
                .poll(() =>
                    getBoundaryGap(
                        page.getByRole("listitem").last(),
                        footer,
                        "bottom",
                        "top"
                    )
                )
                .toBeLessThanOrEqual(1);
        });
    });
});
