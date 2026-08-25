import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { chromium } from "@playwright/test";

const require = createRequire(import.meta.url);
const manifestPath = require.resolve("@lhci/cli/package.json");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const cliPath = resolve(dirname(manifestPath), manifest.bin.lhci);

execFileSync(
    process.execPath,
    [cliPath, "autorun", "--config=lighthouserc.json"],
    {
        stdio: "inherit",
        env: { ...process.env, CHROME_PATH: chromium.executablePath() }
    }
);
