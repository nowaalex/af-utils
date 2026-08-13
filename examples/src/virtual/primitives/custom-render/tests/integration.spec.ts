import {
    describeExample,
    expect,
    getVerticalScrollbarGeometry,
    movePointerVertically,
    openExample,
    requireNativeScrollbarPointer,
    test,
    withHeldPointer
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
        test("keeps the viewport covered during fast wheel scrolling", async ({
            page
        }, testInfo) => {
            await openExample(page, example.previewPath);

            const scroller = page.getByRole("table").locator("..");
            await expect(page.getByRole("row").nth(3)).toBeVisible();

            const coverage = scroller.evaluate(
                element =>
                    new Promise<{
                        allowedGap: number;
                        baselineGap: number;
                        largestGap: number;
                    }>(resolve => {
                        let frames = 0;
                        const measureGap = () => {
                            const header = element.querySelector("thead");
                            const footer = element.querySelector("tfoot");
                            const rows = [
                                ...element.querySelectorAll(
                                    "tbody > tr:not([aria-hidden])"
                                )
                            ];
                            if (!header || !footer || rows.length === 0) {
                                return Number.POSITIVE_INFINITY;
                            }

                            const contentStart =
                                header.getBoundingClientRect().bottom;
                            const contentEnd =
                                footer.getBoundingClientRect().top;
                            let coveredUntil = contentStart;
                            let gap = 0;
                            for (const row of rows) {
                                const rect = row.getBoundingClientRect();
                                if (
                                    rect.bottom <= contentStart ||
                                    rect.top >= contentEnd
                                )
                                    continue;
                                gap = Math.max(gap, rect.top - coveredUntil);
                                coveredUntil = Math.max(
                                    coveredUntil,
                                    rect.bottom
                                );
                            }
                            return Math.max(gap, contentEnd - coveredUntil);
                        };
                        const baselineGap = measureGap();
                        const allowedGap = Math.max(
                            1,
                            ...[
                                ...element.querySelectorAll(
                                    "tbody > tr:not([aria-hidden])"
                                )
                            ].map(row => row.getBoundingClientRect().height)
                        );
                        let largestGap = baselineGap;
                        const sample = () => {
                            largestGap = Math.max(largestGap, measureGap());

                            if (++frames === 60)
                                resolve({
                                    allowedGap,
                                    baselineGap,
                                    largestGap
                                });
                            else requestAnimationFrame(sample);
                        };
                        requestAnimationFrame(sample);
                    })
            );

            if (testInfo.project.name === "mobile-safari") {
                // Playwright cannot synthesize mouse-wheel input in mobile
                // WebKit. Exercise the same native scroll-event path directly.
                await scroller.evaluate(async element => {
                    for (let step = 0; step < 12; step++) {
                        element.scrollTop += 4_000;
                        // oxlint-disable-next-line eslint/no-await-in-loop -- Preserve the sequence of native scroll positions.
                        await new Promise<void>(resolve => {
                            requestAnimationFrame(() => resolve());
                        });
                    }
                });
            } else {
                for (let step = 0; step < 12; step++) {
                    // oxlint-disable-next-line eslint/no-await-in-loop -- Each wheel event advances the same native scrolling transaction.
                    await page.mouse.wheel(0, 4_000);
                }
            }

            const { allowedGap, baselineGap, largestGap } = await coverage;
            // A partially visible boundary row can leave at most one row of
            // uncovered space. The regression leaves several hundred pixels.
            expect(largestGap).toBeLessThanOrEqual(baselineGap + allowedGap);
        });

        test("keeps the scrollbar thumb synchronized across repeated drags", async ({
            page
        }) => {
            requireNativeScrollbarPointer();
            await openExample(page, example.previewPath);

            const scroller = page.getByRole("table").locator("..");
            const scrollbar = await getVerticalScrollbarGeometry(scroller);
            // Stay below Chromium's scrollbar arrow/track area so the pointer
            // lands on the initial thumb, as a real drag would.
            const getScrollRatio = () =>
                scroller.evaluate(
                    element =>
                        element.scrollTop /
                        (element.scrollHeight - element.clientHeight)
                );

            await withHeldPointer(
                page,
                scrollbar.x,
                scrollbar.start,
                async () => {
                    // oxlint-disable eslint/no-await-in-loop -- Sequential pointer frames reproduce one continuous physical thumb drag.
                    for (let iteration = 0; iteration < 4; iteration++) {
                        await movePointerVertically(
                            page,
                            scrollbar.x,
                            scrollbar.start,
                            scrollbar.bottom,
                            24,
                            16
                        );
                        await expect.poll(getScrollRatio).toBeGreaterThan(0.98);

                        await movePointerVertically(
                            page,
                            scrollbar.x,
                            scrollbar.bottom,
                            scrollbar.start,
                            24,
                            16
                        );
                        await expect.poll(getScrollRatio).toBeLessThan(0.02);
                    }
                    // oxlint-enable eslint/no-await-in-loop
                }
            );
        });
    }
});
