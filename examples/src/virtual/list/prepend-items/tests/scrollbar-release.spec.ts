import {
    describeExample,
    expect,
    expectDefined,
    type Locator,
    requireNativeScrollbarPointer,
    test,
    waitForExampleHydration
} from "../../../../e2e";

/** Mirrors the stationary end hold captured in the compositor regression trace. */
const HELD_POINTER_IDLE_MS = 510;

const getEndState = (list: Locator) =>
    list.evaluate(element => {
        const itemsElement = element.children[1]?.firstElementChild;
        const firstItem = itemsElement?.firstElementChild;
        const lastItem = itemsElement?.lastElementChild;
        const header = element.firstElementChild;
        if (!itemsElement || !firstItem || !lastItem || !header) {
            throw new Error("Expected the list header and rendered items");
        }
        const listBounds = element.getBoundingClientRect();
        const headerBounds = header.getBoundingClientRect();
        const firstBounds = firstItem.getBoundingClientRect();
        const lastBounds = lastItem.getBoundingClientRect();

        return {
            firstGap: Math.max(0, firstBounds.top - headerBounds.bottom),
            lastGap: Math.max(0, listBounds.bottom - lastBounds.bottom),
            lastPosition: Number(lastItem.getAttribute("aria-posinset")),
            itemCount: Number(lastItem.getAttribute("aria-setsize"))
        };
    });

const getItemIdentity = (item: Locator) =>
    item.evaluate(element =>
        element.textContent?.replace(/^\s*Idx:\s*\d+;\s*/u, "").trim()
    );

await describeExample("virtual/list/prepend-items", example => {
    test("keeps the end rendered after releasing the native scrollbar", async ({
        browserName,
        page
    }) => {
        requireNativeScrollbarPointer(browserName);
        await page.goto(example.previewPath);
        await waitForExampleHydration(page);

        const list = page.getByRole("list", { name: "Prepend items list" });
        const items = page.getByRole("listitem");
        await expect(items.first()).toBeVisible();

        const itemCount = Number(
            await items.first().getAttribute("aria-setsize")
        );
        expect(itemCount).toBeGreaterThan(0);

        const viewport = expectDefined(
            await list.boundingBox(),
            "Expected the list viewport to be visible"
        );
        const scrollbarX = viewport.x + viewport.width - 2;

        await page.mouse.move(scrollbarX, viewport.y + 24);
        await page.mouse.down();
        try {
            await page.mouse.move(
                scrollbarX,
                viewport.y + viewport.height - 2,
                {
                    steps: 1
                }
            );

            const expectedEndState = {
                firstGap: 0,
                lastGap: 0,
                lastPosition: itemCount,
                itemCount
            };
            await expect
                .poll(() => getEndState(list))
                .toEqual(expectedEndState);

            // Let the last scroll event become idle while the thumb stays held.
            // This is the release race that a timestamp measured only from scroll
            // events cannot distinguish from an interaction that has really ended.
            await page.waitForTimeout(HELD_POINTER_IDLE_MS);
            const heldScrollHeight = await list.evaluate(
                element => element.scrollHeight
            );

            await page.mouse.up();

            // Release publishes the measurements in the pointerup turn. Delaying
            // this update creates a later compositor-only frame with no items.
            expect(
                await list.evaluate(element => element.scrollHeight)
            ).toBeGreaterThan(heldScrollHeight);
            expect(await getEndState(list)).toEqual(expectedEndState);
            await expect
                .poll(() => getEndState(list))
                .toEqual(expectedEndState);
        } finally {
            // `mouse.up` is harmless if the main path already released the pointer.
            await page.mouse.up();
        }
    });

    test("keeps the end rendered when prepend finishes during a scrollbar drag", async ({
        page
    }) => {
        await page.goto(example.previewPath);
        await waitForExampleHydration(page);

        const list = page.getByRole("list", { name: "Prepend items list" });
        const items = page.getByRole("listitem");
        const prependButton = page.getByRole("button");
        await expect(items.first()).toBeVisible();

        const initialItemCount = Number(
            await items.first().getAttribute("aria-setsize")
        );
        expect(initialItemCount).toBeGreaterThan(0);

        await list.evaluate(element => {
            element.scrollTop = element.scrollHeight;
        });
        const initialEndState = {
            firstGap: 0,
            lastGap: 0,
            lastPosition: initialItemCount,
            itemCount: initialItemCount
        };
        await expect.poll(() => getEndState(list)).toEqual(initialEndState);
        const anchoredLastItem = await getItemIdentity(items.last());

        await prependButton.click();
        const heldScrollHeight = await list.evaluate(element => {
            const bounds = element.getBoundingClientRect();
            element.dispatchEvent(
                new PointerEvent("pointerdown", {
                    bubbles: true,
                    clientX: bounds.right + 1,
                    isPrimary: true
                })
            );
            return element.scrollHeight;
        });

        await expect(prependButton).toContainText("loading");
        await expect(prependButton).not.toContainText("loading");
        expect(
            await list.evaluate(element => element.scrollHeight)
        ).toBeGreaterThan(heldScrollHeight);

        const itemCount = (await getEndState(list)).itemCount;
        expect(itemCount).toBeGreaterThan(initialItemCount);
        await expect
            .poll(() => getEndState(list))
            .toEqual({
                firstGap: 0,
                lastGap: 0,
                lastPosition: itemCount,
                itemCount
            });
        expect(await getItemIdentity(items.last())).toBe(anchoredLastItem);

        await page.evaluate(() =>
            window.dispatchEvent(
                new PointerEvent("pointerup", {
                    bubbles: true,
                    isPrimary: true
                })
            )
        );

        expect(await getEndState(list)).toEqual({
            firstGap: 0,
            lastGap: 0,
            lastPosition: itemCount,
            itemCount
        });
        await expect
            .poll(() => getEndState(list))
            .toEqual({
                firstGap: 0,
                lastGap: 0,
                lastPosition: itemCount,
                itemCount
            });
    });
});
