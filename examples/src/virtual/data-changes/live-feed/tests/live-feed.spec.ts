import { describeExample, expect, openExample, test } from "../../../../e2e";
import { exampleFrameworks } from "../../../../../config";

await describeExample(
    "virtual/data-changes/live-feed",
    example => {
        test("anchors new messages only while the reader is at the end", async ({
            page
        }) => {
            await openExample(page, example.previewPath);
            const list = page.getByRole("list", { name: "Live message feed" });
            const items = page.getByRole("listitem");
            await expect
                .poll(() =>
                    items.last().getAttribute("aria-posinset").then(Number)
                )
                .toBe(200);

            await page.getByRole("button", { name: "Append message" }).click();
            await expect(page.getByRole("status")).toHaveText("201 messages");
            await expect
                .poll(() =>
                    items.last().getAttribute("aria-posinset").then(Number)
                )
                .toBe(201);

            // Let the instant scroll-to-index measurement corrections settle
            // before emulating the reader's next native scroll position.
            await page.waitForTimeout(100);
            await list.evaluate(element => {
                element.scrollTop = 0;
            });
            await expect
                .poll(() =>
                    items.first().getAttribute("aria-posinset").then(Number)
                )
                .toBe(1);
            await page.getByRole("button", { name: "Append message" }).click();
            await expect(page.getByRole("status")).toHaveText("202 messages");
            await expect
                .poll(() =>
                    items.first().getAttribute("aria-posinset").then(Number)
                )
                .toBe(1);

            await page.getByRole("button", { name: "Jump to latest" }).click();
            await expect
                .poll(() =>
                    items.last().getAttribute("aria-posinset").then(Number)
                )
                .toBe(202);
        });
    },
    exampleFrameworks
);
