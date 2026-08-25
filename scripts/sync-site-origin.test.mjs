import assert from "node:assert/strict";
import {
    mkdtempSync,
    readdirSync,
    readFileSync,
    rmSync,
    writeFileSync
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
    findUnexpectedSiteOrigins,
    normalizeSiteOrigin,
    replaceFileAtomically,
    rewriteSiteOrigins,
    synchronizeSiteOrigin
} from "./sync-site-origin.mjs";

const currentOrigin = JSON.parse(
    readFileSync(new URL("../site.config.json", import.meta.url), "utf8")
).origin;
const retiredOrigin = `https://${["af-utils", "com"].join(".")}`;

test("rewrites the configured previous origin without changing paths", () => {
    assert.equal(
        rewriteSiteOrigins(
            `See ${retiredOrigin}/virtual and https://example.com.`,
            currentOrigin
        ),
        `See ${currentOrigin}/virtual and https://example.com.`
    );
});

test("leaves synchronized and external URLs unchanged", () => {
    const content = `${currentOrigin}/virtual https://example.com/virtual`;
    assert.equal(rewriteSiteOrigins(content, currentOrigin), content);
    assert.deepEqual(findUnexpectedSiteOrigins(content, currentOrigin), []);
});

test("reports a retired af-utils origin", () => {
    assert.deepEqual(
        findUnexpectedSiteOrigins(`${retiredOrigin}/virtual`, currentOrigin),
        [retiredOrigin]
    );
});

test("accepts only a bare HTTPS origin", () => {
    assert.equal(normalizeSiteOrigin(currentOrigin), currentOrigin);
    assert.throws(() => normalizeSiteOrigin(`${currentOrigin}/`));
    assert.throws(() => normalizeSiteOrigin(`${currentOrigin}/virtual`));
    assert.throws(() =>
        normalizeSiteOrigin(currentOrigin.replace("https:", "http:"))
    );
});

test("a retry completes synchronization after a partial write failure", () => {
    const fixtureRoot = mkdtempSync(join(tmpdir(), "site-origin-sync-"));
    const firstPath = join(fixtureRoot, "a.md");
    const secondPath = join(fixtureRoot, "b.md");

    try {
        writeFileSync(
            join(fixtureRoot, "site.config.json"),
            JSON.stringify({ origin: currentOrigin })
        );
        writeFileSync(firstPath, `${retiredOrigin}/first`);
        writeFileSync(secondPath, `${retiredOrigin}/second`);

        let writes = 0;
        assert.throws(() =>
            synchronizeSiteOrigin({
                rootDirectory: fixtureRoot,
                replaceFile(path, content) {
                    writes += 1;
                    if (writes === 2) throw new Error("injected write failure");
                    replaceFileAtomically(path, content);
                }
            })
        );
        assert.equal(readFileSync(firstPath, "utf8"), `${currentOrigin}/first`);
        assert.equal(
            readFileSync(secondPath, "utf8"),
            `${retiredOrigin}/second`
        );

        synchronizeSiteOrigin({ rootDirectory: fixtureRoot });
        assert.equal(
            readFileSync(secondPath, "utf8"),
            `${currentOrigin}/second`
        );
    } finally {
        rmSync(fixtureRoot, { recursive: true, force: true });
    }
});

test("an atomic replacement preserves the source when rename fails", () => {
    const fixtureRoot = mkdtempSync(join(tmpdir(), "site-origin-atomic-"));
    const pagePath = join(fixtureRoot, "page.md");
    const original = `${retiredOrigin}/original`;

    try {
        writeFileSync(pagePath, original);
        assert.throws(() =>
            replaceFileAtomically(pagePath, `${currentOrigin}/replacement`, {
                renameFile() {
                    throw new Error("injected rename failure");
                }
            })
        );
        assert.equal(readFileSync(pagePath, "utf8"), original);
        assert.deepEqual(readdirSync(fixtureRoot), ["page.md"]);
    } finally {
        rmSync(fixtureRoot, { recursive: true, force: true });
    }
});
