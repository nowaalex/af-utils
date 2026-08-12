import { describeExample, expect, test } from "../../../../e2e";

await describeExample("virtual/primitives/custom-render", example => {
    test("loads CSS modules through the Astro integration", async ({
        page
    }) => {
        const pageErrors: string[] = [];
        page.on("pageerror", error => pageErrors.push(error.message));

        const response = await page.goto(example.documentationPath);
        const preview = page.frameLocator('iframe[src^="/examples/"]');

        expect(response?.ok()).toBe(true);
        await expect(preview.getByRole("table")).toBeVisible();
        expect(pageErrors).toEqual([]);
    });
});
