import {
    describeExample,
    expect,
    getVirtualItemCount,
    openExample,
    test
} from "../../../../e2e";

const simpleExamples = [
    ["virtual/basics/simple-list", "Simple virtual list"],
    ["virtual/basics/simple-primitives", "Simple primitives list"]
] as const;

await Promise.all(
    simpleExamples.map(([groupPath, accessibleName]) =>
        describeExample(groupPath, example => {
            test(`${accessibleName} runs from the production Astro bundle`, async ({
                page
            }) => {
                await openExample(page, example.previewPath);

                const list = page.getByRole("list", { name: accessibleName });
                const items = page.getByRole("listitem");
                await expect(items.first()).toBeVisible();

                const itemCount = await getVirtualItemCount(items);

                await list.evaluate(element => {
                    element.scrollTop = element.scrollHeight;
                });

                await expect
                    .poll(() =>
                        list.evaluate((element, expectedCount) => {
                            const rendered =
                                element.querySelectorAll('[role="listitem"]');
                            const lastItem = rendered.item(rendered.length - 1);
                            const endOffset =
                                element.scrollHeight -
                                element.clientHeight -
                                element.scrollTop;

                            return (
                                Math.abs(endOffset) <= 1 &&
                                Number(
                                    lastItem?.getAttribute("aria-posinset")
                                ) === expectedCount
                            );
                        }, itemCount)
                    )
                    .toBe(true);
            });
        })
    )
);
