import { expect, test } from "../../../../../e2e";

test("keeps the final item visible after scrolling to the end", async ({
    page
}) => {
    await page.goto("http://127.0.0.1:4175");

    const list = page.getByRole("list", { name: "Extra events list" });
    const items = page.getByRole("listitem");
    await expect(items.first()).toBeVisible();

    const itemCount = Number(await items.first().getAttribute("aria-setsize"));
    expect(itemCount).toBeGreaterThan(0);

    const viewport = await list.boundingBox();
    expect(viewport).not.toBeNull();

    const scrollbarX = viewport!.x + viewport!.width - 2;
    await page.mouse.move(scrollbarX, viewport!.y + 24);
    await page.mouse.down();

    try {
        await page.mouse.move(scrollbarX, viewport!.y + viewport!.height - 2, {
            steps: 1
        });

        await expect
            .poll(async () => {
                const lastItem = page.getByRole("listitem").last();
                if ((await lastItem.count()) === 0) return 0;

                return lastItem.evaluate(element => {
                    const scroller =
                        element.closest<HTMLElement>('[role="list"]')!;
                    const bounds = element.getBoundingClientRect();
                    const listBounds = scroller.getBoundingClientRect();
                    const footerBounds =
                        scroller.lastElementChild!.getBoundingClientRect();
                    let visibleTop = Math.max(bounds.top, listBounds.top);
                    let visibleBottom = Math.min(
                        bounds.bottom,
                        listBounds.bottom,
                        footerBounds.top
                    );

                    for (
                        let ancestor = element.parentElement;
                        ancestor && ancestor !== scroller;
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

                    const fullyVisible =
                        visibleTop <= bounds.top + 0.5 &&
                        visibleBottom >= bounds.bottom - 0.5;

                    return fullyVisible
                        ? Number(element.getAttribute("aria-posinset"))
                        : 0;
                });
            })
            .toBe(itemCount);

        await expect
            .poll(async () => {
                const lastItem = page.getByRole("listitem").last();
                return lastItem.evaluate(element => {
                    const scroller =
                        element.closest<HTMLElement>('[role="list"]')!;
                    const itemBottom = element.getBoundingClientRect().bottom;
                    const footerTop =
                        scroller.lastElementChild!.getBoundingClientRect().top;

                    return Math.abs(footerTop - itemBottom);
                });
            })
            .toBeLessThanOrEqual(1);
    } finally {
        await page.mouse.up();
    }
});
