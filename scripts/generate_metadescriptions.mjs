#!/usr/bin/env node
/**
 * Generate meta descriptions for docs pages missing them using OpenAI.
 *
 * Usage:
 *   node scripts/generate_metadescriptions.mjs [--dry-run] [--limit N]
 *
 * Options:
 *   --dry-run   Print descriptions to stdout without modifying files
 *   --limit N   Only process the first N files (useful for testing)
 *
 * Requires: OPENAI_API_KEY environment variable
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import OpenAI from "openai";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DOCS_DIR = path.resolve(__dirname, "../docs");
const DRY_RUN = process.argv.includes("--dry-run");
const LIMIT_IDX = process.argv.indexOf("--limit");
const LIMIT = LIMIT_IDX !== -1 ? parseInt(process.argv[LIMIT_IDX + 1], 10) : Infinity;

const openai = new OpenAI(); // uses OPENAI_API_KEY env var

// Recursively find all .md and .mdx files, excluding partials (_*.mdx)
function findMarkdownFiles(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findMarkdownFiles(fullPath));
    } else if (
      (entry.name.endsWith(".md") || entry.name.endsWith(".mdx")) &&
      !entry.name.startsWith("_")
    ) {
      results.push(fullPath);
    }
  }
  return results;
}

// Parse frontmatter from file content
function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return { hasFrontmatter: false, frontmatter: "", body: content };
  return {
    hasFrontmatter: true,
    frontmatter: match[1],
    body: content.slice(match[0].length),
  };
}

// Check if frontmatter already has a description
function hasDescription(frontmatter) {
  return /^description\s*:/m.test(frontmatter);
}

// Extract a title from frontmatter or first heading
function extractTitle(frontmatter, body) {
  const fmTitle = frontmatter.match(/^title\s*:\s*["']?(.+?)["']?\s*$/m);
  if (fmTitle) return fmTitle[1];
  const headingMatch = body.match(/^#\s+(.+)$/m);
  if (headingMatch) return headingMatch[1];
  return "Untitled";
}

// Strip markdown syntax to get plain text for the LLM
function stripMarkdown(text) {
  return text
    .replace(/^---\n[\s\S]*?\n---/m, "") // frontmatter
    .replace(/^import\s+.*$/gm, "") // import statements
    .replace(/<[^>]+>/g, "") // HTML/JSX tags
    .replace(/!\[.*?\]\(.*?\)/g, "") // images
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // links -> text
    .replace(/```[\s\S]*?```/g, "") // code blocks
    .replace(/`[^`]+`/g, "") // inline code
    .replace(/^#{1,6}\s+/gm, "") // headings markers
    .replace(/^\s*[-*+]\s+/gm, "") // list markers
    .replace(/^\s*\d+\.\s+/gm, "") // ordered list markers
    .replace(/^\s*>\s+/gm, "") // blockquotes
    .replace(/\*\*([^*]+)\*\*/g, "$1") // bold
    .replace(/\*([^*]+)\*/g, "$1") // italic
    .replace(/:::\w+/g, "") // admonitions
    .replace(/\n{3,}/g, "\n\n") // collapse whitespace
    .trim();
}

// Generate a meta description using OpenAI
async function generateDescription(title, plainText) {
  // Truncate to ~2000 chars to keep token usage reasonable
  const truncated = plainText.slice(0, 2000);

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.3,
    max_tokens: 100,
    messages: [
      {
        role: "system",
        content: `You write SEO meta descriptions for technical documentation pages. Rules:
- Exactly 1 sentence, 130-155 characters (hard limit)
- Start with an action verb or the main topic
- Include the product name "Speedscale" or "ProxyMock" when relevant
- Be specific about what the page covers
- No quotes, no markdown, no trailing period
- Write for developers searching for API testing, traffic replay, or mocking solutions`,
      },
      {
        role: "user",
        content: `Write a meta description for this docs page.\n\nTitle: ${title}\n\nContent:\n${truncated}`,
      },
    ],
  });

  return response.choices[0].message.content.trim().replace(/^["']|["']$/g, "");
}

// Insert description into frontmatter
function insertDescription(content, description) {
  const escaped = description.replace(/"/g, '\\"');
  const { hasFrontmatter, frontmatter } = parseFrontmatter(content);

  if (!hasFrontmatter) {
    return `---\ndescription: "${escaped}"\n---\n\n${content}`;
  }

  // Insert after title if present, otherwise at top of frontmatter
  if (/^title\s*:/m.test(frontmatter)) {
    const titleLineEnd = content.indexOf(
      "\n",
      content.indexOf("title:", content.indexOf("---"))
    );
    return (
      content.slice(0, titleLineEnd + 1) +
      `description: "${escaped}"\n` +
      content.slice(titleLineEnd + 1)
    );
  }

  // Insert after opening ---
  return content.replace("---\n", `---\ndescription: "${escaped}"\n`);
}

// Main
async function main() {
  const allFiles = findMarkdownFiles(DOCS_DIR);
  const filesToProcess = [];

  for (const filePath of allFiles) {
    const content = fs.readFileSync(filePath, "utf-8");
    const { hasFrontmatter, frontmatter } = parseFrontmatter(content);
    if (!hasDescription(hasFrontmatter ? frontmatter : "")) {
      filesToProcess.push(filePath);
    }
  }

  console.log(
    `Found ${filesToProcess.length} files missing descriptions (of ${allFiles.length} total)`
  );
  const toProcess = filesToProcess.slice(0, LIMIT);
  console.log(`Processing ${toProcess.length} files${DRY_RUN ? " (dry run)" : ""}...\n`);

  let success = 0;
  let errors = 0;

  for (let i = 0; i < toProcess.length; i++) {
    const filePath = toProcess[i];
    const relPath = path.relative(DOCS_DIR, filePath);

    try {
      const content = fs.readFileSync(filePath, "utf-8");
      const { frontmatter, body } = parseFrontmatter(content);
      const title = extractTitle(frontmatter, body);
      const plainText = stripMarkdown(content);

      const description = await generateDescription(title, plainText);

      console.log(`[${i + 1}/${toProcess.length}] ${relPath}`);
      console.log(`  title: ${title}`);
      console.log(`  description: ${description} (${description.length} chars)`);

      if (!DRY_RUN) {
        const updated = insertDescription(content, description);
        fs.writeFileSync(filePath, updated, "utf-8");
      }

      success++;

      // Small delay to avoid rate limits
      if (i < toProcess.length - 1) {
        await new Promise((r) => setTimeout(r, 200));
      }
    } catch (err) {
      console.error(`[${i + 1}/${toProcess.length}] ERROR ${relPath}: ${err.message}`);
      errors++;
    }
  }

  console.log(`\nDone: ${success} descriptions generated, ${errors} errors`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
