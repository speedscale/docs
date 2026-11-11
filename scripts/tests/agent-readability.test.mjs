import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, access, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { markdownFromHtml, generateMirrors, validateIndexes } from '../agent/markdown-mirrors.mjs';

const page = (url, body, head = '') => `<html><head><title>Example</title><meta name="description" content="Example reference"><link rel="canonical" href="${url}">${head}</head><body><nav>Site navigation</nav><main><article class="theme-doc-markdown">${body}</article></main></body></html>`;

test('rendered docs preserve anchors, tabs, callouts, tables and multiline code', () => {
  const html = page('https://example.com/proxymock/', '<h1>Reference</h1><h2 id="record">Record<a class="hash-link" href="#record">#</a></h2><div class="theme-tabs-container"><ul role="tablist"><li>CLI</li><li>MCP</li></ul><div role="tabpanel"><pre class="language-bash"><code class="codeBlockLines"><span class="token-line">proxymock record</span><span class="token-line">curl localhost:4143</span></code></pre></div><div role="tabpanel" hidden><p>MCP alternative</p></div></div><aside>Keep the mock running</aside><table><thead><tr><th>Flag</th><th>Default</th></tr></thead><tbody><tr><td>--port</td><td>4140</td></tr></tbody></table><a href="../install/#linux">Install</a><img src="diagram.png"><script>tracking()</script>');
  const text = markdownFromHtml(html, { contentSelector: '.theme-doc-markdown' });
  assert.match(text, /<a id="record"><\/a>\n\n## Record/);
  assert.match(text, /```bash\nproxymock record\ncurl localhost:4143\n```/);
  assert.match(text, /\*\*CLI\*\*/);
  assert.match(text, /\*\*MCP\*\*/);
  assert.match(text, /MCP alternative/);
  assert.match(text, /Keep the mock running/);
  assert.match(text, /\| \\?--port \| 4140 \|/);
  assert.match(text, /https:\/\/example.com\/install\/#linux/);
  assert.match(text, /https:\/\/example.com\/proxymock\/diagram.png/);
  assert.doesNotMatch(text, /tracking|Site navigation|Record#/);
});

test('redirects and noindex pages do not produce content mirrors', () => {
  for (const head of ['<meta name="robots" content="NOINDEX, follow">', '<meta name="robots" content="none">', '<meta http-equiv="refresh" content="0; url=/new/">']) {
    assert.equal(markdownFromHtml(page('https://example.com/', '<h1>Excluded</h1>', head)), null);
  }
  assert.equal(markdownFromHtml('<main>Missing canonical</main>'), null);
});

test('build indexes target published Markdown, respect preview bases, and detect broken targets', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'agent-index-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const base = 'https://example.com/pr-42/';
  const pages = [
    ['', '<h1>Docs</h1>', ''],
    ['proxymock', '<h1>proxymock</h1><p>Current instructions</p>', ''],
    ['proxymock/private', '<h1>Private</h1>', '<meta name="robots" content="noindex">'],
    ['old', '<h1>Old</h1>', '<meta http-equiv="refresh" content="0; url=/new/">'],
  ];
  for (const [path, body, head] of pages) {
    await mkdir(join(dir, path), { recursive: true });
    await writeFile(join(dir, path, 'index.html'), page(base + (path ? path + '/' : ''), body, head));
  }
  assert.equal(await generateMirrors(dir), 2);
  assert.equal(await generateMirrors(dir), 2);
  const html = await readFile(join(dir, 'proxymock/index.html'), 'utf8');
  assert.equal((html.match(/type="text\/markdown"/g) || []).length, 1);
  assert.match(html, /rel="describedby" href="https:\/\/example.com\/pr-42\/proxymock\/llms.txt"/);
  const root = await readFile(join(dir, 'llms.txt'), 'utf8');
  const section = await readFile(join(dir, 'proxymock/llms.txt'), 'utf8');
  assert.match(root, /https:\/\/example.com\/pr-42\/proxymock\/llms.txt/);
  assert.match(section, /https:\/\/example.com\/pr-42\/proxymock\/index.md/);
  assert.doesNotMatch(root + section, /private|\/old\//);
  await assert.rejects(access(join(dir, 'proxymock/private/index.md')));
  await assert.rejects(access(join(dir, 'old/index.md')));
  await writeFile(join(dir, 'llms.txt'), root + '\n- [Broken](https://example.com/pr-42/missing/index.md)\n');
  await assert.rejects(validateIndexes(dir, base), /ENOENT/);
});


test('large sections split into bounded indexes with valid targets', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'agent-index-size-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  await writeFile(join(dir, 'index.html'), page('https://example.com/', '<h1>Docs</h1>'));
  for (let i = 0; i < 110; i++) {
    const path = `reference/page-${i}`;
    await mkdir(join(dir, path), { recursive: true });
    await writeFile(join(dir, path, 'index.html'), page(`https://example.com/${path}/`, '<h1>Reference</h1>').replace('content="Example reference"', `content="${'Reference '.repeat(40)}"`));
  }
  await generateMirrors(dir);
  const index = await readFile(join(dir, 'reference/llms.txt'), 'utf8');
  assert.match(index, /llms-1.txt/);
  assert.match(index, /llms-2.txt/);
  assert.ok((await readFile(join(dir, 'reference/llms-1.txt'), 'utf8')).length < 50000);
  await validateIndexes(dir, 'https://example.com/');
});


test('preview discovery uses its public origin while retaining source canonical metadata', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'agent-preview-origin-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const canonical = 'https://docs.example.com/pr-42/';
  const publicBaseUrl = 'http://preview.example.com/pr-42/';
  await writeFile(join(dir, 'index.html'), page(canonical, '<h1>Docs</h1>'));
  await mkdir(join(dir, 'proxymock'));
  await writeFile(join(dir, 'proxymock/index.html'), page(canonical + 'proxymock/', '<h1>proxymock</h1><a href="../install/">Install</a>'));
  await generateMirrors(dir, { publicBaseUrl });
  const html = await readFile(join(dir, 'proxymock/index.html'), 'utf8');
  const markdown = await readFile(join(dir, 'proxymock/index.md'), 'utf8');
  const index = await readFile(join(dir, 'proxymock/llms.txt'), 'utf8');
  assert.match(html, /type="text\/markdown" href="http:\/\/preview.example.com\/pr-42\/proxymock\/index.md"/);
  assert.match(markdown, /canonical: "https:\/\/docs.example.com\/pr-42\/proxymock\/"/);
  assert.match(markdown, /\[Install\]\(http:\/\/preview.example.com\/pr-42\/install\/\)/);
  assert.doesNotMatch(index, /docs.example.com/);
  await validateIndexes(dir, publicBaseUrl);
});

test('preview Markdown keeps root-relative links under the public base and tolerates malformed URLs', () => {
  const html = page('https://docs.example.com/proxymock/', '<h1>Reference</h1><a href="/reference/glossary/#mock">Glossary</a><img src="/assets/a.png"><a href="//cdn.example.net/x">CDN</a><a href="https://">Broken</a>');
  const text = markdownFromHtml(html, { contentSelector: '.theme-doc-markdown', pageUrl: 'http://preview.example.com/pr-42/proxymock/', siteBase: 'http://preview.example.com/pr-42/' });
  assert.match(text, /\(http:\/\/preview.example.com\/pr-42\/reference\/glossary\/#mock\)/);
  assert.match(text, /http:\/\/preview.example.com\/pr-42\/assets\/a.png/);
  assert.match(text, /\(http:\/\/cdn.example.net\/x\)/);
  assert.match(text, /\[Broken\]\(https:\/\/\)/);
});

test('public base without a trailing slash still resolves under its path', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'agent-base-slash-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  await writeFile(join(dir, 'index.html'), page('https://docs.example.com/', '<h1>Docs</h1>'));
  await mkdir(join(dir, 'proxymock'));
  await writeFile(join(dir, 'proxymock/index.html'), page('https://docs.example.com/proxymock/', '<h1>proxymock</h1>'));
  await generateMirrors(dir, { publicBaseUrl: 'http://preview.example.com/pr-42' });
  assert.match(await readFile(join(dir, 'llms.txt'), 'utf8'), /http:\/\/preview.example.com\/pr-42\/proxymock\/llms.txt/);
});

test('preview Markdown does not double the prefix on links Docusaurus already prefixed', () => {
  const html = page('https://docs.example.com/proxymock/', '<h1>Lifecycle</h1><a href="/pr-42/reference/glossary/">Glossary</a><img src="/pr-42/assets/a.png"><a href="/install/">Install</a>');
  const text = markdownFromHtml(html, { contentSelector: '.theme-doc-markdown', pageUrl: 'http://preview.example.com/pr-42/proxymock/', siteBase: 'http://preview.example.com/pr-42/' });
  assert.match(text, /\(http:\/\/preview.example.com\/pr-42\/reference\/glossary\/\)/);
  assert.match(text, /http:\/\/preview.example.com\/pr-42\/assets\/a.png/);
  assert.match(text, /\(http:\/\/preview.example.com\/pr-42\/install\/\)/);
  assert.doesNotMatch(text, /pr-42\/pr-42/);
});
