/**
 * check-redirects.mjs
 *
 * Validates that any deleted or renamed documentation files under docs/
 * have corresponding redirect entries in docusaurus.config.js.
 *
 * Usage:
 *   node scripts/check-redirects.mjs                          # staged changes vs HEAD
 *   node scripts/check-redirects.mjs origin/main              # CI: HEAD vs base branch
 *
 * Exits with code 1 if any missing redirects are found.
 */

import { readFileSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";
import path from "node:path";
import { cwd } from "node:process";

const WORK_DIR = cwd();
const CONFIG_FILE = path.resolve(WORK_DIR, "docusaurus.config.js");

// ── helpers ────────────────────────────────────────────

/** Convert a file path under `docs/` to its Docusaurus URL path */
function docPathToUrl(docPath) {
  let relative = docPath.replace("docs/", "");
  relative = relative.replace(/\.(md|mdx)$/, "");
  relative = relative.replace(/\/index$/, "");
  return `/${relative}/`.replace(/\/+/g, "/");
}

/** Parse redirect entries from docusaurus.config.js */
function parseRedirects(configContent) {
  const redirects = [];
  const redirectRegex =
    /\{\s*from\s*:\s*["']([^"']+)["']\s*,\s*to\s*:\s*["']([^"']+)["']\s*,?\s*\}/g;
  let match;
  while ((match = redirectRegex.exec(configContent)) !== null) {
    redirects.push({ from: match[1], to: match[2] });
  }
  return redirects;
}

/** Get changed files by diff-filter status */
function getChangedFiles(filter, baseRef) {
  const args = baseRef
    ? `git diff --diff-filter=${filter} --name-only HEAD...${baseRef}`
    : `git diff --diff-filter=${filter} --name-only --cached`;
  try {
    const files = execSync(args, { cwd: WORK_DIR, encoding: "utf-8" })
      .trim()
      .split("\n")
      .filter(Boolean);
    return files;
  } catch {
    return [];
  }
}

// ── main ───────────────────────────────────────────────

const baseRef = process.argv[2]; // e.g., "origin/main" for CI

const deletedFiles = getChangedFiles("D", baseRef);
const addedFiles = getChangedFiles("A", baseRef);
const renamedFiles = getChangedFiles("R", baseRef);

function findManualRenames(deleted, added) {
  const renames = [];
  for (const del of deleted) {
    const delBase = path.basename(del);
    for (const add of added) {
      const addBase = path.basename(add);
      if (delBase === addBase && del !== add) {
        renames.push({ from: del, to: add });
      }
    }
  }
  return renames;
}

const manualRenames = findManualRenames(deletedFiles, addedFiles);

const deletedDocs = deletedFiles.filter(
  (f) => f.startsWith("docs/") && /\.(md|mdx)$/.test(f),
);

if (!existsSync(CONFIG_FILE)) {
  console.error("❌ docusaurus.config.js not found");
  process.exit(1);
}
const configContent = readFileSync(CONFIG_FILE, "utf-8");
const redirects = parseRedirects(configContent);
const redirectFromPaths = new Set(redirects.map((r) => r.from));

let errors = 0;

for (const docFile of deletedDocs) {
  const url = docPathToUrl(docFile);
  if (!redirectFromPaths.has(url)) {
    console.error(
      `❌ Missing redirect for deleted doc: ${docFile} → URL ${url}`,
    );
    console.error(
      `   Add a redirect entry to docusaurus.config.js:\n   { from: "${url}", to: "/target-path/" }`,
    );
    errors++;
  }
}

for (const { from, to } of manualRenames) {
  if (!from.startsWith("docs/") || !to.startsWith("docs/")) continue;
  if (!/\.(md|mdx)$/.test(from)) continue;
  const fromUrl = docPathToUrl(from);
  if (!redirectFromPaths.has(fromUrl)) {
    console.error(`❌ Missing redirect for renamed doc: ${from} → ${to}`);
    console.error(
      `   Expected redirect: { from: "${fromUrl}", to: "${docPathToUrl(to)}" }`,
    );
    errors++;
  }
}

if (errors > 0) {
  console.error(
    `\n${errors} missing redirect(s) found. Add them to the redirects array in docusaurus.config.js.`,
  );
  process.exit(1);
} else {
  console.log("✅ All deleted/renamed docs have corresponding redirects.");
}
