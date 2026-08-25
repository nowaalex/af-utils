import { AxeBuilder } from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const documentationRoutes = ["/", "/virtual", "/scrollend-polyfill"];

for (const route of documentationRoutes) {
    test(`${route} has no automatically detectable accessibility violations`, async ({
        page
    }) => {
        await page.goto(route);

        const results = await new AxeBuilder({ page }).analyze();

        expect(results.violations).toEqual([]);
    });
}

test("documentation search returns navigable results", async ({ page }) => {
    await page.goto("/virtual");

    const search = page.getByRole("combobox", {
        name: "Search documentation"
    });
    await search.fill("VirtualScroller");

    const firstResult = page.locator(".pf-searchbox-result").first();
    await expect(firstResult).toBeVisible();
    await expect(firstResult).toHaveAttribute("href", /virtual/u);
});
