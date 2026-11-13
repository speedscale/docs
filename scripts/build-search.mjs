import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { load } from "cheerio";
import { createIndex, close } from "pagefind";

export async function buildSearch(buildDir = "build") {
  const root = path.resolve(buildDir);
  const home = load(await fs.readFile(path.join(root, "index.html"), "utf8"));
  const base = new URL(home('link[rel="canonical"]').attr("href")).pathname;
  const sitemap = load(
    await fs.readFile(path.join(root, "sitemap.xml"), "utf8"),
    { xmlMode: true },
  );
  const urls = sitemap("url > loc")
    .map((_, element) => sitemap(element).text())
    .get();
  if (!urls.length) throw new Error("The docs sitemap has no URLs");
  const { index, errors } = await createIndex({
    excludeSelectors: [
      ".theme-doc-breadcrumbs",
      ".theme-doc-toc-mobile",
      ".theme-doc-footer",
      ".pagination-nav",
    ],
  });
  if (!index || errors.length) throw new Error(errors.join("\n"));
  const indexed = [];
  try {
    for (const location of urls) {
      const url = new URL(location);
      if (!url.pathname.startsWith(base))
        throw new Error(`URL outside docs base: ${location}`);
      const relative = decodeURIComponent(url.pathname.slice(base.length));
      const filename = path.resolve(
        root,
        relative.endsWith("/") || !relative
          ? relative + "index.html"
          : relative,
      );
      if (!filename.startsWith(root + path.sep))
        throw new Error(`URL outside build directory: ${location}`);
      const $ = load(await fs.readFile(filename, "utf8"));
      if (
        $('meta[http-equiv="refresh" i]').length ||
        /noindex/i.test($('meta[name="robots"]').attr("content") || "")
      ) {
        throw new Error(`Non-indexable URL in docs sitemap: ${location}`);
      }
      const main = $("main").first();
      if (!main.length || !main.text().trim())
        throw new Error(`No main content: ${location}`);
      main
        .attr("data-pagefind-body", "")
        .attr("data-pagefind-filter", "section:Docs");
      const result = await index.addHTMLFile({
        url: "/" + relative,
        content: $.html(),
      });
      if (result.errors.length || !result.file)
        throw new Error(
          `Could not index ${location}: ${result.errors.join("; ")}`,
        );
      indexed.push(location);
    }
    const output = await index.writeFiles({
      outputPath: path.join(root, "pagefind"),
    });
    if (output.errors.length) throw new Error(output.errors.join("\n"));
    console.log(
      `Pagefind indexed all ${indexed.length} docs sitemap URLs; redirects and Markdown mirrors excluded.`,
    );
    return indexed;
  } finally {
    await close();
  }
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  await buildSearch(process.argv[2]);
}
