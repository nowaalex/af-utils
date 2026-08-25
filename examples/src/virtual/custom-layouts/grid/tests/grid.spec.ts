import { describeExample, expect, openExample, test } from "../../../../e2e";

await describeExample("virtual/custom-layouts/grid", example => {
    test("virtualizes both axes while scrolling", async ({ page }) => {
        await openExample(page, example.previewPath);

        const grid = page.getByTestId("virtual-grid");
        const cells = grid.locator("[data-row-index][data-column-index]");
        await expect(cells.first()).toBeVisible();
        expect(await cells.count()).toBeLessThan(200);

        await grid.evaluate(element => {
            element.scrollTo({ left: 75_000, top: 75_000 });
        });
        await expect
            .poll(() =>
                cells.evaluateAll(elements => ({
                    column:
                        Math.max(
                            ...elements.map(element =>
                                Number(
                                    element.getAttribute("data-column-index")
                                )
                            )
                        ) > 100,
                    row:
                        Math.max(
                            ...elements.map(element =>
                                Number(element.getAttribute("data-row-index"))
                            )
                        ) > 100
                }))
            )
            .toEqual({ column: true, row: true });
        expect(await cells.count()).toBeLessThan(200);
    });
});
