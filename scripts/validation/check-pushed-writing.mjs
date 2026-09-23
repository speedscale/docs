#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  analyzeFile,
  parseAddedLines,
} from "./check-public-writing.mjs";

const ZERO_SHA = /^0+$/;

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

function mergeBaseWithMain(root, localSha) {
  try {
    return runGit(root, ["merge-base", "origin/main", localSha]).trim();
  } catch {
    return "";
  }
}

// Check what the branch adds on top of main, the same scope CI checks against
// the PR base. Diffing from the previous remote head instead would count
// everything a merge of main brings in as added by this push, so a branch
// that merged main would be blocked by main's own history.
function pushedBase(root, remoteSha, localSha) {
  const mainBase = mergeBaseWithMain(root, localSha);
  if (mainBase) return mainBase;
  if (!ZERO_SHA.test(remoteSha)) return remoteSha;
  return runGit(root, ["merge-base", "origin/main", localSha]).trim();
}

function pushedDiff(root, base, head) {
  return runGit(root, [
    "diff",
    "--src-prefix=a/",
    "--dst-prefix=b/",
    "--no-color",
    "--no-ext-diff",
    "--unified=0",
    "--diff-filter=ACMR",
    `${base}...${head}`,
    "--",
  ]);
}

export function runPushed(root, input) {
  const findings = [];
  const checked = new Set();

  for (const rawLine of input.split("\n")) {
    const fields = rawLine.trim().split(/\s+/);
    if (fields.length !== 4) continue;
    const [, localSha, , remoteSha] = fields;
    if (ZERO_SHA.test(localSha)) continue;

    const base = pushedBase(root, remoteSha, localSha);
    for (const [file, lines] of parseAddedLines(
      pushedDiff(root, base, localSha),
    )) {
      let content;
      try {
        content = runGit(root, ["show", `${localSha}:${file}`]);
      } catch {
        continue;
      }
      checked.add(`${localSha}\0${file}`);
      findings.push(...analyzeFile(file, content, lines));
    }
  }

  findings.sort(
    (a, b) =>
      a.file.localeCompare(b.file) ||
      a.line - b.line ||
      a.severity.localeCompare(b.severity),
  );
  return { checkedFiles: checked.size, findings };
}

function main() {
  const root = process.cwd();
  const result = runPushed(root, fs.readFileSync(0, "utf8"));

  if (result.checkedFiles === 0) {
    console.log("No pushed public writing to check.");
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
    `Checked ${result.checkedFiles} pushed public-writing files: ${errors} errors, ${warnings} warnings.`,
  );
  if (errors > 0) process.exitCode = 1;
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (invokedPath === fileURLToPath(import.meta.url)) main();
