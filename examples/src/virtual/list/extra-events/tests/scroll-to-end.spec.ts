import {
    describeExample,
    expect,
    getVirtualItemCount,
    getVirtualListState,
    type Locator,
    openExample,
    test
} from "../../../../e2e";

const RANGE_PATTERN = /Range:\s*(\d+)\s*-\s*(\d+)/u;
const SCROLL_SIZE_PATTERN = /Scroll size:\s*([\d.]+)\s*px/u;
const getPublishedScrollSize = async (view: Locator) =>
    Number((await view.textContent())?.match(SCROLL_SIZE_PATTERN)?.[1]);

await describeExample("virtual/list/extra-events", example => {
    test("publishes the selected range and scroll-size snapshots", async ({
        page
    }) => {
        await openExample(page, example.previewPath);

        const list = page.getByRole("list", { name: "Extra events list" });
        const items = page.getByRole("listitem");
        const rangeView = list.locator(":scope > :first-child");
        const scrollSizeView = list.locator(":scope > :last-child");
        await expect(items.first()).toBeVisible();
        await expect(rangeView).toContainText(RANGE_PATTERN);
        await expect(scrollSizeView).toContainText(SCROLL_SIZE_PATTERN);

        const initialRange = await rangeView.textContent();
        const initialScrollSize = await getPublishedScrollSize(scrollSizeView);
        expect(initialScrollSize).toBeGreaterThan(0);

        await list.evaluate(element => {
            element.scrollTop = 1_000_000;
        });

        await expect(rangeView).not.toHaveText(initialRange ?? "");
        const range = (await rangeView.textContent())?.match(RANGE_PATTERN);
        if (!range) throw new Error("Expected the rendered range snapshot");
        const [, from, to] = range.map(Number);
        const state = await getVirtualListState(list, {
            headerSelector: ":scope > :first-child",
            footerSelector: ":scope > :last-child"
        });

        expect(state.firstPosition).toBe(from + 1);
        expect(state.lastPosition).toBe(to);
        expect(Number(from)).toBeGreaterThan(1_000);
        await expect
            .poll(() => getPublishedScrollSize(scrollSizeView))
            .not.toBe(initialScrollSize);
        expect(await getPublishedScrollSize(scrollSizeView)).toBeGreaterThan(0);
    });

    test("keeps the final item immediately above the footer", async ({
        page
    }) => {
        await openExample(page, example.previewPath);

        const list = page.getByRole("list", { name: "Extra events list" });
        const items = page.getByRole("listitem");
        await expect(items.first()).toBeVisible();
        const itemCount = await getVirtualItemCount(items);

        await list.evaluate(element => {
            element.scrollTop = element.scrollHeight;
        });

        await expect
            .poll(() =>
                getVirtualListState(list, {
                    headerSelector: ":scope > :first-child",
                    footerSelector: ":scope > :last-child"
                }).then(state => state.lastPosition)
            )
            .toBe(itemCount);
        const state = await getVirtualListState(list, {
            headerSelector: ":scope > :first-child",
            footerSelector: ":scope > :last-child"
        });
        expect(state.lastGap).toBeLessThanOrEqual(0.5);
    });
});
