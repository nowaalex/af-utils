import { describeExample, expect, openExample, test } from "../../../../e2e";

await describeExample("virtual/scrolling/scroll-restoration", example => {
    test("restores the fractional position after the list remounts", async ({
        page
    }) => {
        await openExample(page, example.previewPath);
        const list = page.getByRole("list", {
            name: "Restorable virtual list"
        });
        const items = page.getByRole("listitem");
        await list.evaluate(element => {
            element.scrollTop = 240_017;
        });
        await expect
            .poll(() =>
                items.first().getAttribute("aria-posinset").then(Number)
            )
            .toBeGreaterThan(4_000);
        const beforePosition = Number(
            await items.first().getAttribute("aria-posinset")
        );

        await page.getByRole("button", { name: "Open details" }).click();
        await expect(page.getByText(/List is unmounted/u)).toBeVisible();
        await page.getByRole("button", { name: "Back to list" }).click();

        await expect(page.getByRole("status")).toContainText(
            `Restored item ${beforePosition - 1}`
        );
        await expect
            .poll(() =>
                page
                    .getByRole("listitem")
                    .first()
                    .getAttribute("aria-posinset")
                    .then(Number)
            )
            .toBe(beforePosition);
    });
});
