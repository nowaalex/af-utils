import {
    describeExample,
    expect,
    expectDefined,
    getVerticalScrollbarX,
    requireNativeScrollbarPointer,
    test,
    waitForExampleHydration
} from "../../../../e2e";

await describeExample("virtual/primitives/custom-render", example => {
    test("loads CSS modules through the Astro integration", async ({
        page
    }) => {
        const pageErrors: string[] = [];
        page.on("pageerror", error => pageErrors.push(error.message));

        const response = await page.goto(example.documentationPath);
        const previewElement = page.locator('iframe[src^="/examples/"]');
        await previewElement.scrollIntoViewIfNeeded();
        const preview = page.frameLocator('iframe[src^="/examples/"]');

        expect(response?.ok()).toBe(true);
        await expect(preview.getByRole("table")).toBeVisible();
        expect(pageErrors).toEqual([]);
    });

    if (example.framework === "lit") {
        test("keeps the scrollbar thumb synchronized across repeated drags", async ({
            browserName,
            page
        }) => {
            requireNativeScrollbarPointer(browserName);
            await page.goto(example.previewPath);
            await waitForExampleHydration(page);

            const scroller = page.getByRole("table").locator("..");
            const bounds = expectDefined(
                await scroller.boundingBox(),
                "Expected the table scroller to be visible"
            );
            const scrollbarX = await getVerticalScrollbarX(scroller);
            // Stay below Chromium's scrollbar arrow/track area so the pointer
            // lands on the initial thumb, as a real drag would.
            const top = bounds.y + 24;
            const bottom = bounds.y + bounds.height - 2;
            const getScrollRatio = () =>
                scroller.evaluate(
                    element =>
                        element.scrollTop /
                        (element.scrollHeight - element.clientHeight)
                );

            await page.mouse.move(scrollbarX, top);
            await page.mouse.down();
            try {
                // oxlint-disable eslint/no-await-in-loop -- Sequential pointer frames reproduce one continuous physical thumb drag.
                for (let iteration = 0; iteration < 4; iteration++) {
                    for (let step = 1; step <= 24; step++) {
                        await page.mouse.move(
                            scrollbarX,
                            top + ((bottom - top) * step) / 24
                        );
                        await page.waitForTimeout(16);
                    }
                    await expect.poll(getScrollRatio).toBeGreaterThan(0.98);

                    for (let step = 1; step <= 24; step++) {
                        await page.mouse.move(
                            scrollbarX,
                            bottom - ((bottom - top) * step) / 24
                        );
                        await page.waitForTimeout(16);
                    }
                    await expect.poll(getScrollRatio).toBeLessThan(0.02);
                }
                // oxlint-enable eslint/no-await-in-loop
                await page.mouse.up();
            } finally {
                await page.mouse.up();
            }
        });
    }
});
