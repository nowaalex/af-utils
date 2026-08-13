import { expect, test } from "../src/e2e";

test("opens and closes the main navigation on a narrow viewport", async ({
    page
}) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/virtual/reference/index/");

    const navigation = page.getByRole("navigation", {
        name: "Main navigation"
    });
    const opener = page.getByRole("button", {
        name: "Open navigation menu"
    });
    const closer = page.getByRole("button", {
        name: "Close navigation menu"
    });

    await expect(opener).toBeVisible();
    await expect(opener).toHaveAttribute("aria-expanded", "false");
    await expect(navigation).not.toBeInViewport();

    await opener.click();

    await expect(navigation).toBeInViewport();
    await expect(closer).toBeVisible();
    await expect(closer).toHaveAttribute("aria-expanded", "true");

    await closer.click();

    await expect(navigation).not.toBeInViewport();
    await expect(opener).toBeVisible();
    await expect(opener).toHaveAttribute("aria-expanded", "false");
});
