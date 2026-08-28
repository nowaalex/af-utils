import { expect, test } from "../../../e2e/fixture";
import { openExample } from "../../../e2e/examples";

test.beforeEach(async ({ page }) => {
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
});

test("dispatches scrollend through the fallback after scroll becomes idle", async ({
    page
}) => {
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

test("waits for the active touch gesture to end", async ({ page }) => {
    const dispatchCounts = await page
        .getByTestId("scrollend-scroller")
        .evaluate(async element => {
            let count = 0;
            element.addEventListener("scrollend", () => count++);

            const touchStart = new Event("touchstart");
            Object.defineProperty(touchStart, "changedTouches", {
                value: [{ identifier: 1 }]
            });
            window.dispatchEvent(touchStart);
            element.dispatchEvent(new Event("scroll"));
            await new Promise(resolve => {
                setTimeout(resolve, 150);
            });
            const whileTouching = count;

            const touchEnd = new Event("touchend");
            Object.defineProperty(touchEnd, "changedTouches", {
                value: [{ identifier: 1 }]
            });
            window.dispatchEvent(touchEnd);
            return { afterTouchEnd: count, whileTouching };
        });

    expect(dispatchCounts).toEqual({ afterTouchEnd: 1, whileTouching: 0 });
});
