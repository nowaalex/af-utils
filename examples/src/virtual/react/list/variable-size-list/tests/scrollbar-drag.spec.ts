import { expect, test } from "../../../../../e2e";

test("fully renders the final item without resizing a held scrollbar", async ({
    page
}) => {
    await page.goto("http://127.0.0.1:4173");

    const list = page.getByRole("list");
    const items = page.getByRole("listitem");
    await expect(items.first()).toBeVisible();

    const itemCount = Number(await items.first().getAttribute("aria-setsize"));
    expect(itemCount).toBeGreaterThan(0);

    const bounds = await list.boundingBox();
    expect(bounds).not.toBeNull();

    const scrollbarX = bounds!.x + bounds!.width - 2;
    await page.mouse.move(scrollbarX, bounds!.y + 24);
    await page.mouse.down();
    try {
        const heldScrollHeight = await list.evaluate(
            element => element.scrollHeight
        );
        await page.mouse.move(scrollbarX, bounds!.y + bounds!.height - 2, {
            steps: 1
        });

        await expect
            .poll(async () =>
                list.evaluate(element => {
                    const viewport = element.getBoundingClientRect();
                    let lastVisiblePosition = 0;

                    for (const item of element.querySelectorAll<HTMLElement>(
                        '[role="listitem"]'
                    )) {
                        const bounds = item.getBoundingClientRect();
                        let visibleTop = Math.max(bounds.top, viewport.top);
                        let visibleBottom = Math.min(
                            bounds.bottom,
                            viewport.bottom
                        );

                        for (
                            let ancestor = item.parentElement;
                            ancestor && ancestor !== element;
                            ancestor = ancestor.parentElement
                        ) {
                            const { overflowY } = getComputedStyle(ancestor);
                            if (
                                overflowY === "hidden" ||
                                overflowY === "clip" ||
                                overflowY === "auto" ||
                                overflowY === "scroll"
                            ) {
                                const clippingBounds =
                                    ancestor.getBoundingClientRect();
                                visibleTop = Math.max(
                                    visibleTop,
                                    clippingBounds.top
                                );
                                visibleBottom = Math.min(
                                    visibleBottom,
                                    clippingBounds.bottom
                                );
                            }
                        }

                        if (
                            visibleTop <= bounds.top + 0.5 &&
                            visibleBottom >= bounds.bottom - 0.5
                        ) {
                            lastVisiblePosition = Number(
                                item.getAttribute("aria-posinset")
                            );
                        }
                    }

                    return lastVisiblePosition;
                })
            )
            .toBe(itemCount);
        expect(await list.evaluate(element => element.scrollHeight)).toBe(
            heldScrollHeight
        );
    } finally {
        await page.mouse.up();
    }
});
