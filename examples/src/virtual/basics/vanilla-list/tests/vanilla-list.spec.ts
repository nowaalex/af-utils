import { describeExample, expect, openExample, test } from "../../../../e2e";

await describeExample("virtual/basics/vanilla-list", example => {
    test("uses the core DOM API to render and scroll the range", async ({
        page
    }) => {
        await openExample(page, example.previewPath);

        const list = page.getByRole("list", { name: "Core virtual list" });
        const items = page.getByRole("listitem");
        await expect(items.first()).toBeVisible();
        expect(await items.count()).toBeLessThan(100);

        await page.getByLabel("Item").fill("1000");
        await page.getByRole("button", { name: "Scroll to item" }).click();
        await expect(page.getByRole("status")).toContainText(
            "resolves to item 1000"
        );
        await expect
            .poll(() =>
                items.first().getAttribute("aria-posinset").then(Number)
            )
            .toBeGreaterThan(900);

        await page.getByRole("button", { name: "Reset measurements" }).click();
        await expect(page.getByRole("status")).toHaveText("Measurements reset");
        await expect(list).toBeVisible();
    });
});
