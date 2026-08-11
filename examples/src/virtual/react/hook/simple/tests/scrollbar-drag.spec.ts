import { expect, test } from "@playwright/test";

test("fills the viewport and preserves the final item across scrollbar release", async ({
    page
}) => {
    await page.goto("http://127.0.0.1:4177");

    const list = page.getByRole("list", { name: "Simple hook list" });
    const items = page.getByRole("listitem");
    await expect(items.first()).toBeVisible();
    const itemCount = Number(await items.first().getAttribute("aria-setsize"));
    expect(itemCount).toBeGreaterThan(0);

    const viewport = await list.boundingBox();
    expect(viewport).not.toBeNull();
    const scrollbarX = viewport!.x + viewport!.width - 2;

    const getEndState = () =>
        list.evaluate(element => {
            const itemsElement = element.firstElementChild!.firstElementChild!;
            const firstItem = itemsElement.firstElementChild!;
            const lastItem = itemsElement.lastElementChild!;
            const listBounds = element.getBoundingClientRect();
            const firstBounds = firstItem.getBoundingClientRect();
            const lastBounds = lastItem.getBoundingClientRect();

            return {
                firstGap: Math.max(0, firstBounds.top - listBounds.top),
                lastGap: Math.max(0, listBounds.bottom - lastBounds.bottom),
                lastPosition: Number(lastItem.getAttribute("aria-posinset"))
            };
        });

    await page.mouse.move(scrollbarX, viewport!.y + 24);
    await page.mouse.down();
    try {
        await page.mouse.move(scrollbarX, viewport!.y + viewport!.height - 2, {
            steps: 1
        });

        await expect.poll(getEndState).toEqual({
            firstGap: 0,
            lastGap: 0,
            lastPosition: itemCount
        });
    } finally {
        await page.mouse.up();
    }

    expect(await getEndState()).toEqual({
        firstGap: 0,
        lastGap: 0,
        lastPosition: itemCount
    });
    await expect.poll(getEndState).toEqual({
        firstGap: 0,
        lastGap: 0,
        lastPosition: itemCount
    });
});
