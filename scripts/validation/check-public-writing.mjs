#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";

const HARD_RULES = [
  {
    name: "confidential customer",
    pattern: /\b(?:Home Depot|Chick-fil-A|CFA)\b/gi,
    message: "replace the prohibited customer reference",
  },
  {
    name: "product capitalization",
    pattern:
      /\b(?:SpeedScale|Proxymock|ProxyMock|Github Copilot|model context protocol)\b/g,
    message: "use the canonical product spelling",
  },
  {
    name: "retired terminology",
    pattern: /\b(?:ground truth|validation receipts?|digital twins?)\b/gi,
    message: "use current Speedscale terminology",
  },
  {
    name: "generator signature",
    pattern:
      /^\s*(?:[>*_-]+\s*)?(?:generated|written|authored|created) by (?:Codex|Claude|ChatGPT|an? AI|artificial intelligence)\s*[.!_-]*\s*$/gi,
    message: "remove generator branding",
  },
];

const WARNING_RULES = [
  {
    name: "suspicious vocabulary",
    pattern:
      /\b(?:delve|landscape|navigate|tapestry|leverage|utilize|whilst|myriad|seamlessly|robust|holistic|paradigm|synergy|cutting-edge|game-changing|groundbreaking|transformative|pivotal|industry-leading|best-in-class|unlock|supercharge)\b/gi,
    message: "review this word against the public-writing rules",
  },
  {
    name: "negative parallelism",
    pattern:
      /\b(?:that(?:'s| is) not|this (?:isn't|is not)|it (?:isn't|is not)|not)\b[^.!?\n]{0,140}(?:\bbut\b|[.!?]\s+(?:that(?:'s| is)|this is|it(?:'s| is| was))\b)/gi,
    message: "rewrite the negative parallelism directly",
  },
  {
    name: "transition filler",
    pattern: /(?:^|[.!?]\s+)(?:Additionally|Moreover|Furthermore|Notably),/gi,
    message: "remove the transition filler",
  },
  {
    name: "vague attribution",
    pattern:
      /\b(?:Research shows|Studies suggest|Experts argue|Industry reports suggest|Observers have noted|Some critics say|Many experts believe)\b/gi,
    message: "name and link the source",
  },
  {
    name: "quantitative claim",
    pattern:
      /\b(?:\d+(?:\.\d+)?%|\d+(?:\.\d+)?x\s+(?:faster|slower|more|less)|\$\d[\d,.]*\s+(?:saved|reduction))\b/gi,
    message: "verify that the claim has a nearby citation",
  },
];

function isPublicWritingFile(file) {
  return (
    /^(?:docs|src)\/.+\.(?:md|mdx)$/.test(file) ||
    file === "README.md" ||
    file === ".github/pull_request_template.md" ||
    /^\.github\/PULL_REQUEST_TEMPLATE\/.+\.md$/.test(file)
  );
}

function addFinding(findings, file, line, severity, rule, match, message) {
  findings.push({ file, line, severity, rule, match, message });
}

function matches(pattern, text) {
  pattern.lastIndex = 0;
  return [...text.matchAll(pattern)];
}

function markdownVisibleLines(lines) {
  let inFrontmatter = false;
  let inFence = false;
  let inComment = false;
  let inJsxTag = false;

  return lines.map((line, index) => {
    if (index === 0 && line.trim() === "---") {
      inFrontmatter = true;
      return "";
    }
    if (inFrontmatter && line.trim() === "---") {
      inFrontmatter = false;
      return "";
    }
    if (inFrontmatter) {
      const field = line.match(
        /^\s*(?:title|description|excerpt|summary):\s*["']?(.*?)["']?\s*$/i,
      );
      return field ? field[1] : "";
    }
    if (/^\s*(?:```|~~~)/.test(line)) {
      inFence = !inFence;
      return "";
    }
    if (inFence || /^(?: {4}|\t)/.test(line)) return "";
    if (/^\s*(?:import|export)\b/.test(line)) return "";

    if (inComment) {
      if (line.includes("-->")) inComment = false;
      return "";
    }
    if (line.includes("<!--")) {
      if (!line.includes("-->")) {
        inComment = true;
        return line.slice(0, line.indexOf("<!--"));
      }
      return line.replace(/<!--.*?-->/g, "");
    }

    if (inJsxTag) {
      if (line.includes(">")) inJsxTag = false;
      return "";
    }
    if (/^\s*<[A-Za-z]/.test(line) && !line.includes(">")) {
      inJsxTag = true;
      return "";
    }

    return line
      .replace(/`[^`]*`/g, "")
      .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
      .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
      .replace(/https?:\/\/\S+/g, "")
      .replace(/<[^>]+>/g, " ");
  });
}

function astroVisibleLines(lines) {
  let inFrontmatter = false;
  let inScript = false;
  let inStyle = false;
  let inTag = false;

  return lines.map((line, index) => {
    if (index === 0 && line.trim() === "---") {
      inFrontmatter = true;
      return "";
    }
    if (inFrontmatter && line.trim() === "---") {
      inFrontmatter = false;
      return "";
    }
    if (inFrontmatter) {
      return [
        ...line.matchAll(
          /\b(?:title|description|heading|subheading|eyebrow|label|placeholder|alt|text)\s*[:=]\s*["'`]([^"'`]+)["'`]/gi,
        ),
      ]
        .map((match) => match[1])
        .join(" ");
    }

    if (/<script\b/i.test(line)) inScript = true;
    if (/<style\b/i.test(line)) inStyle = true;
    if (inScript || inStyle) {
      if (/<\/script>/i.test(line)) inScript = false;
      if (/<\/style>/i.test(line)) inStyle = false;
      return "";
    }

    const attributes = [
      ...line.matchAll(
        /\b(?:title|description|aria-label|placeholder|alt)=["']([^"']+)["']/gi,
      ),
    ].map((match) => match[1]);
    let text = line.replace(/\{[^{}]*\}/g, " ").replace(/https?:\/\/\S+/g, " ");

    if (inTag) {
      const tagEnd = text.indexOf(">");
      if (tagEnd < 0) return attributes.join(" ");
      text = text.slice(tagEnd + 1);
      inTag = false;
    }

    text = text.replace(/<[^>]*>/g, " ");
    const tagStart = text.lastIndexOf("<");
    if (tagStart >= 0 && text.indexOf(">", tagStart) < 0) {
      text = text.slice(0, tagStart);
      inTag = true;
    }

    return `${attributes.join(" ")} ${text}`;
  });
}

function typedSourceVisibleLines(lines) {
  return lines.map((line) =>
    [
      ...line.matchAll(
        /\b(?:title|description|heading|subheading|eyebrow|label|placeholder|alt|text)\s*[:=]\s*["'`]([^"'`]+)["'`]/gi,
      ),
    ]
      .map((match) => match[1])
      .join(" "),
  );
}

function visibleLines(file, lines) {
  if (/\.(?:md|mdx)$/.test(file)) return markdownVisibleLines(lines);
  if (/\.astro$/.test(file)) return astroVisibleLines(lines);
  return typedSourceVisibleLines(lines);
}

function proseBodyLines(file, lines) {
  if (!/\.(?:md|mdx)$/.test(file)) return visibleLines(file, lines);
  const visible = markdownVisibleLines(lines);
  let inFrontmatter = false;
  let inFence = false;
  return lines.map((line, index) => {
    if (index === 0 && line.trim() === "---") {
      inFrontmatter = true;
      return "";
    }
    if (inFrontmatter && line.trim() === "---") {
      inFrontmatter = false;
      return "";
    }
    if (inFrontmatter) return "";
    if (/^\s*(?:```|~~~)/.test(line)) {
      inFence = !inFence;
      return "";
    }
    if (inFence || /^(?: {4}|\t)/.test(line)) return "";
    return visible[index];
  });
}

function isMarkdownProseLine(line, visibleLine = line) {
  const trimmed = line.trim();
  if (
    !trimmed ||
    /^(?:---|```|~~~|#{1,6}\s|[-*+]\s|\d+[.)]\s|>|\||<|:::|\{| {4}|\t|import\b|export\b)/.test(
      line,
    )
  )
    return false;
  return /[A-Za-z]/.test(visibleLine.trim());
}

export function analyzeFile(file, content, selectedLines) {
  if (!isPublicWritingFile(file)) return [];

  const lines = content.split(/\r?\n/);
  const visible = visibleLines(file, lines);
  const findings = [];

  for (let index = 0; index < visible.length; index += 1) {
    const lineNumber = index + 1;
    if (!selectedLines.has(lineNumber) || !visible[index].trim()) continue;

    for (const rule of HARD_RULES) {
      for (const match of matches(rule.pattern, visible[index])) {
        addFinding(
          findings,
          file,
          lineNumber,
          "error",
          rule.name,
          match[0],
          rule.message,
        );
      }
    }
    for (const rule of WARNING_RULES) {
      for (const match of matches(rule.pattern, visible[index])) {
        addFinding(
          findings,
          file,
          lineNumber,
          "warning",
          rule.name,
          match[0],
          rule.message,
        );
      }
    }
  }

  if (/\.(?:md|mdx)$/.test(file)) {
    let inFrontmatter = false;
    let inFence = false;
    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];
      if (index === 0 && line.trim() === "---") {
        inFrontmatter = true;
        continue;
      }
      if (inFrontmatter && line.trim() === "---") {
        inFrontmatter = false;
        continue;
      }
      if (inFrontmatter) continue;
      if (/^\s*(?:```|~~~)/.test(line)) {
        inFence = !inFence;
        continue;
      }
      if (
        inFence ||
        !selectedLines.has(index + 1) ||
        !isMarkdownProseLine(line, visible[index])
      )
        continue;

      const previousIsProse =
        index > 0 &&
        isMarkdownProseLine(lines[index - 1], visible[index - 1]);
      const nextIsProse =
        index + 1 < lines.length &&
        isMarkdownProseLine(lines[index + 1], visible[index + 1]);
      if (previousIsProse || nextIsProse) {
        addFinding(
          findings,
          file,
          index + 1,
          "error",
          "hard-wrapped prose",
          line.trim(),
          "put each prose paragraph on one source line",
        );
      }
    }
  }

  const body = proseBodyLines(file, lines);
  for (let index = 0; index < body.length; index += 1) {
    const text = body[index];
    if (!text.trim()) continue;
    if (selectedLines.has(index + 1) && text.includes("—")) {
      for (
        let dash = text.indexOf("—");
        dash >= 0;
        dash = text.indexOf("—", dash + 1)
      ) {
        addFinding(
          findings,
          file,
          index + 1,
          "error",
          "em dash",
          "—",
          "use punctuation other than an em dash in public prose",
        );
      }
    }
  }

  return findings;
}

export function parseAddedLines(diff) {
  const selected = new Map();
  let file = null;

  for (const line of diff.split("\n")) {
    if (line.startsWith("+++ b/")) {
      file = line.slice(6);
      if (isPublicWritingFile(file) && !selected.has(file))
        selected.set(file, new Set());
      continue;
    }
    if (!file || !selected.has(file) || !line.startsWith("@@")) continue;
    const hunk = line.match(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/);
    if (!hunk) continue;
    const start = Number(hunk[1]);
    const count = hunk[2] === undefined ? 1 : Number(hunk[2]);
    for (let offset = 0; offset < count; offset += 1)
      selected.get(file).add(start + offset);
  }

  return selected;
}

function runGit(root, args) {
  try {
    return execFileSync("git", args, {
      cwd: root,
      encoding: "utf8",
      maxBuffer: 20 * 1024 * 1024,
    });
  } catch (error) {
    const detail = error.stderr?.toString().trim() || error.message;
    throw new Error(`git ${args.join(" ")} failed: ${detail}`);
  }
}

function mergeSelected(target, source) {
  for (const [file, lines] of source) {
    if (!target.has(file)) target.set(file, new Set());
    for (const line of lines) target.get(file).add(line);
  }
}

function allTrackedLines(root) {
  const selected = new Map();
  const files = runGit(root, ["ls-files", "-z"])
    .split("\0")
    .filter(isPublicWritingFile);
  for (const file of files) {
    const count = fs
      .readFileSync(path.join(root, file), "utf8")
      .split(/\r?\n/).length;
    selected.set(
      file,
      new Set(Array.from({ length: count }, (_, index) => index + 1)),
    );
  }
  return selected;
}

function changedLines(root, base) {
  const selected = new Map();
  mergeSelected(
    selected,
    parseAddedLines(
      runGit(root, [
        "diff",
        "--unified=0",
        "--diff-filter=ACMR",
        `${base}...HEAD`,
        "--",
      ]),
    ),
  );
  mergeSelected(
    selected,
    parseAddedLines(
      runGit(root, ["diff", "--unified=0", "--diff-filter=ACMR", "HEAD", "--"]),
    ),
  );
  const untracked = runGit(root, [
    "ls-files",
    "--others",
    "--exclude-standard",
    "-z",
  ])
    .split("\0")
    .filter(isPublicWritingFile);
  for (const file of untracked) {
    const count = fs
      .readFileSync(path.join(root, file), "utf8")
      .split(/\r?\n/).length;
    selected.set(
      file,
      new Set(Array.from({ length: count }, (_, index) => index + 1)),
    );
  }
  return selected;
}

function defaultBase(root) {
  if (process.env.CI_MERGE_REQUEST_DIFF_BASE_SHA)
    return process.env.CI_MERGE_REQUEST_DIFF_BASE_SHA;
  if (
    process.env.CI_COMMIT_BEFORE_SHA &&
    !/^0+$/.test(process.env.CI_COMMIT_BEFORE_SHA)
  )
    return process.env.CI_COMMIT_BEFORE_SHA;
  return runGit(root, ["merge-base", "origin/main", "HEAD"]).trim();
}

function parseArguments(argv) {
  const options = { all: false, base: null };
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === "--all") options.all = true;
    else if (argv[index] === "--base") options.base = argv[++index];
    else throw new Error(`unknown argument: ${argv[index]}`);
  }
  if (options.all && options.base)
    throw new Error("use either --all or --base, not both");
  return options;
}

export function run(root, options) {
  const selected = options.all
    ? allTrackedLines(root)
    : changedLines(root, options.base || defaultBase(root));
  const findings = [];

  for (const [file, lines] of selected) {
    const absolute = path.join(root, file);
    if (!fs.existsSync(absolute)) continue;
    findings.push(
      ...analyzeFile(file, fs.readFileSync(absolute, "utf8"), lines),
    );
  }

  findings.sort(
    (a, b) =>
      a.file.localeCompare(b.file) ||
      a.line - b.line ||
      a.severity.localeCompare(b.severity),
  );
  return { checkedFiles: selected.size, findings };
}

function main() {
  const root = process.cwd();
  const options = parseArguments(process.argv.slice(2));
  const result = run(root, options);

  if (result.checkedFiles === 0) {
    console.log("No changed public writing to check.");
    return;
  }

  for (const finding of result.findings) {
    console.log(
      `${finding.file}:${finding.line}: ${finding.severity}: [${finding.rule}] ${finding.message}; found "${finding.match}"`,
    );
  }

  const errors = result.findings.filter(
    (finding) => finding.severity === "error",
  ).length;
  const warnings = result.findings.length - errors;
  console.log(
    `Checked ${result.checkedFiles} public-writing files: ${errors} errors, ${warnings} warnings.`,
  );
  if (errors > 0) process.exitCode = 1;
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (invokedPath === fileURLToPath(import.meta.url)) main();
