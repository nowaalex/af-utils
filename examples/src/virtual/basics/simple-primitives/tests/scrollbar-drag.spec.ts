import {
    describeExample,
    expect,
    getVerticalScrollbarGeometry,
    getVirtualItemCount,
    getVirtualListState,
    openExample,
    requireNativeScrollbarPointer,
    test,
    withHeldPointer
} from "../../../../e2e";

const simpleExamples = [
    ["virtual/basics/simple-list", "Simple virtual list"],
    ["virtual/basics/simple-primitives", "Simple primitives list"]
] as const;

await Promise.all(
    simpleExamples.map(([groupPath, accessibleName]) =>
        describeExample(groupPath, example => {
            test(`${accessibleName} fills the viewport and preserves the final item across scrollbar release`, async ({
                page
            }) => {
                requireNativeScrollbarPointer();
                await openExample(page, example.previewPath);

                const list = page.getByRole("list", { name: accessibleName });
                const items = page.getByRole("listitem");
                await expect(items.first()).toBeVisible();
                const itemCount = await getVirtualItemCount(items);
                const scrollbar = await getVerticalScrollbarGeometry(list);
                const isAtEnd = async () => {
                    const state = await getVirtualListState(list);
                    return (
                        state.firstGap === 0 &&
                        state.lastGap <= 1 &&
                        state.lastPosition === itemCount
                    );
                };

                await withHeldPointer(
                    page,
                    scrollbar.x,
                    scrollbar.start,
                    async () => {
                        await page.mouse.move(scrollbar.x, scrollbar.bottom, {
                            steps: 1
                        });
                        await expect.poll(isAtEnd).toBe(true);
                    }
                );

                await expect.poll(isAtEnd).toBe(true);
            });
        })
    )
);
