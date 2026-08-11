import { expect, type Locator, type Page, test } from "../../../../../e2e";

const WEBSITE_EXAMPLE_URL =
    "http://127.0.0.1:4179/virtual/examples/react/list/prepend-items";

const getEndState = (list: Locator) =>
    list.evaluate(element => {
        const itemsElement = element.children[1]!.firstElementChild!;
        const firstItem = itemsElement.firstElementChild!;
        const lastItem = itemsElement.lastElementChild!;
        const listBounds = element.getBoundingClientRect();
        const headerBounds = element.firstElementChild!.getBoundingClientRect();
        const firstBounds = firstItem.getBoundingClientRect();
        const lastBounds = lastItem.getBoundingClientRect();

        return {
            firstGap: Math.max(0, firstBounds.top - headerBounds.bottom),
            lastGap: Math.max(0, listBounds.bottom - lastBounds.bottom),
            lastPosition: Number(lastItem.getAttribute("aria-posinset")),
            itemCount: Number(lastItem.getAttribute("aria-setsize"))
        };
    });

const countPaintedContentRows = async (page: Page, list: Locator) => {
    const [screenshot, geometry] = await Promise.all([
        list.screenshot(),
        list.evaluate(element => ({
            height: element.getBoundingClientRect().height,
            headerHeight:
                element.firstElementChild!.getBoundingClientRect().height
        }))
    ]);

    return page.evaluate(
        async ({ image, height, headerHeight }) => {
            const response = await fetch(`data:image/png;base64,${image}`);
            const bitmap = await createImageBitmap(await response.blob());
            const canvas = document.createElement("canvas");
            canvas.width = bitmap.width;
            canvas.height = bitmap.height;
            const context = canvas.getContext("2d", {
                willReadFrequently: true
            })!;
            context.drawImage(bitmap, 0, 0);
            const pixels = context.getImageData(
                0,
                0,
                bitmap.width,
                bitmap.height
            ).data;
            const scale = bitmap.height / height;
            const firstContentRow = Math.ceil(headerHeight * scale) + 1;
            const contentWidth = Math.max(
                1,
                bitmap.width - Math.ceil(20 * scale)
            );
            let paintedRows = 0;

            for (let y = firstContentRow; y < bitmap.height; y++) {
                let darkPixels = 0;
                for (let x = 1; x < contentWidth; x++) {
                    const pixel = (y * bitmap.width + x) * 4;
                    if (
                        pixels[pixel] < 235 &&
                        pixels[pixel + 1] < 235 &&
                        pixels[pixel + 2] < 235
                    ) {
                        darkPixels++;
                    }
                }
                if (darkPixels >= 5) paintedRows++;
            }

            return paintedRows;
        },
        {
            image: screenshot.toString("base64"),
            ...geometry
        }
    );
};

test("keeps the idle-hydration scrollbar inert without losing SSR geometry", async ({
    browser
}) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();

    try {
        await page.goto(WEBSITE_EXAMPLE_URL);

        const preview = page.frameLocator(
            'iframe[title="Prepend Items List React Virtual Preview"]'
        );
        const list = preview.getByRole("list", { name: "Prepend items list" });

        await expect(list).toHaveCSS("overflow", "hidden");
        await expect(preview.getByRole("listitem").first()).toBeVisible();
        expect(
            await list.evaluate(element => element.scrollHeight)
        ).toBeGreaterThan(1_000_000);
    } finally {
        await context.close();
    }
});

test("hydrates before exposing the documentation preview scrollbar", async ({
    page
}) => {
    await page.goto(WEBSITE_EXAMPLE_URL);

    const preview = page.frameLocator(
        'iframe[title="Prepend Items List React Virtual Preview"]'
    );
    const list = preview.getByRole("list", { name: "Prepend items list" });
    const items = preview.getByRole("listitem");
    await expect(items.first()).toBeVisible();
    await expect(list).toHaveCSS("overflow", "auto");

    const itemCount = Number(await items.first().getAttribute("aria-setsize"));
    expect(itemCount).toBe(10_000);

    const viewport = await list.boundingBox();
    expect(viewport).not.toBeNull();
    const scrollbarX = viewport!.x + viewport!.width - 2;

    await page.mouse.move(scrollbarX, viewport!.y + 24);
    await page.mouse.down();
    try {
        const startY = viewport!.y + 24;
        const endY = viewport!.y + viewport!.height - 2;
        for (let step = 1; step <= 60; step++) {
            await page.mouse.move(
                scrollbarX,
                startY + ((endY - startY) * step) / 60
            );
        }
        await page.waitForTimeout(510);
        await page.mouse.up();

        const expectedEndState = {
            firstGap: 0,
            lastGap: 0,
            lastPosition: itemCount,
            itemCount
        };
        expect(await getEndState(list)).toEqual(expectedEndState);
        await expect.poll(() => getEndState(list)).toEqual(expectedEndState);

        // The old DOM-only assertion passed while Chromium displayed a white
        // composited layer. Inspect actual screenshot pixels after the delayed
        // frame that used to lose the item layer.
        await page.waitForTimeout(170);
        expect(await countPaintedContentRows(page, list)).toBeGreaterThan(20);
    } finally {
        await page.mouse.up();
    }
});
