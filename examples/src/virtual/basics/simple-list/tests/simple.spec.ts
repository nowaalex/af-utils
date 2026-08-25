import {
    describeExample,
    expect,
    openExample,
    type Page,
    test
} from "../../../../e2e";
import { exampleFrameworks } from "../../../../../config";

const adapterFrameworks = exampleFrameworks.filter(
    framework => framework !== "core"
);

const expectVirtualList = async (page: Page, path: string) => {
    await openExample(page, path);

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

await describeExample("virtual/basics/simple-list", example => {
    test("renders and scrolls a large virtual list", async ({ page }) => {
        await expectVirtualList(page, example.previewPath);
    });

    test("shows and separates the framework implementation navigation", async ({
        page
    }) => {
        await page.goto(example.documentationPath);
        const navigation = page.getByRole("navigation", {
            name: "Framework implementation"
        });
        const entries = navigation.locator(":scope > ul > li");
        await expect(navigation).toBeVisible();
        await expect(navigation.getByRole("link")).toHaveCount(
            adapterFrameworks.length
        );
        await expect(entries).toHaveCount(adapterFrameworks.length);
        await Promise.all(
            adapterFrameworks
                .slice(0, -1)
                .map((_, index) =>
                    expect(entries.nth(index)).toHaveCSS(
                        "border-right-width",
                        "1px"
                    )
                )
        );
        await expect(entries.last()).toHaveCSS("border-right-width", "0px");
        await expect(
            navigation.getByRole("link", {
                name: new RegExp(`^${example.framework}$`, "iu")
            })
        ).toHaveAttribute("aria-current", "page");
    });
});
