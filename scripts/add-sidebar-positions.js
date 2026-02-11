#!/usr/bin/env node
/**
 * Add sidebar_position to doc files that are missing it.
 * Uses per-directory numbering (1, 2, 3, ...) by filename order.
 */
const fs = require('fs');
const path = require('path');

const docsDir = path.join(__dirname, '..', 'docs');

function getMdFiles(dir, baseDir = docsDir) {
  let results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory() && !e.name.startsWith('.')) {
      results = results.concat(getMdFiles(full, baseDir));
    } else if (e.isFile() && /\.(md|mdx)$/.test(e.name) && !e.name.startsWith('_')) {
      results.push(full);
    }
  }
  return results.sort();
}

function hasSidebarPosition(content) {
  return /^sidebar_position:\s*\d+/m.test(content) || /^\s*sidebar_position:\s*\d+/m.test(content);
}

function addSidebarPosition(filePath, position) {
  let content = fs.readFileSync(filePath, 'utf8');
  if (hasSidebarPosition(content)) return false;

  if (content.startsWith('---')) {
    const closeFm = content.indexOf('\n---', 4);
    if (closeFm > 0) {
      const insertAt = closeFm;
      const newContent = content.slice(0, insertAt) + '\nsidebar_position: ' + position + content.slice(insertAt);
      fs.writeFileSync(filePath, newContent, 'utf8');
      return true;
    }
  }

  const newContent = '---\nsidebar_position: ' + position + '\n---\n\n' + content;
  fs.writeFileSync(filePath, newContent, 'utf8');
  return true;
}

const allFiles = getMdFiles(docsDir);
const byDir = {};
for (const f of allFiles) {
  const dir = path.dirname(f);
  if (!byDir[dir]) byDir[dir] = [];
  byDir[dir].push(f);
}

let added = 0;
for (const dir of Object.keys(byDir).sort()) {
  const files = byDir[dir];
  let pos = 0;
  for (const f of files) {
    const content = fs.readFileSync(f, 'utf8');
    if (!hasSidebarPosition(content)) {
      addSidebarPosition(f, pos);
      added++;
    }
    pos++;
  }
}
console.log('Added sidebar_position to', added, 'files');
