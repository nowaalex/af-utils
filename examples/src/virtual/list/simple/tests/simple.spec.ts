import {
    describeExample,
    expect,
    type Page,
    test,
    waitForExampleHydration
} from "../../../../e2e";

const expectVirtualList = async (page: Page, path: string) => {
    await page.goto(path);
    await waitForExampleHydration(page);

    const list = page.getByRole("list", { name: "Simple virtual list" });
    const items = page.getByRole("listitem");
    await expect(items.first()).toBeVisible();
    expect(await items.count()).toBeLessThan(100);

    await list.evaluate(element => {
        element.scrollTop = 1_000_000;
    });

    await expect
        .poll(() => items.first().getAttribute("aria-posinset").then(Number))
        .toBeGreaterThan(1_000);
};

await describeExample("virtual/list/simple", example => {
    test("renders and scrolls a large virtual list", async ({ page }) => {
        await expectVirtualList(page, example.previewPath);
    });

    test("links to the other framework implementation", async ({ page }) => {
        await page.goto(example.documentationPath);
        await expect(page.getByText("Available also for")).toBeVisible();
    });
});
