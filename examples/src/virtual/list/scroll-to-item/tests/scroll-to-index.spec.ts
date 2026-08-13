import {
    countDarkContentRows,
    describeExample,
    expect,
    getDarkHorizontalEdgeCoverage,
    getVerticalScrollbarGeometry,
    getVirtualItemCount,
    isElementFullyVisible,
    movePointerVertically,
    openExample,
    requireNativeScrollbarPointer,
    test,
    withHeldPointer
} from "../../../../e2e";

const TARGET_INDEX = 25_000;

await describeExample("virtual/list/scroll-to-item", example => {
    if (example.framework === "lit") {
        test("adds and removes rows before scrolling to the new end", async ({
            page
        }) => {
            await openExample(page, example.previewPath);

            const list = page.getByRole("list");
            const rowsToAdd = page.getByRole("spinbutton", {
                name: "Rows to add:"
            });
            const submit = page.getByRole("button", {
                name: "Add and scroll to end"
            });
            const getItemCount = () =>
                page
                    .getByRole("listitem")
                    .first()
                    .getAttribute("aria-setsize")
                    .then(Number);
            const expectEnd = async (itemCount: number) => {
                const finalItem = page.locator(
                    `[role="listitem"][aria-posinset="${itemCount}"]`
                );
                await expect(finalItem).toBeAttached({ timeout: 10_000 });
                await expect
                    .poll(() =>
                        list.evaluate(element =>
                            Math.abs(
                                element.scrollHeight -
                                    element.clientHeight -
                                    element.scrollTop
                            )
                        )
                    )
                    .toBeLessThanOrEqual(1);
            };

            const initialCount = await getItemCount();
            await rowsToAdd.fill("37");
            await submit.click();
            await expect.poll(getItemCount).toBe(initialCount + 37);
            await expectEnd(initialCount + 37);

            await rowsToAdd.fill("-53");
            await submit.click();
            await expect.poll(getItemCount).toBe(initialCount - 16);
            await expectEnd(initialCount - 16);
        });
    }

    test("initially renders the final row immediately above the footer", async ({
        page
    }) => {
        await openExample(page, example.previewPath);

        const list = page.getByRole("list");
        const items = page.getByRole("listitem");
        await expect(items.first()).toBeVisible();
        const itemCount = await getVirtualItemCount(items);

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
        await openExample(page, example.previewPath);

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
                isElementFullyVisible(target, {
                    containerSelector: '[role="list"]',
                    headerSelector: ":scope > :first-child",
                    footerSelector: ":scope > :last-child"
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
        page
    }) => {
        requireNativeScrollbarPointer();
        await openExample(page, example.previewPath);

        const list = page.getByRole("list");
        const items = page.getByRole("listitem");
        await expect(items.first()).toBeVisible();
        const itemCount = await getVirtualItemCount(items);
        const finalItem = page.locator(
            `[role="listitem"][aria-posinset="${itemCount}"]`
        );
        await expect(finalItem).toBeAttached({ timeout: 10_000 });

        const scrollbar = await getVerticalScrollbarGeometry(list);
        const scrollbarThumb = scrollbar.bottom - 26;
        const awayFromEnd = scrollbar.top + 80;

        await withHeldPointer(page, scrollbar.x, scrollbarThumb, async () => {
            await movePointerVertically(
                page,
                scrollbar.x,
                scrollbarThumb,
                awayFromEnd,
                30,
                16
            );
            await expect(finalItem).not.toBeAttached();

            await movePointerVertically(
                page,
                scrollbar.x,
                awayFromEnd,
                scrollbar.bottom + 12,
                30,
                16
            );
        });

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
        expect(
            await countDarkContentRows(page, list, {
                topInsetSelector: ":scope > :first-child",
                bottomInsetSelector: ":scope > :last-child"
            })
        ).toBeGreaterThan(20);
    });

    test("keeps the keyboard focus border above sticky content", async ({
        page
    }) => {
        await openExample(page, example.previewPath);

        const list = page.getByRole("list");
        await expect(page.getByRole("listitem").first()).toBeVisible();
        await page.keyboard.press("Tab");
        await list.focus();
        await page.keyboard.press("ArrowUp");
        await expect(list).toBeFocused();
        await expect
            .poll(() => getDarkHorizontalEdgeCoverage(page, list))
            .toBeGreaterThan(0.8);

        // oxlint-disable eslint/no-await-in-loop -- Focus coverage is asserted after each ordered keyboard interaction.
        for (const key of ["PageUp", "ArrowDown", "PageDown"]) {
            await page.keyboard.press(key);
            await expect
                .poll(() => getDarkHorizontalEdgeCoverage(page, list))
                .toBeGreaterThan(0.8);
        }
        // oxlint-enable eslint/no-await-in-loop
    });
});
