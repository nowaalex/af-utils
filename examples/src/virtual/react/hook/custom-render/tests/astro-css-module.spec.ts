import { expect, test } from "@playwright/test";

test("loads React CSS modules with both Astro JSX integrations", async ({
    page
}) => {
    const pageErrors: string[] = [];
    page.on("pageerror", error => pageErrors.push(error.message));

    const response = await page.goto(
        "http://127.0.0.1:4179/virtual/examples/react/hook/custom-render"
    );
    const preview = page.frameLocator("iframe");

    expect(response?.ok()).toBe(true);
    await expect(preview.getByRole("table")).toBeVisible();
    expect(pageErrors).toEqual([]);
});
