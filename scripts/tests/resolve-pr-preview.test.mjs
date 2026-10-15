import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolvePreview } from '../resolve-pr-preview.mjs';

const repository = 'speedscale/docs';
const headSha = 'a'.repeat(40);
const baseSha = 'b'.repeat(40);
const pr = {
  number: 798, state: 'open', changed_files: 2,
  user: { login: 'github-actions[bot]' },
  head: { sha: headSha, ref: 'feature/docs-update', repo: { full_name: repository } },
  base: { sha: baseSha, ref: 'main', repo: { full_name: repository } },
};
test('ordinary PRs retain their merge preview; forks and Dependabot cannot publish', async () => {
  for (const pull of [pr, { ...pr, head: { ...pr.head, repo: { full_name: 'other/docs' } } },
    { ...pr, user: { login: 'dependabot[bot]' } }]) {
    const metadata = await resolvePreview({ pull_request: pull }, repository);
    assert.equal(metadata.run, 'true');
    assert.equal(metadata.publish, String(pull === pr));
  }
});
