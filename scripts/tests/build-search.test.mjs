import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { buildSearch } from "../build-search.mjs";

test("indexes canonical sitemap pages under a preview base and excludes aliases and Markdown", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "docs-search-"));
  try {
    await fs.mkdir(path.join(dir, "guide"));
    await fs.writeFile(
      path.join(dir, "index.html"),
      '<html lang="en"><head><title>Docs</title><link rel="canonical" href="https://docs.speedscale.com/pr-123/"></head><body><nav>Navigation junk</nav><main><h1>Docs</h1><p>Capture real traffic.</p></main></body></html>',
    );
    await fs.writeFile(
      path.join(dir, "guide/index.html"),
      '<html lang="en"><head><title>Guide</title></head><body><main><h1>Guide</h1><h2 id="record">Record traffic</h2><p>Replay captured API requests.</p></main></body></html>',
    );
    await fs.writeFile(
      path.join(dir, "alias.html"),
      '<meta http-equiv="refresh" content="0;url=guide/">',
    );
    await fs.writeFile(path.join(dir, "guide/index.md"), "Markdown mirror");
    const expected = [
      "https://docs.speedscale.com/pr-123/",
      "https://docs.speedscale.com/pr-123/guide/",
    ];
    await fs.writeFile(
      path.join(dir, "sitemap.xml"),
      "<urlset>" +
        expected.map((url) => `<url><loc>${url}</loc></url>`).join("") +
        "</urlset>",
    );
    assert.deepEqual(await buildSearch(dir), expected);
    const entry = JSON.parse(
      await fs.readFile(path.join(dir, "pagefind/pagefind-entry.json"), "utf8"),
    );
    assert.equal(entry.version, "1.5.2");
    assert.equal(entry.languages.en.page_count, 2);
    await assert.rejects(fs.access(path.join(dir, "pagefind/alias.html")));
    await fs.writeFile(
      path.join(dir, "guide/index.html"),
      '<html><head><meta name="robots" content="noindex"></head><body><main>Unpublished</main></body></html>',
    );
    await assert.rejects(buildSearch(dir), /Non-indexable URL/);
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
});
