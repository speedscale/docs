import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const deploy = fileURLToPath(new URL('./deploy-redirect-objects.mjs', import.meta.url));
const check = fileURLToPath(new URL('./check-redirects.mjs', import.meta.url));
function fixture(t) {
  const dir = mkdtempSync(path.join(tmpdir(), 'docs-security-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
}
for (const target of ['/valid/path/', 'https://example.com/', '//example.com/', '/\\example.com/', '/\t/example.com/', '/&#47;example.com/', '/&#x2f;example.com/']) {
  test(`redirect target ${JSON.stringify(target)}`, (t) => {
    const dir = fixture(t);
    writeFileSync(path.join(dir, 'index.html'), `<meta http-equiv="refresh" content="0; url=${target}">`);
    const result = spawnSync(process.execPath, [deploy, dir, 'unused', '--dry-run'], { encoding: 'utf8' });
    assert.equal(result.status, target === '/valid/path/' ? 0 : 1, result.stderr);
    if (target !== '/valid/path/') assert.match(result.stderr, /refusing to publish/);
  });
}
test('invalid mixed output is rejected before any AWS command', (t) => {
  const dir = fixture(t);
  mkdirSync(path.join(dir, 'build'));
  mkdirSync(path.join(dir, 'bin'));
  writeFileSync(path.join(dir, 'build', 'a.html'), '<meta http-equiv="refresh" content="0; url=/valid/">');
  writeFileSync(path.join(dir, 'build', 'z.html'), '<meta http-equiv="refresh" content="0; url=//example.com/">');
  const marker = path.join(dir, 'aws-called');
  writeFileSync(path.join(dir, 'bin', 'aws'), `#!/bin/sh\ntouch "${marker}"\n`, { mode: 0o755 });
  const result = spawnSync(process.execPath, [deploy, path.join(dir, 'build'), 'unused'], { env: { ...process.env, PATH: `${dir}/bin:${process.env.PATH}` } });
  assert.equal(result.status, 1);
  assert.equal(existsSync(marker), false);
});
test('unknown base ref fails closed without executing shell input', (t) => {
  const dir = fixture(t);
  const marker = path.join(dir, 'shell-called');
  const result = spawnSync(process.execPath, [check, `invalid; touch ${marker}`], { encoding: 'utf8' });
  assert.equal(result.status, 1, result.stdout);
  assert.match(result.stderr, /Unable to compare/);
  assert.equal(existsSync(marker), false);
});

for (const operation of ['delete', 'rename']) {
  test(`detect ${operation} on the PR side of the comparison`, (t) => {
    const dir = fixture(t);
    const git = (...args) => {
      const result = spawnSync('git', args, { cwd: dir, encoding: 'utf8' });
      assert.equal(result.status, 0, result.stderr);
      return result.stdout.trim();
    };
    git('init');
    git('config', 'user.name', 'Test');
    git('config', 'user.email', 'test@example.com');
    mkdirSync(path.join(dir, 'docs'));
    writeFileSync(path.join(dir, 'docusaurus.config.js'), 'const redirects = [];');
    writeFileSync(path.join(dir, 'docs', 'old.md'), '# Old page');
    git('add', '.');
    git('-c', 'core.hooksPath=/dev/null', 'commit', '-m', 'Base');
    const base = git('rev-parse', 'HEAD');
    if (operation === 'delete') git('rm', 'docs/old.md');
    else git('mv', 'docs/old.md', 'docs/new.md');
    git('-c', 'core.hooksPath=/dev/null', 'commit', '-m', 'Change');
    const result = spawnSync(process.execPath, [check, base], { cwd: dir, encoding: 'utf8' });
    assert.equal(result.status, 1, result.stdout);
    assert.match(result.stderr, /Missing redirect/);
    writeFileSync(path.join(dir, 'docusaurus.config.js'), 'const redirects = [{ from: "/old/", to: "/new/" }];');
    const fixed = spawnSync(process.execPath, [check, base], { cwd: dir, encoding: 'utf8' });
    assert.equal(fixed.status, 0, fixed.stderr);
  });
}

const publicTerms = 'https://speedscale.com/legal/terms-service/';
for (const key of ['proxymock/how-it-works/license/index.html', 'proxymock/reference/license/index.html']) {
  test(`${key} redirects directly to the public terms`, (t) => {
    const dir = fixture(t);
    const file = path.join(dir, key);
    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(file, `<meta http-equiv="refresh" content="0; url=${publicTerms}">`);
    const valid = spawnSync(process.execPath, [deploy, dir, 'unused', '--dry-run'], { encoding: 'utf8' });
    assert.equal(valid.status, 0, valid.stderr);
    assert.ok(valid.stdout.includes(`(dry-run) ${key} -> ${publicTerms}`));
    for (const target of ['https://example.com/', `${publicTerms}?alternate=1`, 'https://speedscale.com/legal/privacy/']) {
      writeFileSync(file, `<meta http-equiv="refresh" content="0; url=${target}">`);
      const invalid = spawnSync(process.execPath, [deploy, dir, 'unused', '--dry-run'], { encoding: 'utf8' });
      assert.equal(invalid.status, 1, invalid.stdout);
      assert.match(invalid.stderr, /refusing to publish/);
    }
  });
}

test('unrelated pages cannot redirect offsite to the public terms', (t) => {
  const dir = fixture(t);
  writeFileSync(path.join(dir, 'index.html'), `<meta http-equiv="refresh" content="0; url=${publicTerms}">`);
  const result = spawnSync(process.execPath, [deploy, dir, 'unused', '--dry-run'], { encoding: 'utf8' });
  assert.equal(result.status, 1, result.stdout);
  assert.match(result.stderr, /refusing to publish/);
});

test('license redirects publish the canonical destination as S3 redirect metadata', (t) => {
  const dir = fixture(t);
  const build = path.join(dir, 'build');
  mkdirSync(path.join(dir, 'bin'));
  for (const key of ['proxymock/how-it-works/license/index.html', 'proxymock/reference/license/index.html']) {
    const file = path.join(build, key);
    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(file, `<meta http-equiv="refresh" content="0; url=${publicTerms}">`);
  }
  const log = path.join(dir, 'aws-args.jsonl');
  writeFileSync(path.join(dir, 'bin', 'aws'), "#!/usr/bin/env node\nrequire('node:fs').appendFileSync(process.env.REDIRECT_AWS_LOG, JSON.stringify(process.argv.slice(2)) + '\\n');\n", { mode: 0o755 });
  const result = spawnSync(process.execPath, [deploy, build, 'unused'], {
    env: { ...process.env, PATH: `${dir}/bin:${process.env.PATH}`, REDIRECT_AWS_LOG: log },
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stderr);
  const calls = readFileSync(log, 'utf8').trim().split('\n').map((line) => JSON.parse(line));
  assert.equal(calls.length, 2);
  assert.deepEqual(calls.map((args) => args[args.indexOf('--key') + 1]).sort(), [
    'proxymock/how-it-works/license/index.html',
    'proxymock/reference/license/index.html',
  ]);
  for (const args of calls) {
    assert.deepEqual(args.slice(0, 2), ['s3api', 'put-object']);
    assert.equal(args[args.indexOf('--website-redirect-location') + 1], publicTerms);
  }
});
