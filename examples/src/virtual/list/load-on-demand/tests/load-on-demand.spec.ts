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
    test("loads one page after reaching the end", async ({
        page
    }, testInfo) => {
        await page.goto(example.previewPath);
        await waitForExampleHydration(page);

        const list = page.getByRole("list", { name: "Load on demand list" });
        const items = page.getByRole("listitem");
        await expect(items.first()).toBeVisible();

        if (testInfo.project.name.startsWith("mobile-")) {
            let previousScrollHeight = -1;
            let stableGeometrySamples = 0;
            await expect
                .poll(
                    async () => {
                        const scrollHeight = await list.evaluate(
                            element => element.scrollHeight
                        );
                        stableGeometrySamples =
                            scrollHeight === previousScrollHeight
                                ? stableGeometrySamples + 1
                                : 0;
                        previousScrollHeight = scrollHeight;
                        return stableGeometrySamples;
                    },
                    { intervals: [50, 100, 150] }
                )
                .toBeGreaterThanOrEqual(2);
        }

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
