import { parseHTML } from 'linkedom';
import TurndownService from 'turndown';
import { gfm } from 'turndown-plugin-gfm';
import { readdir, readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { join, dirname, relative } from 'node:path';

const clean = value => (value || '').replace(/<!--[\s\S]*?(?:-->|$)/g, '').replace(/<[^>]*>/g, '').replace(/[\r\n]+/g, ' ').replace(/[\[\]]/g, '').trim();
const canonicalOf = document => document.querySelector('link[rel="canonical"]')?.getAttribute('href');
const excluded = document => document.querySelector('meta[http-equiv="refresh" i]') || /noindex/i.test(document.querySelector('meta[name="robots"]')?.getAttribute('content') || '');

export function markdownFromHtml(html, { contentSelector = 'main', indexUrl } = {}) {
  const { document } = parseHTML(html);
  const canonical = canonicalOf(document);
  if (!canonical || excluded(document)) return null;
  const content = document.querySelector(contentSelector);
  if (!content) return null;
  for (const tablist of content.querySelectorAll('[role="tablist"]')) {
    const container = tablist.closest('.theme-tabs-container');
    if (!container) continue;
    const labels = [...tablist.children].map(tab => tab.textContent.trim());
    const panels = [...container.querySelectorAll('[role="tabpanel"]')].filter(panel => panel.closest('.theme-tabs-container') === container);
    panels.forEach((panel, i) => {
      const label = document.createElement('p');
      const strong = document.createElement('strong');
      strong.textContent = labels[i] || 'Alternative';
      label.appendChild(strong);
      panel.prepend(label);
    });
    tablist.remove();
  }
  content.querySelectorAll('script, style, nav, svg, [aria-hidden="true"], button[class*="copyButton"], .hash-link, .theme-doc-toc-mobile').forEach(node => node.remove());
  for (const node of content.querySelectorAll('[href], [src]')) {
    for (const attr of ['href', 'src']) {
      const value = node.getAttribute(attr);
      if (value) node.setAttribute(attr, new URL(value, canonical).href);
    }
  }
  const converter = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' });
  converter.use(gfm);
  converter.addRule('headingAnchor', {
    filter: node => /^H[1-6]$/.test(node.nodeName),
    replacement: (text, node) => {
      const id = node.getAttribute('id');
      const anchor = id ? `<a id="${id.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')}"></a>\n\n` : '';
      return '\n\n' + anchor + '#'.repeat(Number(node.nodeName[1])) + ' ' + text.trim() + '\n\n';
    },
  });
  converter.addRule('codeFence', {
    filter: 'pre',
    replacement: (_content, node) => {
      const code = node.querySelector('code') || node;
      const language = [code.getAttribute('class'), node.getAttribute('class'), node.parentElement?.getAttribute('class')].join(' ').match(/language-([\w-]+)/)?.[1] || '';
      const lines = [...code.querySelectorAll('.token-line')];
      const text = (lines.length ? lines.map(line => line.textContent).join('\n') : code.textContent).replace(/\n$/, '');
      const fence = '`'.repeat(Math.max(3, ...[...text.matchAll(/`+/g)].map(m => m[0].length + 1)));
      return '\n\n' + fence + language + '\n' + text + '\n' + fence + '\n\n';
    },
  });
  const title = document.querySelector('title')?.textContent || '';
  const description = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';
  const mirrorUrl = new URL('index.md', canonical).href;
  const index = indexUrl || new URL('/llms.txt', canonical).href;
  return '---\ntitle: ' + JSON.stringify(title) + '\ndescription: ' + JSON.stringify(description) + '\ncanonical: ' + JSON.stringify(canonical) + '\n---\n\n' +
    `[Documentation index](${index}) | [Markdown](${mirrorUrl}) | [Canonical page](${canonical})\n\n` + converter.turndown(content.innerHTML).trim() + '\n';
}

export async function generateMirrors(dir, options = {}) {
  const pages = [];
  const files = [];
  async function walk(path) {
    for (const entry of await readdir(path, { withFileTypes: true })) {
      const file = join(path, entry.name);
      if (entry.isDirectory()) await walk(file);
      else if (entry.name === 'index.html') files.push(file);
    }
  }
  await walk(dir);
  const rootHtml = await readFile(join(dir, 'index.html'), 'utf8');
  const { document: rootDocument } = parseHTML(rootHtml);
  const siteBase = canonicalOf(rootDocument);
  if (!siteBase) throw new Error('The root page must have a canonical URL');
  const rootIndex = new URL('llms.txt', siteBase).href;
  for (const file of files.sort()) {
    let html = await readFile(file, 'utf8');
    const { document } = parseHTML(html);
    const canonical = canonicalOf(document);
    const path = relative(dir, dirname(file)).split('\\').join('/');
    const expected = new URL(path ? path + '/' : './', siteBase).href;
    if (canonical !== expected) continue;
    const section = path.split('/')[0];
    const indexUrl = section ? new URL(section + '/llms.txt', siteBase).href : rootIndex;
    const markdown = markdownFromHtml(html, { ...options, indexUrl });
    if (!markdown) continue;
    const mirrorUrl = new URL('index.md', canonical).href;
    html = html.replace(/<link\b(?=[^>]*\brel="(?:alternate|describedby)")(?=[^>]*(?:\btype="text\/markdown"|\bhref="[^"]*\/llms\.txt"))[^>]*>/g, '');
    html = html.replace('</head>', `<link rel="alternate" type="text/markdown" href="${mirrorUrl}"><link rel="describedby" href="${indexUrl}"></head>`);
    await writeFile(file, html);
    await writeFile(join(dirname(file), 'index.md'), markdown);
    pages.push({ path, url: mirrorUrl, canonical, title: clean(document.querySelector('h1')?.textContent || document.querySelector('title')?.textContent), description: clean(document.querySelector('meta[name="description"]')?.getAttribute('content')).slice(0, 300) });
  }
  if (!pages.length) throw new Error('No published pages produced Markdown');
  const groups = new Map();
  for (const page of pages) {
    const group = page.path.split('/')[0] || '';
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group).push(page);
  }
  const line = page => `- [${page.title}](${page.url})${page.description ? ': ' + page.description : ''}\n`;
  const root = pages.find(page => !page.path);
  let index = `# ${options.siteName || clean(rootDocument.querySelector('title')?.textContent)}\n\n> ${root?.description || 'Published documentation and reference pages.'}\n\n## Start here\n\n${root ? line(root) : ''}`;
  for (const [group, entries] of [...groups].sort(([a], [b]) => a.localeCompare(b))) {
    if (!group) continue;
    // Bound each leaf index so readers only fetch the section they need.
    let chunks = [''];
    for (const page of entries) {
      const entry = line(page);
      if (chunks.at(-1).length + entry.length > 35000) chunks.push('');
      chunks[chunks.length - 1] += entry;
    }
    const folder = join(dir, group);
    await mkdir(folder, { recursive: true });
    const title = entries.find(page => page.path === group)?.title || group;
    const groupUrl = new URL(group + '/llms.txt', siteBase).href;
    index += `- [${title}](${groupUrl}): ${entries.length} ${entries.length === 1 ? 'page' : 'pages'}\n`;
    let section = `# ${title}\n\n[Site index](${rootIndex})\n\n## Pages\n\n`;
    if (chunks.length === 1) section += chunks[0];
    else for (let n = 0; n < chunks.length; n++) {
      const name = `llms-${n + 1}.txt`;
      section += `- [Pages ${n + 1}](${new URL(group + '/' + name, siteBase).href})\n`;
      await writeFile(join(folder, name), `# ${title}: pages ${n + 1}\n\n[Section index](${groupUrl})\n\n## Pages\n\n` + chunks[n]);
    }
    await writeFile(join(folder, 'llms.txt'), section);
  }
  if (options.resources) index += `\n## ${options.resourcesTitle || 'Agent skills'}\n\n` + options.resources.map(line).join('');
  await writeFile(join(dir, 'llms.txt'), index);
  await validateIndexes(dir, siteBase);
  // Validate every generated local target against the finished build.
  for (const page of pages) {
    const target = new URL(page.url);
    const base = new URL(siteBase);
    if (target.origin !== base.origin || !target.pathname.startsWith(base.pathname)) throw new Error(`Offsite mirror: ${page.url}`);
    await access(join(dir, decodeURIComponent(target.pathname.slice(base.pathname.length))));
  }
  return pages.length;
}

export async function validateIndexes(dir, siteBase) {
  const base = new URL(siteBase);
  async function walk(path) {
    for (const entry of await readdir(path, { withFileTypes: true })) {
      const file = join(path, entry.name);
      if (entry.isDirectory()) await walk(file);
      else if (/^llms(?:-\d+)?\.txt$/.test(entry.name)) {
        const text = await readFile(file, 'utf8');
        if (text.length > 50000) throw new Error(`Index is too large: ${file}`);
        for (const match of text.matchAll(/\]\((https?:\/\/[^)]+)\)/g)) {
          const target = new URL(match[1]);
          if (target.origin !== base.origin) continue;
          if (!target.pathname.startsWith(base.pathname)) throw new Error(`Target outside build: ${target.href}`);
          await access(join(dir, decodeURIComponent(target.pathname.slice(base.pathname.length))));
        }
      }
    }
  }
  await walk(dir);
}

export default function markdownMirrors() {
  return { name: 'speedscale-markdown-mirrors', hooks: {
    'astro:build:done': async ({ dir, logger }) => {
      logger.info(`Generated ${await generateMirrors(dir.pathname)} Markdown mirrors and indexes`);
    },
  } };
}
