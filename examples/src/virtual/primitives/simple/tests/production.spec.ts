import {
    describeExample,
    expect,
    getVirtualItemCount,
    openExample,
    test
} from "../../../../e2e";

await describeExample("virtual/primitives/simple", example => {
    test("runs from the production Astro bundle", async ({ page }) => {
        await openExample(page, example.previewPath);

        const list = page.getByRole("list", {
            name: "Simple primitives list"
        });
        const items = page.getByRole("listitem");
        await expect(items.first()).toBeVisible();

        const itemCount = await getVirtualItemCount(items);

        await list.evaluate(element => {
            element.scrollTop = element.scrollHeight;
        });

        await expect
            .poll(() =>
                list.evaluate(element => {
                    const rendered =
                        element.querySelectorAll('[role="listitem"]');
                    const lastItem = rendered.item(rendered.length - 1);

                    return {
                        endOffset:
                            element.scrollHeight -
                            element.clientHeight -
                            element.scrollTop,
                        lastPosition: Number(
                            lastItem?.getAttribute("aria-posinset")
                        )
                    };
                })
            )
            .toEqual({ endOffset: 0, lastPosition: itemCount });
    });
});
