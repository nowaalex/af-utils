import {
    describeExample,
    expect,
    expectDefined,
    getVerticalScrollbarX,
    requireNativeScrollbarPointer,
    test,
    waitForExampleHydration
} from "../../../../e2e";

const getEndState = (element: HTMLElement) => {
    const sizeElement = element.children[1]?.children[1]?.firstElementChild;
    const itemsElement = sizeElement?.firstElementChild;
    const lastItem = itemsElement?.lastElementChild;
    const viewport = element.getBoundingClientRect();
    const lastBounds = lastItem?.getBoundingClientRect();

    return {
        fullyVisible:
            lastBounds !== undefined &&
            lastBounds.top >= viewport.top - 1 &&
            lastBounds.bottom <= viewport.bottom + 1,
        lastIndex: Number(lastItem?.textContent?.replace("row ", ""))
    };
};

await describeExample(
    "virtual/primitives/different-scroll-element",
    example => {
        test("keeps the final item visible after a fast scrollbar release", async ({
            browserName,
            page
        }) => {
            requireNativeScrollbarPointer(browserName);
            await page.goto(example.previewPath);
            await waitForExampleHydration(page);

            const list = page.getByRole("list");
            await expect(
                page.getByText("row 0", { exact: true })
            ).toBeVisible();
            const viewport = expectDefined(
                await list.boundingBox(),
                "Expected the list viewport to be visible"
            );
            const scrollbarX = await getVerticalScrollbarX(list);

            await page.mouse.move(scrollbarX, viewport.y + 24);
            await page.mouse.down();
            try {
                await page.mouse.move(
                    scrollbarX,
                    viewport.y + viewport.height - 4,
                    {
                        steps: 1
                    }
                );
                await page.mouse.up();

                await expect
                    .poll(() => list.evaluate(getEndState))
                    .toEqual({ fullyVisible: true, lastIndex: 4_999 });

                // Let post-release ResizeObserver deliveries and the debounced offset
                // window settle; native scroll anchoring must not move the list away.
                await page.waitForTimeout(300);
                expect(await list.evaluate(getEndState)).toEqual({
                    fullyVisible: true,
                    lastIndex: 4_999
                });
            } finally {
                await page.mouse.up();
            }
        });
    }
);
