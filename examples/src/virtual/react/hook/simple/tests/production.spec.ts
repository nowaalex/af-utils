import { expect, test } from "../../../../../e2e";

const PRODUCTION_URL = "http://127.0.0.1:4181";

test("runs the simple hook example from a production bundle", async ({
    page
}) => {
    const response = await page.goto(PRODUCTION_URL);
    expect(response?.ok()).toBe(true);

    const moduleSources = await page
        .locator('script[type="module"][src]')
        .evaluateAll(scripts =>
            scripts.map(script => script.getAttribute("src"))
        );
    expect(moduleSources).toHaveLength(1);
    expect(moduleSources[0]).toMatch(/^\/assets\/index-[\w-]+\.js$/);

    const list = page.getByRole("list", { name: "Simple hook list" });
    const items = page.getByRole("listitem");
    await expect(items.first()).toBeVisible();

    const itemCount = Number(await items.first().getAttribute("aria-setsize"));
    expect(itemCount).toBeGreaterThan(0);

    await list.evaluate(element => {
        element.scrollTop = element.scrollHeight;
    });

    await expect
        .poll(() =>
            list.evaluate(element => {
                const rendered = element.querySelectorAll('[role="listitem"]');
                const lastItem = rendered.item(rendered.length - 1);

                return {
                    endOffset:
                        element.scrollHeight -
                        element.clientHeight -
                        element.scrollTop,
                    lastPosition: Number(
                        lastItem?.getAttribute("aria-posinset")
                    )
                };
            })
        )
        .toEqual({ endOffset: 0, lastPosition: itemCount });
});
