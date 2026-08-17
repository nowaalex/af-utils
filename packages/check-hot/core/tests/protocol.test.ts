import { spawnSync } from "node:child_process";

import { expect, test } from "vitest";

const protocolUrl = new URL("../src/protocol.ts", import.meta.url).href;

test("flushes a final backpressured protocol line before natural process exit", () => {
    const marker = "@@CHECK_HOT_PROTOCOL_CONTROL@@";
    const source = [
        `import { emitProtocolLine } from ${JSON.stringify(protocolUrl)};`,
        `await emitProtocolLine(${JSON.stringify(marker)} + "x".repeat(256 * 1024) + "\\n");`
    ].join("\n");

    for (let attempt = 0; attempt < 5; attempt++) {
        const child = spawnSync(
            process.execPath,
            ["--import=tsx", "--input-type=module", "--eval", source],
            { encoding: "utf8", maxBuffer: 1024 * 1024 }
        );
        expect(child.status, child.stderr).toBe(0);
        expect(child.stdout.startsWith(marker)).toBe(true);
        expect(child.stdout).toHaveLength(marker.length + 256 * 1024 + 1);
    }
});
