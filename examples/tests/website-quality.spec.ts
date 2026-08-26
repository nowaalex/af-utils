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

test("documentation SSR keeps Pagefind announcements out of document flow", async ({
    page
}) => {
    await page.goto("/virtual");

    await expect(page.locator("[data-pagefind-announcer]")).toHaveCount(1);
    await expect
        .poll(() =>
            page.evaluate(() => {
                const scrollRoot = document.scrollingElement;
                if (!scrollRoot) {
                    throw new Error("Expected a document scrolling element");
                }
                return scrollRoot.scrollHeight === scrollRoot.clientHeight;
            })
        )
        .toBe(true);

    const documentationScroll = page.locator(".documentation-scroll");
    const initialScrollTop = await documentationScroll.evaluate(
        element => element.scrollTop
    );
    await documentationScroll.hover();
    await page.mouse.wheel(0, 100);
    await expect
        .poll(() => documentationScroll.evaluate(element => element.scrollTop))
        .toBeGreaterThan(initialScrollTop);
    await expect
        .poll(() =>
            page.evaluate(() => {
                const scrollRoot = document.scrollingElement;
                if (!scrollRoot) {
                    throw new Error("Expected a document scrolling element");
                }
                return scrollRoot.scrollHeight === scrollRoot.clientHeight;
            })
        )
        .toBe(true);
});
