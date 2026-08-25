import { spawn } from "node:child_process";
import { once } from "node:events";
import { createServer } from "node:net";
import { fileURLToPath } from "node:url";
import { resolvePackageBin } from "../../website/package-bin.mjs";
import { expect, test } from "../src/e2e/fixture";

const websiteRoot = fileURLToPath(new URL("../../website", import.meta.url));
const DEVELOPMENT_SERVER_TEST_TIMEOUT_MS = 90_000;

const getAvailablePort = () =>
    new Promise<number>((resolve, reject) => {
        const server = createServer();
        server.on("error", reject);
        server.listen(0, "127.0.0.1", () => {
            const address = server.address();
            if (!address || typeof address === "string") {
                server.close();
                reject(new Error("Expected an ephemeral TCP port"));
                return;
            }
            server.close(error => {
                if (error) reject(error);
                else resolve(address.port);
            });
        });
    });

test("shows a static search placeholder without Pagefind requests in development", async ({
    browserName,
    page
}) => {
    test.setTimeout(DEVELOPMENT_SERVER_TEST_TIMEOUT_MS);
    test.skip(browserName !== "chromium", "One dev-server check is sufficient");

    const port = await getAvailablePort();
    const origin = `http://127.0.0.1:${port}`;
    const server = spawn(
        process.execPath,
        [
            resolvePackageBin("astro", "astro"),
            "dev",
            "--ignore-lock",
            "--host",
            "127.0.0.1",
            "--port",
            String(port)
        ],
        {
            cwd: websiteRoot,
            env: {
                ...process.env,
                // Defining this opts out of Astro's agent auto-background mode.
                ASTRO_DEV_BACKGROUND: "0"
            },
            stdio: "pipe"
        }
    );
    let serverOutput = "";
    server.stdout.on("data", chunk => {
        serverOutput += String(chunk);
    });
    server.stderr.on("data", chunk => {
        serverOutput += String(chunk);
    });

    try {
        await expect
            .poll(
                () =>
                    fetch(`${origin}/virtual`).then(
                        response => response.ok,
                        () => false
                    ),
                { timeout: 60_000 }
            )
            .toBe(true);

        const pagefindRequests: string[] = [];
        page.on("request", request => {
            if (request.url().includes("/pagefind/")) {
                pagefindRequests.push(request.url());
            }
        });
        await page.goto(`${origin}/virtual`);
        await page.waitForLoadState("networkidle");

        await expect(page.locator("[data-pagefind-placeholder]")).toContainText(
            "Search is available in the production preview"
        );
        await expect(page.locator("pagefind-searchbox")).toHaveCount(0);
        expect(pagefindRequests).toEqual([]);
    } catch (error) {
        throw new Error(`Astro development server output:\n${serverOutput}`, {
            cause: error
        });
    } finally {
        server.kill("SIGTERM");
        await Promise.race([
            once(server, "exit"),
            new Promise(resolve => {
                setTimeout(resolve, 5_000);
            })
        ]);
    }
});
