import {
    describeExample,
    expect,
    getVirtualItemCount,
    openExample,
    test
} from "../../../../e2e";

const PAGE_SIZE = 5;

await describeExample("virtual/data-changes/load-on-demand", example => {
    test("appends complete pages after reaching the end", async ({ page }) => {
        await openExample(page, example.previewPath);

        const list = page.getByRole("list", { name: "Load on demand list" });
        const items = page.getByRole("listitem");
        await expect(items.first()).toBeVisible();

        const initialItemCount = await getVirtualItemCount(items);

        await list.evaluate(element => {
            element.scrollTop = element.scrollHeight;
        });

        await expect
            .poll(() => getVirtualItemCount(items))
            .toBeGreaterThanOrEqual(initialItemCount + PAGE_SIZE);

        const loadedItemCount = await getVirtualItemCount(items);
        expect((loadedItemCount - initialItemCount) % PAGE_SIZE).toBe(0);
        const positions = await items.evaluateAll(elements =>
            elements.map(element =>
                Number(element.getAttribute("aria-posinset"))
            )
        );
        expect(positions).toEqual(
            Array.from(positions.keys(), index => positions[0] + index)
        );
        expect(positions.at(-1)).toBeLessThanOrEqual(loadedItemCount);
    });
});
