import { expect, test, type Locator, type Page } from "../../../../../e2e";

const EXAMPLE_URL = "http://127.0.0.1:4176";

const getItemCount = async (items: Locator) => {
    const itemCount = Number(await items.first().getAttribute("aria-setsize"));
    expect(itemCount).toBeGreaterThan(0);
    return itemCount;
};

const getBoundaryGap = (
    item: Locator,
    boundary: Locator,
    itemEdge: "top" | "bottom",
    boundaryEdge: "top" | "bottom"
) => {
    const edge = (
        bounds: { y: number; height: number },
        name: "top" | "bottom"
    ) => bounds.y + (name === "bottom" ? bounds.height : 0);

    return Promise.all([item.boundingBox(), boundary.boundingBox()]).then(
        ([itemBounds, boundaryBounds]) =>
            itemBounds && boundaryBounds
                ? Math.abs(
                      edge(itemBounds, itemEdge) -
                          edge(boundaryBounds, boundaryEdge)
                  )
                : Number.POSITIVE_INFINITY
    );
};

const dragScrollbarToEnd = async (page: Page, list: Locator) => {
    const viewport = await list.boundingBox();
    expect(viewport).not.toBeNull();

    const scrollbarX = viewport!.x + viewport!.width - 2;
    await page.mouse.move(scrollbarX, viewport!.y + 24);
    await page.mouse.down();
    await page.mouse.move(scrollbarX, viewport!.y + viewport!.height - 2, {
        steps: 1
    });
};

test.beforeEach(async ({ page }) => {
    await page.goto(EXAMPLE_URL);
});

test("renders row 0 immediately below the sticky header", async ({ page }) => {
    const items = page.getByRole("listitem");
    const firstItem = items.first();
    const header = page.getByTestId("sticky-header");
    await expect(header).toHaveCSS("position", "sticky");
    await expect(firstItem).toHaveText("row 0");
    await expect(firstItem).toHaveAttribute("aria-posinset", "1");
    await expect
        .poll(() => getBoundaryGap(firstItem, header, "top", "bottom"))
        .toBeLessThanOrEqual(1);
});

test("keeps the final row immediately above the sticky footer", async ({
    page
}) => {
    const list = page.getByRole("list", {
        name: "Sticky header and footer list"
    });
    const items = page.getByRole("listitem");
    const footer = page.getByTestId("sticky-footer");
    await expect(footer).toHaveCSS("position", "sticky");
    await expect(items.first()).toBeVisible();
    const itemCount = await getItemCount(items);

    await dragScrollbarToEnd(page, list);
    try {
        await expect
            .poll(async () =>
                Number(
                    await page
                        .getByRole("listitem")
                        .last()
                        .getAttribute("aria-posinset")
                )
            )
            .toBe(itemCount);
        await expect
            .poll(() =>
                getBoundaryGap(
                    page.getByRole("listitem").last(),
                    footer,
                    "bottom",
                    "top"
                )
            )
            .toBeLessThanOrEqual(1);
    } finally {
        await page.mouse.up();
    }
});
