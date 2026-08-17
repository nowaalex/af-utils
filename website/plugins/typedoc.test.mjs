import assert from "node:assert/strict";
import { test } from "node:test";

import { stripHtml } from "./typedoc.mjs";

test("strips complete HTML tags without removing their text", () => {
    assert.equal(
        stripHtml("Before <strong>safe</strong> after"),
        "Before safe after"
    );
});

test("preserves plain comparisons and unmatched angle brackets", () => {
    assert.equal(stripHtml("Uses x < limit"), "Uses x < limit");
    assert.equal(stripHtml("Keep <unfinished"), "Keep <unfinished");
});

test("does not let nested tags reconstruct an executable tag", () => {
    const stripped = stripHtml("<scr<script>ipt>alert(1)</scr<script>ipt>");

    assert.equal(stripped, "&lt;script>alert(1)&lt;/script>");
    assert.equal(stripped.includes("<script"), false);

    for (const value of ["<<x>script>", "<<x>img src=x onerror=alert(1)>"]) {
        const result = stripHtml(value);
        assert.equal(result.includes("<script"), false);
        assert.equal(result.includes("<img"), false);
    }
});

test("handles a large delimiter-only input without suffix rescans", () => {
    const value = "<".repeat(250_000);
    const stripped = stripHtml(value);

    assert.equal(stripped.replaceAll("&lt;", ""), "<");
});
