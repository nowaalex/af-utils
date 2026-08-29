import {
    describeExample,
    expect,
    getVirtualItemCount,
    openExample,
    test
} from "../../../../e2e";

const MAX_SCROLL_END_ERROR_PX = 0.5;

await describeExample("virtual/basics/horizontal", example => {
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
                    return Number(
                        rendered.at(-1)?.getAttribute("aria-posinset")
                    );
                })
            )
            .toBe(itemCount);

        const endOffset = await list.evaluate(
            element =>
                element.scrollWidth - element.clientWidth - element.scrollLeft
        );
        expect(Math.abs(endOffset)).toBeLessThanOrEqual(
            MAX_SCROLL_END_ERROR_PX
        );
    });
});
