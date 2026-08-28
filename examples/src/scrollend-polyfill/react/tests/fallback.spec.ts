import { expect, test } from "../../../e2e/fixture";
import { openExample } from "../../../e2e/examples";

test("dispatches scrollend through the fallback after scroll becomes idle", async ({
    page
}) => {
    await page.addInitScript(() => {
        const visited = new Set<object>();
        for (const value of [window, document, document.documentElement]) {
            let current: object | null = value;
            while (current && !visited.has(current)) {
                visited.add(current);
                Reflect.deleteProperty(current, "onscrollend");
                current = Object.getPrototypeOf(current);
            }
        }
    });
    await openExample(page, "/examples/scrollend-polyfill/react");
    expect(await page.evaluate(() => "onscrollend" in window)).toBe(false);

    const eventType = await page.getByTestId("scrollend-scroller").evaluate(
        element =>
            new Promise<string>((resolve, reject) => {
                const timeout = setTimeout(
                    () => reject(new Error("scrollend was not dispatched")),
                    1_000
                );
                element.addEventListener(
                    "scrollend",
                    event => {
                        clearTimeout(timeout);
                        resolve(event.type);
                    },
                    { once: true }
                );
                element.dispatchEvent(new Event("scroll"));
            })
    );

    expect(eventType).toBe("scrollend");
});
