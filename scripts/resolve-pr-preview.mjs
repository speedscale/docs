import { appendFileSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const shaPattern = /^[a-f0-9]{40}$/;

function previewMetadata(pr, repository) {
  if (!Number.isSafeInteger(pr.number) || pr.number < 1 ||
      !shaPattern.test(pr.head?.sha) || !shaPattern.test(pr.base?.sha)) {
    throw new Error('Invalid pull request identity');
  }
  return {
    run: 'true',
    pr_number: String(pr.number),
    head_sha: pr.head.sha,
    base_sha: pr.base.sha,
    ref: `refs/pull/${pr.number}/merge`,
    publish: String(pr.head.repo?.full_name === repository && pr.user?.login !== 'dependabot[bot]'),
  };
}

export function resolvePreview(event, repository) {
  return previewMetadata(event.pull_request, repository);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const repository = process.env.GITHUB_REPOSITORY;
  try {
    const event = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
    const metadata = resolvePreview(event, repository);
    for (const [key, value] of Object.entries(metadata)) {
      appendFileSync(process.env.GITHUB_OUTPUT, `${key}=${value}\n`);
    }
    if (metadata.run === 'false') console.log('No MCP docs pull request needs a preview.');
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
