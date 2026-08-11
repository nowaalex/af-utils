import { expect, type Locator, test } from "@playwright/test";

const EXAMPLE_URL = "http://127.0.0.1:4178";

/** Mirrors the stationary end hold captured in the compositor regression trace. */
const HELD_POINTER_IDLE_MS = 510;

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

test("keeps the end rendered after releasing the native scrollbar", async ({
    page
}) => {
    await page.goto(EXAMPLE_URL);

    const list = page.getByRole("list", { name: "Prepend items list" });
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

        const expectedEndState = {
            firstGap: 0,
            lastGap: 0,
            lastPosition: itemCount,
            itemCount
        };
        await expect.poll(() => getEndState(list)).toEqual(expectedEndState);

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
        await expect.poll(() => getEndState(list)).toEqual(expectedEndState);
    } finally {
        // `mouse.up` is harmless if the main path already released the pointer.
        await page.mouse.up();
    }
});

test("keeps the end rendered when prepend finishes during a scrollbar drag", async ({
    page
}) => {
    await page.goto(EXAMPLE_URL);

    const list = page.getByRole("list", { name: "Prepend items list" });
    const items = page.getByRole("listitem");
    const prependButton = page.getByRole("button");
    await expect(items.first()).toBeVisible();

    const initialItemCount = Number(
        await items.first().getAttribute("aria-setsize")
    );
    expect(initialItemCount).toBeGreaterThan(0);

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
        element.scrollTop = element.scrollHeight;
        return element.scrollHeight;
    });

    await expect(prependButton).toContainText("loading");
    await expect(prependButton).not.toContainText("loading");
    expect(await list.evaluate(element => element.scrollHeight)).toBe(
        heldScrollHeight
    );

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
