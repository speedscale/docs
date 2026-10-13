import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolvePreview } from '../resolve-pr-preview.mjs';

const repository = 'speedscale/docs';
const headSha = 'a'.repeat(40);
const baseSha = 'b'.repeat(40);
const pr = {
  number: 798, state: 'open', changed_files: 2,
  user: { login: 'github-actions[bot]' },
  head: { sha: headSha, ref: 'bot/mcp-docs-sync', repo: { full_name: repository } },
  base: { sha: baseSha, ref: 'main', repo: { full_name: repository } },
};
const files = [
  { filename: 'docs/proxymock/how-it-works/mcp-tools.md', status: 'modified' },
  { filename: 'scripts/mcp-docs-version.txt', status: 'modified' },
];
const event = {
  workflow_run: { conclusion: 'success', head_branch: 'main', head_repository: { full_name: repository } },
};
function api(pull = pr, changed = files) {
  return async path => {
    if (path.startsWith('pulls?')) return pull ? [{ number: pull.number }] : [];
    if (path.endsWith('/files?per_page=100')) return changed;
    if (path === `pulls/${pull.number}`) return pull;
    throw new Error(`Unexpected API path: ${path}`);
  };
}

test('successful sync previews the current rolling head rather than the sync workflow SHA', async () => {
  const metadata = await resolvePreview('workflow_run', event, repository, api());
  assert.equal(metadata.pr_number, '798');
  assert.equal(metadata.head_sha, headSha);
  assert.equal(metadata.ref, 'refs/pull/798/merge');
  assert.equal(metadata.publish, 'true');
});
test('sync without an open rolling PR skips', async () => {
  assert.deepEqual(await resolvePreview('workflow_run', event, repository, api(null)), { run: 'false' });
});
for (const change of [
  { conclusion: 'failure' }, { head_branch: 'feature' },
  { head_repository: { full_name: 'other/docs' } },
]) {
  test(`untrusted sync source skips: ${JSON.stringify(change)}`, async () => {
    const source = { workflow_run: { ...event.workflow_run, ...change } };
    const unexpectedApi = () => { throw new Error('API must not be called'); };
    assert.deepEqual(await resolvePreview('workflow_run', source, repository, unexpectedApi), { run: 'false' });
  });
}
for (const change of [
  { state: 'closed' }, { user: { login: 'someone' } }, { changed_files: 3 },
  { head: { ...pr.head, repo: { full_name: 'other/docs' } } },
  { head: { ...pr.head, ref: 'other-branch' } },
  { base: { ...pr.base, ref: 'other-base' } },
  { head: { ...pr.head, sha: 'invalid\nref=main' } },
]) {
  test(`unexpected rolling PR is rejected: ${JSON.stringify(change)}`, async () => {
    await assert.rejects(resolvePreview('workflow_run', event, repository, api({ ...pr, ...change })));
  });
}
for (const changed of [
  [...files, { filename: 'package.json', status: 'modified' }],
  [files[0], { filename: '.github/workflows/pr.yaml', status: 'modified' }],
  [files[0]],
  [files[0], { ...files[1], status: 'renamed' }],
]) {
  test(`unexpected changed files are rejected: ${JSON.stringify(changed)}`, async () => {
    await assert.rejects(resolvePreview('workflow_run', event, repository, api(pr, changed)));
  });
}
test('ordinary PRs retain their merge preview; forks and Dependabot cannot publish', async () => {
  for (const pull of [pr, { ...pr, head: { ...pr.head, repo: { full_name: 'other/docs' } } },
    { ...pr, user: { login: 'dependabot[bot]' } }]) {
    const metadata = await resolvePreview('pull_request', { pull_request: pull }, repository);
    assert.equal(metadata.run, 'true');
    assert.equal(metadata.publish, String(pull === pr));
  }
});
