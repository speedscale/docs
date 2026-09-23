import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  analyzeFile,
  parseAddedLines,
  run,
} from "../validation/check-public-writing.mjs";
import { runPushed } from "../validation/check-pushed-writing.mjs";

const allLines = (content) =>
  new Set(content.split("\n").map((_, index) => index + 1));

test("ignores violations on untouched lines", () => {
  const content = "SpeedScale is misspelled.\n\nThis line changed.\n";
  assert.deepEqual(
    analyzeFile("docs/example.md", content, new Set([3])),
    [],
  );
});

test("blocks objective terminology and capitalization violations", () => {
  const content = "Proxymock uses ground truth from Home Depot.\n";
  const findings = analyzeFile(
    "docs/example.md",
    content,
    allLines(content),
  );
  assert.deepEqual(
    findings.map((finding) => finding.rule),
    ["confidential customer", "product capitalization", "retired terminology"],
  );
});

test("blocks hard-wrapped prose on changed lines", () => {
  const content =
    "This paragraph was wrapped even though it is prose\nthat should remain on one source line.\n";
  const findings = analyzeFile(
    "docs/example.md",
    content,
    allLines(content),
  );
  assert.equal(
    findings.filter((finding) => finding.rule === "hard-wrapped prose").length,
    2,
  );
});

test("allows separate paragraphs and list items", () => {
  const content =
    "First paragraph.\n\nSecond paragraph.\n\n- First item\n- Second item\n";
  assert.equal(
    analyzeFile("docs/example.md", content, allLines(content)).length,
    0,
  );
});

test("ignores fenced and inline code", () => {
  const content =
    "```text\nSpeedScale and Home Depot\n```\nUse `SpeedScale` as test input.\n";
  assert.equal(
    analyzeFile("docs/example.md", content, allLines(content)).length,
    0,
  );
});

test("blocks an em dash anywhere in public prose", () => {
  const opening = "Opening sentence — with a dash.\n";
  const later = `${Array.from({ length: 10 }, (_, index) => `Sentence ${index + 1}.`).join(" ")} Later sentence — blocked here too.\n`;
  assert.equal(
    analyzeFile(
      "docs/example.md",
      opening,
      allLines(opening),
    )[0].rule,
    "em dash",
  );
  assert.equal(
    analyzeFile("docs/example.md", later, allLines(later))[0].rule,
    "em dash",
  );
});

test("blocks an em dash in public frontmatter", () => {
  const content = '---\ndescription: "Speedscale — API testing"\n---\n';
  const findings = analyzeFile(
    "docs/example.md",
    content,
    allLines(content),
  );
  assert.equal(findings.length, 1);
  assert.equal(findings[0].rule, "em dash");
  assert.equal(findings[0].line, 2);
});

test("reports percent and dollar quantitative claims", () => {
  const content = "Cuts test time by 50% for teams. $500 saved annually.\n";
  const findings = analyzeFile(
    "docs/example.md",
    content,
    allLines(content),
  ).filter((finding) => finding.rule === "quantitative claim");
  assert.deepEqual(
    findings.map((finding) => finding.match),
    ["50%", "$500 saved"],
  );
});

test("checks indented list prose but ignores indented code", () => {
  const listContent = [
    "1. Install the tool.",
    "",
    "    Run Proxymock after installation.",
    "",
  ].join("\n");
  const codeContent = "    const product = 'SpeedScale';\n";
  assert.equal(
    analyzeFile(
      "docs/example.md",
      listContent,
      allLines(listContent),
    )[0].rule,
    "product capitalization",
  );
  assert.equal(
    analyzeFile(
      "docs/example.md",
      codeContent,
      allLines(codeContent),
    ).length,
    0,
  );
});

test("ignores multiline HTML comments and JSX attributes", () => {
  const content = [
    "Visible paragraph.",
    "<!--",
    "Wrapped comment with SpeedScale",
    "-->",
    "<Card",
    "  action={() => doThing()}",
    '  title="SpeedScale"',
    ">",
    "Install Proxymock.",
    "</Card>",
    "",
  ].join("\n");
  const findings = analyzeFile(
    "docs/example.mdx",
    content,
    allLines(content),
  );
  assert.equal(findings.length, 1);
  assert.equal(findings[0].match, "Proxymock");
});

