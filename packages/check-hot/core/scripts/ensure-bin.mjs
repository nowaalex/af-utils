import { chmod, copyFile, mkdir } from "node:fs/promises";

await chmod(new URL("../dist/cli.js", import.meta.url), 0o755);
await mkdir(new URL("../dist/runtime/", import.meta.url), { recursive: true });
await copyFile(
    new URL("../src/runtime/bunfig.toml", import.meta.url),
    new URL("../dist/runtime/bunfig.toml", import.meta.url)
);
