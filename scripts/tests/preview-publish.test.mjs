import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const workflow = readFileSync(new URL('../../.github/workflows/pr.yaml', import.meta.url), 'utf8');
const publish = workflow.slice(workflow.indexOf('\n  publish:'));
const gate = publish.split('    - name: verify preview is current\n')[1].split('\n    - name:')[0];
const script = gate.split('      run: |\n')[1].trimEnd().split('\n').map(line => line.slice(8)).join('\n');
const sha = 'a'.repeat(40);
const pr = {
  number: 42, state: 'open', draft: false,
  head: { sha, repo: { full_name: 'speedscale/docs' } },
  user: { login: 'maintainer' },
};

function runGate(t, pull, extraEnv = {}) {
  const dir = mkdtempSync(path.join(tmpdir(), 'preview-publish-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  writeFileSync(path.join(dir, 'pr.json'), JSON.stringify(pull));
  writeFileSync(path.join(dir, 'gh'), '#!/bin/sh\nif [ "${FAIL_API:-}" = 1 ]; then exit 1; fi\ncat "$PR_FIXTURE"\n', { mode: 0o755 });
  const output = path.join(dir, 'output');
  writeFileSync(output, '');
  const result = spawnSync('bash', ['-e', '-o', 'pipefail', '-c', script], {
    encoding: 'utf8',
    env: { ...process.env, PATH: `${dir}:${process.env.PATH}`, PR_FIXTURE: path.join(dir, 'pr.json'), GITHUB_OUTPUT: output, GITHUB_REPOSITORY: 'speedscale/docs', PR_NUMBER: '42', EXPECTED_HEAD: sha, ...extraEnv },
  });
  return { ...result, output: readFileSync(output, 'utf8') };
}

test('current same-repository PR publishes', t => {
  const result = runGate(t, pr);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.output, 'publish=true\n');
});

for (const [name, change] of Object.entries({
  closed: { state: 'closed' },
  draft: { draft: true },
  superseded: { head: { ...pr.head, sha: 'b'.repeat(40) } },
  fork: { head: { ...pr.head, repo: { full_name: 'other/docs' } } },
  dependabot: { user: { login: 'dependabot[bot]' } },
  'wrong PR': { number: 43 },
  'missing identity': { head: null },
})) {
  test(`${name} skips publishing without failing CI`, t => {
    const result = runGate(t, { ...pr, ...change });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.output, 'publish=false\n');
    assert.match(result.stdout, /Preview skipped/);
  });
}

test('API failures remain failures', t => {
  const result = runGate(t, pr, { FAIL_API: '1' });
  assert.notEqual(result.status, 0);
  assert.equal(result.output, '');
});

test('build uses one immutable event merge checkout', () => {
  const build = workflow.slice(0, workflow.indexOf('\n  publish:'));
  assert.equal((build.match(/uses: actions\/checkout@/g) ?? []).length, 1);
  assert.match(build, /ref: \$\{\{ github\.sha \}\}/);
  assert.match(build, /git rev-parse HEAD\^2/);
});

test('preview and cleanup share cancellation and publishing uses event identity', () => {
  const cleanup = readFileSync(new URL('../../.github/workflows/pr_cleanup.yaml', import.meta.url), 'utf8');
  for (const text of [workflow, cleanup]) {
    assert.match(text, /group: docs-preview-\$\{\{ github\.event\.pull_request\.number \}\}/);
    assert.match(text, /cancel-in-progress: true/);
  }
  assert.doesNotMatch(publish, /needs\.build\.outputs\.(pr_number|head_sha)/);
  assert.match(publish, /ref: \$\{\{ github\.event\.pull_request\.base\.sha \}\}/);
  const steps = publish.split('    - name: ').slice(2);
  assert.ok(steps.length > 0);
  for (const step of steps) assert.match(step, /if: steps\.current\.outputs\.publish == 'true'/);
});
