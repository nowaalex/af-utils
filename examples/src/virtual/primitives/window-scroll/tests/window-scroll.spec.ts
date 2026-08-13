import {
    describeExample,
    expect,
    getVirtualItemCount,
    openExample,
    test
} from "../../../../e2e";

await describeExample("virtual/primitives/window-scroll", example => {
    test("uses the window viewport to virtualize through the final row", async ({
        page
    }) => {
        await openExample(page, example.previewPath);

        const items = page.getByRole("listitem");
        await expect(items.first()).toBeVisible();
        const itemCount = await getVirtualItemCount(items);
        expect(await items.count()).toBeLessThan(100);

        await page.evaluate(() => {
            globalThis.scrollTo(0, document.documentElement.scrollHeight);
        });

        await expect
            .poll(async () => ({
                ...(await page.evaluate(() => ({
                    endOffset: Math.max(
                        0,
                        document.documentElement.scrollHeight -
                            globalThis.innerHeight -
                            globalThis.scrollY
                    ),
                    windowScrolled: globalThis.scrollY > 0
                }))),
                lastPosition: Number(
                    await items.last().getAttribute("aria-posinset")
                )
            }))
            .toEqual({
                endOffset: 0,
                lastPosition: itemCount,
                windowScrolled: true
            });
    });
});
