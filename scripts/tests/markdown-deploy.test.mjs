import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm, chmod } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { generateMirrors } from '../agent/markdown-mirrors.mjs';

const fakeAws = `#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const args = process.argv.slice(2);
const state = JSON.parse(fs.readFileSync(process.env.S3_STATE, 'utf8'));
state.calls.push(args);
if (args[0] === 's3' && ['sync', 'cp'].includes(args[1]) && args.includes('*.md') && args.includes('--include')) {
  const source = args[2];
  const target = args[3];
  const files = new Map();
  function walk(dir) {
    for (const item of fs.readdirSync(dir, {withFileTypes: true})) {
      const file = path.join(dir, item.name);
      if (item.isDirectory()) walk(file);
      else if (file.endsWith('.md')) files.set(path.relative(source, file), fs.readFileSync(file, 'utf8'));
    }
  }
  walk(source);
  if (args[1] === 'sync' && args.includes('--delete')) {
    if (process.env.FAIL_MD_SYNC) process.exit(1);
    for (const key of Object.keys(state.objects)) {
      if (key.startsWith(target) && key.endsWith('.md') && !files.has(key.slice(target.length))) delete state.objects[key];
    }
  }
  for (const [key, body] of files) state.objects[target + key] = {
    body,
    contentType: args[args.indexOf('--content-type') + 1],
    cacheControl: args[args.indexOf('--cache-control') + 1],
  };
}
fs.writeFileSync(process.env.S3_STATE, JSON.stringify(state));
`;

for (const deployment of ['production', 'preview']) {
  test(`${deployment} removes retired and noindex mirrors, preserves other objects, and refreshes MIME`, async t => {
    const dir = await mkdtemp(join(tmpdir(), 'markdown-deploy-'));
    t.after(() => rm(dir, { recursive: true, force: true }));
    const dist = join(dir, 'dist');
    await mkdir(join(dist, 'blog/private'), { recursive: true });
    await mkdir(join(dist, '_astro'));
    const html = '<html><head><link rel="canonical" href="https://speedscale.com/"></head><body><main><h1>Current</h1></main></body></html>';
    await writeFile(join(dist, 'index.html'), html);
    await writeFile(join(dist, 'blog/private/index.html'), html.replace('</head>', '<meta name="robots" content="noindex"></head>'));
    await generateMirrors(dist);
    const target = deployment === 'production' ? 's3://test-site/' : 's3://test-preview/mr-424/';
    const protectedKey = deployment === 'preview' ? 's3://test-preview/mr-408/index.md' : target + '_astro/cached.js';
    const statePath = join(dir, 'state.json');
    await writeFile(statePath, JSON.stringify({ calls: [], objects: {
      [target + 'index.md']: { body: 'old', contentType: 'application/octet-stream' },
      [target + 'blog/deleted/index.md']: { body: 'deleted page' },
      [target + 'blog/private/index.md']: { body: 'formerly public page' },
      [target + 'blog/keep/image.png']: { body: 'image' },
      [protectedKey]: { body: 'preserved' },
    } }));
    await writeFile(join(dir, 'aws'), fakeAws);
    await chmod(join(dir, 'aws'), 0o755);
    const env = { ...process.env, PATH: dir + ':' + process.env.PATH, DIST_DIR: dist, WEBSITE_BUCKET: 'test-site', PREVIEW_BUCKET: 'test-preview', S3_STATE: statePath };
    const script = resolve('scripts/deploy-markdown.sh');
    const deploy = () => execFileSync('bash', [script, dist, target], { env, encoding: 'utf8' });
    deploy();
    deploy();
    const state = JSON.parse(await readFile(statePath, 'utf8'));
    assert.equal(state.objects[target + 'blog/deleted/index.md'], undefined);
    assert.equal(state.objects[target + 'blog/private/index.md'], undefined);
    assert.equal(state.objects[target + 'index.md'].contentType, 'text/markdown; charset=utf-8');
    assert.equal(state.objects[target + 'index.md'].cacheControl, 'public, max-age=300');
    assert.match(state.objects[target + 'index.md'].body, /# Current/);
    assert.equal(state.objects[protectedKey].body, 'preserved');
    assert.equal(state.objects[target + 'blog/keep/image.png'].body, 'image');
    assert.ok(state.calls.some(args => args[1] === 'sync' && args[3] === target && args.includes('--delete') && args.includes('*.md')));
    assert.throws(() => execFileSync('bash', [script, dist, target], { env: { ...env, FAIL_MD_SYNC: '1' }, stdio: 'pipe' }));
  });
}
