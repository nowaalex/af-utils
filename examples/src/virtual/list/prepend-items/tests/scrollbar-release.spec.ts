import {
    describeExample,
    expect,
    getVerticalScrollbarGeometry,
    getVirtualItemCount,
    getVirtualListState,
    type Locator,
    openExample,
    requireNativeScrollbarPointer,
    test,
    withHeldPointer
} from "../../../../e2e";

/** Mirrors the stationary end hold captured in the compositor regression trace. */
const HELD_POINTER_IDLE_MS = 510;

const getEndState = async (list: Locator) => {
    const state = await getVirtualListState(list, {
        headerSelector: ":scope > :first-child"
    });
    return {
        firstGap: state.firstGap,
        lastGap: state.lastGap,
        lastPosition: state.lastPosition,
        itemCount: state.itemCount
    };
};

const getItemIdentity = (item: Locator) =>
    item.evaluate(element =>
        element.textContent?.replace(/^\s*Idx:\s*\d+;\s*/u, "").trim()
    );

const getVisibleAnchor = (list: Locator) =>
    list.evaluate(element => {
        const header = element.firstElementChild;
        if (!header) throw new Error("Expected the list header");
        const contentTop = header.getBoundingClientRect().bottom;
        const item = [
            ...element.querySelectorAll<HTMLElement>('[role="listitem"]')
        ].find(
            candidate => candidate.getBoundingClientRect().bottom > contentTop
        );
        if (!item) return null;

        return {
            identity: item.textContent
                ?.replace(/^\s*Idx:\s*\d+;\s*/u, "")
                .trim(),
            offset: item.getBoundingClientRect().top - contentTop,
            position: Number(item.getAttribute("aria-posinset"))
        };
    });

await describeExample("virtual/list/prepend-items", example => {
    test("preserves the visible item and fractional offset after prepend", async ({
        page
    }) => {
        await openExample(page, example.previewPath);

        const list = page.getByRole("list", { name: "Prepend items list" });
        const prependButton = page.getByRole("button");
        await expect(page.getByRole("listitem").first()).toBeVisible();
        await list.evaluate(element => {
            element.scrollTop = 500_017;
        });
        await expect
            .poll(() =>
                getVisibleAnchor(list).then(anchor => anchor?.position ?? 0)
            )
            .toBeGreaterThan(1_000);
        const before = await getVisibleAnchor(list);
        if (!before) throw new Error("Expected a visible list item");

        await prependButton.click();
        await expect(prependButton).toContainText("loading");
        await expect(prependButton).not.toContainText("loading");

        await expect
            .poll(async () => {
                const after = await getVisibleAnchor(list);
                return {
                    identity: after?.identity,
                    positionDelta: after
                        ? after.position - before.position
                        : null
                };
            })
            .toEqual({
                identity: before.identity,
                positionDelta: 100
            });
        await expect
            .poll(() =>
                getVisibleAnchor(list).then(after =>
                    after
                        ? Math.abs(after.offset - before.offset)
                        : Number.POSITIVE_INFINITY
                )
            )
            .toBeLessThanOrEqual(1);
    });

    test("keeps the end rendered after releasing the native scrollbar", async ({
        page
    }) => {
        requireNativeScrollbarPointer();
        await openExample(page, example.previewPath);

        const list = page.getByRole("list", { name: "Prepend items list" });
        const items = page.getByRole("listitem");
        await expect(items.first()).toBeVisible();

        const itemCount = await getVirtualItemCount(items);
        const expectedEndState = {
            firstGap: 0,
            lastGap: 0,
            lastPosition: itemCount,
            itemCount
        };
        const scrollbar = await getVerticalScrollbarGeometry(list);
        let heldScrollHeight = 0;

        await withHeldPointer(page, scrollbar.x, scrollbar.start, async () => {
            await page.mouse.move(scrollbar.x, scrollbar.bottom, { steps: 1 });

            await expect
                .poll(() => getEndState(list))
                .toEqual(expectedEndState);

            // Let the last scroll event become idle while the thumb stays held.
            // This is the release race that a timestamp measured only from scroll
            // events cannot distinguish from an interaction that has really ended.
            await page.waitForTimeout(HELD_POINTER_IDLE_MS);
            heldScrollHeight = await list.evaluate(
                element => element.scrollHeight
            );
        });

        // Release publishes the measurements in the pointerup turn. Delaying
        // this update creates a later compositor-only frame with no items.
        expect(
            await list.evaluate(element => element.scrollHeight)
        ).toBeGreaterThan(heldScrollHeight);
        expect(await getEndState(list)).toEqual(expectedEndState);
        await expect.poll(() => getEndState(list)).toEqual(expectedEndState);
    });

    test("keeps the end rendered when prepend finishes during a scrollbar drag", async ({
        page
    }) => {
        await openExample(page, example.previewPath);

        const list = page.getByRole("list", { name: "Prepend items list" });
        const items = page.getByRole("listitem");
        const prependButton = page.getByRole("button");
        await expect(items.first()).toBeVisible();

        const initialItemCount = await getVirtualItemCount(items);

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
