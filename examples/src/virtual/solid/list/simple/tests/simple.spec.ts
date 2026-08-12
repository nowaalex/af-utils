import { expect, type Page, test } from "@playwright/test";

const expectVirtualList = async (page: Page, url: string) => {
    await page.goto(url);

    const list = page.getByRole("list", { name: "Solid virtual list" });
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

test("renders and scrolls a large Solid virtual list", async ({ page }) => {
    await expectVirtualList(page, "http://127.0.0.1:4182");
});

test("hydrates the Solid virtual list in Astro", async ({ page }) => {
    await expectVirtualList(
        page,
        "http://127.0.0.1:4179/examples/virtual/solid/list/simple"
    );
});

test("shows framework examples in an accordion", async ({ page }) => {
    await page.goto("http://127.0.0.1:4179/virtual/examples/solid/list/simple");

    const solidHeading = page.getByRole("heading", {
        name: "Solid",
        exact: true
    });
    const solidDetails = solidHeading.locator("../..");

    await expect(solidDetails).toHaveAttribute("open", "");
    await solidHeading.locator("..").click();
    await expect(solidDetails).not.toHaveAttribute("open", "");
});
