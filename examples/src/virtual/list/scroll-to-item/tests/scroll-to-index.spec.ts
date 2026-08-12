import {
    describeExample,
    expect,
    expectDefined,
    getVerticalScrollbarX,
    type Locator,
    type Page,
    requireNativeScrollbarPointer,
    test,
    waitForExampleHydration
} from "../../../../e2e";

const TARGET_INDEX = 25_000;

const countPaintedContentRows = async (page: Page, list: Locator) => {
    const [screenshot, geometry] = await Promise.all([
        list.screenshot(),
        list.evaluate(element => {
            const header = element.firstElementChild;
            const footer = element.lastElementChild;
            if (!header || !footer) {
                throw new Error("Expected the list header and footer");
            }
            return {
                height: element.getBoundingClientRect().height,
                headerHeight: header.getBoundingClientRect().height,
                footerHeight: footer.getBoundingClientRect().height
            };
        })
    ]);

    return page.evaluate(
        async ({ image, height, headerHeight, footerHeight }) => {
            const response = await fetch(`data:image/png;base64,${image}`);
            const bitmap = await createImageBitmap(await response.blob());
            const canvas = document.createElement("canvas");
            canvas.width = bitmap.width;
            canvas.height = bitmap.height;
            const context = canvas.getContext("2d", {
                willReadFrequently: true
            });
            if (!context) throw new Error("Canvas 2D context is unavailable");
            context.drawImage(bitmap, 0, 0);
            const pixels = context.getImageData(
                0,
                0,
                bitmap.width,
                bitmap.height
            ).data;
            const scale = bitmap.height / height;
            const firstContentRow = Math.ceil(headerHeight * scale) + 1;
            const lastContentRow =
                bitmap.height - Math.ceil(footerHeight * scale) - 1;
            const contentWidth = Math.max(
                1,
                bitmap.width - Math.ceil(20 * scale)
            );
            let paintedRows = 0;

            for (let y = firstContentRow; y < lastContentRow; y++) {
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

const getFocusBorderCoverage = async (page: Page, list: Locator) => {
    const screenshot = await list.screenshot();

    return page.evaluate(async image => {
        const response = await fetch(`data:image/png;base64,${image}`);
        const bitmap = await createImageBitmap(await response.blob());
        const canvas = document.createElement("canvas");
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        const context = canvas.getContext("2d", { willReadFrequently: true });
        if (!context) throw new Error("Canvas 2D context is unavailable");
        context.drawImage(bitmap, 0, 0);
        const pixels = context.getImageData(
            0,
            0,
            bitmap.width,
            bitmap.height
        ).data;
        const edgeWidth = Math.max(
            1,
            Math.round(globalThis.devicePixelRatio * 2)
        );
        const horizontalEnd = Math.max(1, bitmap.width - 20);
        let dark = 0;
        let sampled = 0;

        for (const edgeStart of [0, bitmap.height - edgeWidth]) {
            for (let y = edgeStart; y < edgeStart + edgeWidth; y++) {
                for (let x = 0; x < horizontalEnd; x++) {
                    const pixel = (y * bitmap.width + x) * 4;
                    if (
                        pixels[pixel] < 80 &&
                        pixels[pixel + 1] < 80 &&
                        pixels[pixel + 2] < 100
                    ) {
                        dark++;
                    }
                    sampled++;
                }
            }
        }

        return dark / sampled;
    }, screenshot.toString("base64"));
};

await describeExample("virtual/list/scroll-to-item", example => {
    test("initially renders the final row immediately above the footer", async ({
        page
    }) => {
        await page.goto(example.previewPath);
        await waitForExampleHydration(page);

        const list = page.getByRole("list");
        const items = page.getByRole("listitem");
        await expect(items.first()).toBeVisible();
        const itemCount = Number(
            await items.first().getAttribute("aria-setsize")
        );
        expect(itemCount).toBeGreaterThan(0);

        const finalItem = page.locator(
            `[role="listitem"][aria-posinset="${itemCount}"]`
        );
        await expect(finalItem).toBeAttached({ timeout: 10_000 });

        expect(
            await list.evaluate(element => {
                const size = element.children[1] as HTMLElement;
                const itemsContainer = size.firstElementChild as HTMLElement;
                return {
                    sizeContain: getComputedStyle(size).contain,
                    itemsContain: getComputedStyle(itemsContainer).contain,
                    itemsOverflow: getComputedStyle(itemsContainer).overflow,
                    itemsTop: getComputedStyle(itemsContainer).top,
                    itemsTransformed:
                        getComputedStyle(itemsContainer).transform !== "none"
                };
            })
        ).toEqual({
            sizeContain: "size layout style",
            itemsContain: "size layout style",
            itemsOverflow: "visible",
            itemsTop: "0px",
            itemsTransformed: true
        });

        await expect
            .poll(() =>
                list.evaluate((element, expectedItemCount) => {
                    const footer = element.lastElementChild;
                    const lastItem = element.querySelector(
                        `[role="listitem"][aria-posinset="${expectedItemCount}"]`
                    );
                    if (!footer || !lastItem) {
                        throw new Error("Expected the footer and final item");
                    }
                    const footerTop = footer.getBoundingClientRect().top;
                    const itemBottom = lastItem.getBoundingClientRect().bottom;

                    return Math.max(
                        Math.abs(footerTop - itemBottom),
                        Math.abs(
                            element.scrollHeight -
                                element.clientHeight -
                                element.scrollTop
                        )
                    );
                }, itemCount)
            )
            .toBeLessThanOrEqual(1);
    });

    test("scrolls to the requested variable-size index", async ({ page }) => {
        await page.goto(example.previewPath);
        await waitForExampleHydration(page);

        const list = page.getByRole("list");
        const indexInput = page.getByRole("spinbutton", {
            name: "Smooth scroll to index:"
        });
        const goButton = page.getByRole("button", { name: "Go" });
        await expect(indexInput).toBeVisible();

        // Let the example's initial instant scroll finish before counting calls
        // made by the interaction under test.
        await page.waitForTimeout(150);
        await list.evaluate(element => {
            element.scrollTop = 0;
        });
        await expect
            .poll(() => list.evaluate(element => element.scrollTop))
            .toBe(0);
        await list.evaluate(element => {
            const scope = globalThis as typeof globalThis & {
                __afScrollToIndexTest?: {
                    calls: number;
                    targets: number[];
                };
            };
            const originalScroll = element.scroll.bind(element);
            const state = { calls: 0, targets: [] as number[] };

            scope.__afScrollToIndexTest = state;
            element.scroll = ((...args: unknown[]) => {
                state.calls++;
                if (typeof args[0] === "number") {
                    state.targets.push(args[1] as number);
                    originalScroll(args[0], args[1] as number);
                } else {
                    const options = args[0] as ScrollToOptions | undefined;
                    state.targets.push(options?.top ?? element.scrollTop);
                    originalScroll(options);
                }
            }) as HTMLElement["scroll"];
        });

        await indexInput.fill(String(TARGET_INDEX));
        await goButton.click();
        await expect
            .poll(() =>
                page.evaluate(() => {
                    const scope = globalThis as typeof globalThis & {
                        __afScrollToIndexTest?: { calls: number };
                    };
                    return scope.__afScrollToIndexTest?.calls ?? 0;
                })
            )
            .toBeGreaterThan(0);

        const target = page.locator(
            `[role="listitem"][aria-posinset="${TARGET_INDEX + 1}"]`
        );
        await expect(target).toBeAttached({ timeout: 10_000 });
        await expect
            .poll(() =>
                target.evaluate(element => {
                    const scroller =
                        element.closest<HTMLElement>('[role="list"]');
                    const header = scroller?.querySelector("form");
                    const footer = scroller?.lastElementChild;
                    if (!scroller || !header || !footer) {
                        throw new Error(
                            "Expected the list, header, and footer"
                        );
                    }
                    const itemBounds = element.getBoundingClientRect();
                    const listBounds = scroller.getBoundingClientRect();
                    const headerBounds = header.getBoundingClientRect();
                    const footerBounds = footer.getBoundingClientRect();
                    let visibleTop = Math.max(
                        itemBounds.top,
                        listBounds.top,
                        headerBounds.bottom
                    );
                    let visibleBottom = Math.min(
                        itemBounds.bottom,
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

                    return (
                        visibleTop <= itemBounds.top + 0.5 &&
                        visibleBottom >= itemBounds.bottom - 0.5
                    );
                })
            )
            .toBe(true);

        await expect
            .poll(async () => {
                const before = await page.evaluate(() => {
                    const scope = globalThis as typeof globalThis & {
                        __afScrollToIndexTest?: { calls: number };
                    };
                    return scope.__afScrollToIndexTest?.calls;
                });
                await page.waitForTimeout(200);
                const after = await page.evaluate(() => {
                    const scope = globalThis as typeof globalThis & {
                        __afScrollToIndexTest?: { calls: number };
                    };
                    return scope.__afScrollToIndexTest?.calls;
                });
                return after === before;
            })
            .toBe(true);

        const targets = await page.evaluate(() => {
            const scope = globalThis as typeof globalThis & {
                __afScrollToIndexTest: { targets: number[] };
            };
            return scope.__afScrollToIndexTest.targets;
        });

        expect(targets.length).toBeGreaterThan(0);
        for (let index = 1; index < targets.length; index++) {
            expect(
                Math.abs(targets[index] - targets[index - 1])
            ).toBeGreaterThan(1);
        }
    });

    test("keeps the end rendered after dragging the scrollbar away and back", async ({
        browserName,
        page
    }) => {
        requireNativeScrollbarPointer(browserName);
        await page.goto(example.previewPath);
        await waitForExampleHydration(page);

        const list = page.getByRole("list");
        const items = page.getByRole("listitem");
        await expect(items.first()).toBeVisible();
        const itemCount = Number(
            await items.first().getAttribute("aria-setsize")
        );
        const finalItem = page.locator(
            `[role="listitem"][aria-posinset="${itemCount}"]`
        );
        await expect(finalItem).toBeAttached({ timeout: 10_000 });

        const viewport = expectDefined(
            await list.boundingBox(),
            "Expected the list viewport to be visible"
        );
        const scrollbarX = await getVerticalScrollbarX(list);
        const scrollbarBottom = viewport.y + viewport.height + 10;
        const scrollbarThumb = viewport.y + viewport.height - 28;

        await page.mouse.move(scrollbarX, scrollbarThumb);
        await page.mouse.down();
        try {
            // oxlint-disable eslint/no-await-in-loop -- Pointer frames must be dispatched in order to model a physical scrollbar drag.
            for (let step = 1; step <= 30; step++) {
                await page.mouse.move(
                    scrollbarX,
                    scrollbarThumb +
                        ((viewport.y + 80 - scrollbarThumb) * step) / 30
                );
                await page.waitForTimeout(16);
            }
            // oxlint-enable eslint/no-await-in-loop
            await expect(finalItem).not.toBeAttached();

            // oxlint-disable eslint/no-await-in-loop -- Pointer frames must be dispatched in order to model the return drag.
            for (let step = 1; step <= 30; step++) {
                await page.mouse.move(
                    scrollbarX,
                    viewport.y +
                        80 +
                        ((scrollbarBottom - (viewport.y + 80)) * step) / 30
                );
                await page.waitForTimeout(16);
            }
            // oxlint-enable eslint/no-await-in-loop
            await page.mouse.up();

            await expect(finalItem).toBeAttached({ timeout: 10_000 });
            await expect
                .poll(() =>
                    list.evaluate((element, expectedItemCount) => {
                        const rendered =
                            element.querySelectorAll('[role="listitem"]');
                        const lastItem = rendered.item(rendered.length - 1);
                        if (!lastItem) return null;

                        return {
                            lastPosition: Number(
                                lastItem.getAttribute("aria-posinset")
                            ),
                            itemCount: expectedItemCount,
                            endOffset:
                                element.scrollHeight -
                                element.clientHeight -
                                element.scrollTop
                        };
                    }, itemCount)
                )
                .toEqual({
                    lastPosition: itemCount,
                    itemCount,
                    endOffset: 0
                });

            // DOM geometry remains correct when the compositor loses the range,
            // so inspect the pixels after the release frame as well.
            await page.waitForTimeout(170);
            expect(await countPaintedContentRows(page, list)).toBeGreaterThan(
                20
            );
        } finally {
            await page.mouse.up();
        }
    });

    test("keeps the keyboard focus border above sticky content", async ({
        page
    }) => {
        await page.goto(example.previewPath);
        await waitForExampleHydration(page);

        const list = page.getByRole("list");
        await expect(page.getByRole("listitem").first()).toBeVisible();
        await page.keyboard.press("Tab");
        await list.focus();
        await page.keyboard.press("ArrowUp");
        await expect(list).toBeFocused();
        await expect
            .poll(() => getFocusBorderCoverage(page, list))
            .toBeGreaterThan(0.8);

        // oxlint-disable eslint/no-await-in-loop -- Focus coverage is asserted after each ordered keyboard interaction.
        for (const key of ["PageUp", "ArrowDown", "PageDown"]) {
            await page.keyboard.press(key);
            await expect
                .poll(() => getFocusBorderCoverage(page, list))
                .toBeGreaterThan(0.8);
        }
        // oxlint-enable eslint/no-await-in-loop
    });
});
