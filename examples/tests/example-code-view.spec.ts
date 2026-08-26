import { expect, test } from "../src/e2e";

test("example files are links that still select source inline", async ({
    page
}) => {
    await page.goto("/virtual/examples/react/basics/simple-list");

    const fileLinks = page.locator("[data-file-tree-item]");
    const initialFile = fileLinks.first();
    const packageFile = page.getByRole("link", {
        name: "package.json",
        exact: true
    });
    const documentationUrl = page.url();

    await expect(fileLinks).not.toHaveCount(0);
    await expect(initialFile).toHaveAttribute("href", /^\/example-source\//u);
    await expect(initialFile).toHaveAttribute("data-astro-reload", "");
    await expect(initialFile).not.toHaveAttribute("data-astro-prefetch");
    await expect(initialFile).toHaveAttribute("aria-current", "true");

    await packageFile.click();

    await expect(page).toHaveURL(documentationUrl);
    await expect(packageFile).toHaveAttribute("aria-current", "true");
    await expect(initialFile).not.toHaveAttribute("aria-current");
    await expect(
        page
            .getByRole("region", { name: "Example source code" })
            .getByRole("code")
    ).toContainText('"name"');
});

test("keyboard activation follows the source link", async ({ page }) => {
    await page.goto("/virtual/examples/react/basics/simple-list");

    const packageFile = page.getByRole("link", {
        name: "package.json",
        exact: true
    });
    const sourcePath = await packageFile.getAttribute("href");
    if (!sourcePath) throw new Error("Expected a source link href");
    const sourceUrl = new URL(sourcePath, page.url()).toString();

    await packageFile.focus();
    await Promise.all([
        page.waitForURL(sourceUrl),
        page.keyboard.press("Enter")
    ]);

    await expect(page).toHaveURL(sourceUrl);
    await expect(page.getByRole("code")).toContainText('"name"');
});

test("modified and non-primary clicks retain native link behavior", async ({
    page
}) => {
    await page.goto("/virtual/examples/react/basics/simple-list");

    const packageFile = page.getByRole("link", {
        name: "package.json",
        exact: true
    });
    const preventedStates = await packageFile.evaluate(file => {
        const dispatchClick = (init: PointerEventInit) => {
            let defaultPrevented = true;
            document.addEventListener(
                "click",
                event => {
                    defaultPrevented = event.defaultPrevented;
                    event.preventDefault();
                },
                { once: true }
            );
            file.dispatchEvent(
                new PointerEvent("click", {
                    bubbles: true,
                    cancelable: true,
                    detail: 1,
                    pointerType: "mouse",
                    ...init
                })
            );
            return defaultPrevented;
        };

        return [
            dispatchClick({ button: 0, ctrlKey: true }),
            dispatchClick({ button: 1 })
        ];
    });

    expect(preventedStates).toEqual([false, false]);
    await expect(packageFile).not.toHaveAttribute("aria-current");
});
