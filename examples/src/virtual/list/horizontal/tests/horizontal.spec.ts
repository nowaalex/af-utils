import {
    describeExample,
    expect,
    getVirtualItemCount,
    openExample,
    test
} from "../../../../e2e";

await describeExample("virtual/list/horizontal", example => {
    test("virtualizes columns and reaches the horizontal end", async ({
        page
    }) => {
        await openExample(page, example.previewPath);

        const list = page.getByRole("list", {
            name: "Horizontal virtual list"
        });
        const items = page.getByRole("listitem");
        await expect(items.first()).toBeVisible();
        const itemCount = await getVirtualItemCount(items);
        expect(await items.count()).toBeLessThan(100);
        await expect(items.first()).toHaveAttribute("aria-posinset", "1");

        await list.evaluate(element => {
            element.scrollLeft = element.scrollWidth;
        });

        await expect
            .poll(() =>
                list.evaluate(element => {
                    const rendered = [
                        ...element.querySelectorAll('[role="listitem"]')
                    ];
                    const lastItem = rendered.at(-1);
                    return {
                        endOffset:
                            element.scrollWidth -
                            element.clientWidth -
                            element.scrollLeft,
                        lastPosition: Number(
                            lastItem?.getAttribute("aria-posinset")
                        )
                    };
                })
            )
            .toEqual({
                endOffset: 0,
                lastPosition: itemCount
            });
    });
});