test("matches the confidential CFA acronym case-sensitively", () => {
  const content = "A cfa is different from CFA.\n";
  const findings = analyzeFile(
    "docs/example.md",
    content,
    allLines(content),
  );
  assert.equal(findings.length, 1);
  assert.equal(findings[0].match, "CFA");
});

test("reports style patterns as warnings", () => {
  const content = "Moreover, this robust system can leverage existing tools.\n";
  const findings = analyzeFile(
    "docs/example.md",
    content,
    allLines(content),
  );
  assert.ok(findings.length >= 3);
  assert.ok(findings.every((finding) => finding.severity === "warning"));
});

test("checks visible Docusaurus frontmatter", () => {
  const content = '---\ntitle: "Install Proxymock"\n---\n';
  const findings = analyzeFile(
    "docs/example.mdx",
    content,
    allLines(content),
  );
  assert.equal(findings.length, 1);
  assert.equal(findings[0].match, "Proxymock");
});

test("parses only added lines from zero-context diffs", () => {
  const diff = "+++ b/docs/example.md\n@@ -2,0 +3,2 @@\n+one\n+two\n";
  assert.deepEqual(
    [...parseAddedLines(diff).get("docs/example.md")],
    [3, 4],
  );
});

test("discovers docs surfaces and excludes the generated MCP reference", () => {
  const diff = [
    "+++ b/docs/example.md",
    "@@ -0,0 +1 @@",
    "+docs",
    "+++ b/src/partials/example.mdx",
    "@@ -0,0 +1 @@",
    "+partial",
    "+++ b/README.md",
    "@@ -0,0 +1 @@",
    "+readme",
    "+++ b/.github/pull_request_template.md",
    "@@ -0,0 +1 @@",
    "+template",
    "+++ b/docs/proxymock/how-it-works/mcp-tools.md",
    "@@ -0,0 +1 @@",
    "+generated",
    "+++ b/AGENTS.md",
    "@@ -0,0 +1 @@",
    "+internal",
    "",
  ].join("\n");
  assert.deepEqual([...parseAddedLines(diff).keys()], [
    "docs/example.md",
    "src/partials/example.mdx",
    "README.md",
    ".github/pull_request_template.md",
  ]);
});

test("ignores tilde fences while checking admonition prose", () => {
  const content = [
    "~~~text",
    "SpeedScale and Home Depot",
    "~~~",
    "",
    ":::note",
    "Install Proxymock.",
    ":::",
    "",
  ].join("\n");
  const findings = analyzeFile(
    "docs/example.mdx",
    content,
    allLines(content),
  );
  assert.equal(findings.length, 1);
  assert.equal(findings[0].rule, "product capitalization");
});

