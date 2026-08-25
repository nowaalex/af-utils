import { describeExample, expect, openExample, test } from "../../../../e2e";
import { exampleFrameworks } from "../../../../../config";

await describeExample(
    "virtual/integrations/tanstack-table",
    example => {
        test("virtualizes TanStack sorting and filtering row models", async ({
            page
        }) => {
            await openExample(page, example.previewPath);
            const rows = page
                .getByRole("row")
                .filter({ has: page.getByRole("cell") });
            await expect(rows.first()).toContainText("Person 09999");
            expect(await rows.count()).toBeLessThan(100);

            await page.getByRole("button", { name: "Sort by Name" }).click();
            await expect(rows.first()).toContainText("Person 00000");

            await page.getByLabel("Filter names").fill("Person 0004");
            await expect(page.getByRole("status")).toHaveText("10 rows");
            const retainedRow = page.locator('[data-row-id="P-09957"]');
            await expect(retainedRow).toContainText("Person 00042");
            await retainedRow.evaluate(element => {
                Reflect.set(element, "stableIdentityMarker", true);
            });

            await page.getByRole("button", { name: "Sort by Name" }).click();
            await expect(rows.first()).toContainText("Person 00049");
            expect(
                await retainedRow.evaluate(element =>
                    Reflect.get(element, "stableIdentityMarker")
                )
            ).toBe(true);

            await page.getByLabel("Filter names").fill("Person 00042");
            await expect(page.getByRole("status")).toHaveText("1 rows");
            await expect(rows).toHaveCount(1);
            await expect(rows.first()).toContainText("Person 00042");
        });
    },
    exampleFrameworks
);
