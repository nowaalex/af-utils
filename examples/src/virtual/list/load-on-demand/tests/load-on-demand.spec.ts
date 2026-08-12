import {
    describeExample,
    expect,
    type Locator,
    test,
    waitForExampleHydration
} from "../../../../e2e";

const PAGE_SIZE = 5;
const REPEAT_GUARD_MS = 300;

const getItemCount = (items: Locator) =>
    items.evaluateAll(elements =>
        Math.max(
            ...elements.map(element =>
                Number(element.getAttribute("aria-setsize"))
            )
        )
    );

await describeExample("virtual/list/load-on-demand", example => {
    test("loads one page after reaching the end", async ({ page }) => {
        await page.goto(example.previewPath);
        await waitForExampleHydration(page);

        const list = page.getByRole("list", { name: "Load on demand list" });
        const items = page.getByRole("listitem");
        await expect(items.first()).toBeVisible();

        const initialItemCount = await getItemCount(items);
        expect(initialItemCount).toBeGreaterThan(0);

        await list.evaluate(element => {
            element.scrollTop = element.scrollHeight;
        });

        const loadedItemCount = initialItemCount + PAGE_SIZE;
        await expect.poll(() => getItemCount(items)).toBe(loadedItemCount);

        // Remaining at the old end must not request the next page again.
        await page.waitForTimeout(REPEAT_GUARD_MS);
        expect(await getItemCount(items)).toBe(loadedItemCount);
    });
});
