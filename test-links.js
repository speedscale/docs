#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const docsDir = path.join(__dirname, 'docs');
const brokenLinks = [];
const fixedLinks = [];

// Recursively find all markdown files
function findMarkdownFiles(dir) {
  const files = [];
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      files.push(...findMarkdownFiles(fullPath));
    } else if (item.endsWith('.md') || item.endsWith('.mdx')) {
      files.push(fullPath);
    }
  }

  return files;
}

// Check if a path exists (file or directory, with or without .md/.mdx extension)
function checkPath(targetPath) {
  if (fs.existsSync(targetPath)) return true;
  if (fs.existsSync(targetPath + '.md')) return true;
  if (fs.existsSync(targetPath + '.mdx')) return true;
  return false;
}

const mdFiles = findMarkdownFiles(docsDir);

console.log('Testing internal links in documentation...\n');

for (const mdFile of mdFiles) {
  const content = fs.readFileSync(mdFile, 'utf8');

  // Find markdown links: [text](path)
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let match;

  while ((match = linkRegex.exec(content)) !== null) {
    const linkText = match[1];
    const linkPath = match[2];

    // Skip external URLs and anchors
    if (linkPath.startsWith('http://') ||
        linkPath.startsWith('https://') ||
        linkPath.startsWith('#') ||
        linkPath.startsWith('mailto:')) {
      continue;
    }

    // Remove anchor from path
    const cleanPath = linkPath.split('#')[0];
    if (!cleanPath) continue;

    // Resolve the path
    let targetPath;
    if (cleanPath.startsWith('/')) {
      // Absolute path from docs root
      targetPath = path.join(docsDir, cleanPath);
    } else {
      // Relative path
      targetPath = path.resolve(path.dirname(mdFile), cleanPath);
    }

    // Check if target exists
    if (!checkPath(targetPath)) {
      brokenLinks.push({
        file: path.relative(docsDir, mdFile),
        link: linkPath,
        text: linkText
      });
    } else {
      fixedLinks.push({
        file: path.relative(docsDir, mdFile),
        link: linkPath
      });
    }
  }
}

// Print results
if (brokenLinks.length > 0) {
  console.log('❌ TEST FAILED: Found ' + brokenLinks.length + ' broken internal links:\n');
  brokenLinks.forEach((link, i) => {
    console.log((i + 1) + '. ' + link.file);
    console.log('   Link: ' + link.link);
    console.log('   Text: ' + link.text);
    console.log();
  });
  process.exit(1);
} else {
  console.log('✅ TEST PASSED: All internal links are valid!');
  console.log('   Total links checked: ' + fixedLinks.length);
  process.exit(0);
}