test("overrides diff.noprefix when checking local changes", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "writing-check-"));
  try {
    execFileSync("git", ["init", "-q"], { cwd: root });
    execFileSync("git", ["config", "user.email", "test@example.com"], {
      cwd: root,
    });
    execFileSync("git", ["config", "user.name", "Writing Check"], {
      cwd: root,
    });
    execFileSync("git", ["config", "diff.noprefix", "true"], { cwd: root });
    fs.mkdirSync(path.join(root, "docs"), { recursive: true });
    const file = path.join(root, "docs", "example.md");
    fs.writeFileSync(file, "Valid prose.\n");
    execFileSync("git", ["add", "."], { cwd: root });
    execFileSync("git", ["commit", "-qm", "initial"], { cwd: root });
    fs.writeFileSync(file, "Install Proxymock.\n");

    const result = run(root, { all: false, base: "HEAD" });
    assert.equal(result.checkedFiles, 1);
    assert.equal(result.findings[0].rule, "product capitalization");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("checks committed push content without reading uncommitted files", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "writing-push-check-"));
  try {
    execFileSync("git", ["init", "-q"], { cwd: root });
    execFileSync("git", ["config", "user.email", "test@example.com"], {
      cwd: root,
    });
    execFileSync("git", ["config", "user.name", "Writing Check"], {
      cwd: root,
    });
    fs.mkdirSync(path.join(root, "docs"), { recursive: true });
    const readme = path.join(root, "README.md");
    fs.writeFileSync(readme, "Valid prose.\n");
    execFileSync("git", ["add", "."], { cwd: root });
    execFileSync("git", ["commit", "-qm", "initial"], { cwd: root });
    const remoteSha = execFileSync("git", ["rev-parse", "HEAD"], {
      cwd: root,
      encoding: "utf8",
    }).trim();

    fs.writeFileSync(readme, "Updated valid prose.\n");
    execFileSync("git", ["add", "README.md"], { cwd: root });
    execFileSync("git", ["commit", "-qm", "update"], { cwd: root });
    const localSha = execFileSync("git", ["rev-parse", "HEAD"], {
      cwd: root,
      encoding: "utf8",
    }).trim();

    fs.writeFileSync(readme, "Install Proxymock.\n");
    fs.writeFileSync(path.join(root, "docs", "untracked.md"), "Home Depot.\n");

    const input = `refs/heads/feature ${localSha} refs/heads/feature ${remoteSha}\n`;
    const result = runPushed(root, input);
    assert.equal(result.checkedFiles, 1);
    assert.deepEqual(result.findings, []);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("ignores main's content brought in by merging main into a branch", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "writing-push-merge-"));
  const git = (...args) =>
    execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
  const write = (name, text) =>
    fs.writeFileSync(path.join(root, "docs", name), text);
  try {
    git("init", "-q", "-b", "main");
    git("config", "user.email", "test@example.com");
    git("config", "user.name", "Writing Check");
    fs.mkdirSync(path.join(root, "docs"), { recursive: true });
    write("base.md", "Valid prose.\n");
    git("add", ".");
    git("commit", "-qm", "initial");

    git("checkout", "-qb", "feature");
    write("feature.md", "Feature prose.\n");
    git("add", ".");
    git("commit", "-qm", "feature");
    const remoteSha = git("rev-parse", "HEAD");

    // main gains a violation that predates the writing gate.
    git("checkout", "-q", "main");
    write("main.md", "Install Proxymock.\n");
    git("add", ".");
    git("commit", "-qm", "main change");
    git("update-ref", "refs/remotes/origin/main", git("rev-parse", "HEAD"));

    git("checkout", "-q", "feature");
    git("merge", "-q", "--no-edit", "main");
    const mergedSha = git("rev-parse", "HEAD");
    let result = runPushed(
      root,
      `refs/heads/feature ${mergedSha} refs/heads/feature ${remoteSha}\n`,
    );
    assert.deepEqual(result.findings, []);

    // A violation the branch itself adds is still caught.
    write("feature.md", "Install Proxymock.\n");
    git("add", ".");
    git("commit", "-qm", "feature violation");
    result = runPushed(
      root,
      `refs/heads/feature ${git("rev-parse", "HEAD")} refs/heads/feature ${mergedSha}\n`,
    );
    assert.deepEqual(
      result.findings.map((finding) => [finding.file, finding.rule]),
      [["docs/feature.md", "product capitalization"]],
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("nested list items are not hard-wrapped prose", () => {
  const content = [
    "- [Install](#install)",
    "  - [Resource Ownership](#resource-ownership)",
    "  - [Install Flow](#install-flow)",
    "",
    "4. **Migrate CSV Data Sets:**",
    "   - Upload the CSV to Speedscale.",
    "   - Replace the data field in your traffic.",
    "",
    "A paragraph that wraps",
    "onto a second line.",
  ].join("\n");
  const findings = analyzeFile(
    "docs/example.md",
    content,
    new Set(content.split("\n").map((_, index) => index + 1)),
  ).filter((finding) => finding.rule === "hard-wrapped prose");
  assert.deepEqual(
    findings.map((finding) => finding.line),
    [9, 10],
  );
});
