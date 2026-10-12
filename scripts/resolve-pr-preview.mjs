import { appendFileSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const syncBranch = 'bot/mcp-docs-sync';
const generatedFiles = new Set([
  'docs/proxymock/how-it-works/mcp-tools.md',
  'scripts/mcp-docs-version.txt',
]);
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

export async function resolvePreview(eventName, event, repository, api) {
  if (eventName === 'pull_request') {
    return previewMetadata(event.pull_request, repository);
  }
  const run = event.workflow_run;
  if (eventName !== 'workflow_run' || run?.conclusion !== 'success' ||
      run.head_branch !== 'main' || run.head_repository?.full_name !== repository) {
    return { run: 'false' };
  }
  const owner = repository.split('/')[0];
  const prs = await api(`pulls?state=open&base=main&head=${encodeURIComponent(`${owner}:${syncBranch}`)}&per_page=100`);
  if (prs.length === 0) return { run: 'false' };
  if (prs.length !== 1 || !Number.isSafeInteger(prs[0].number)) {
    throw new Error('Expected one rolling MCP docs pull request');
  }
  const pr = await api(`pulls/${prs[0].number}`);
  if (pr.state !== 'open' || pr.user?.login !== 'github-actions[bot]' ||
      pr.head?.repo?.full_name !== repository || pr.head.ref !== syncBranch ||
      pr.base?.repo?.full_name !== repository || pr.base.ref !== 'main' ||
      !Number.isInteger(pr.changed_files) || pr.changed_files < 1 || pr.changed_files > generatedFiles.size) {
    throw new Error('Refusing an untrusted MCP docs pull request');
  }
  const files = await api(`pulls/${pr.number}/files?per_page=100`);
  if (files.length !== pr.changed_files || files.some(file =>
    !generatedFiles.has(file.filename) || file.status !== 'modified')) {
    throw new Error('MCP docs pull request changes files outside the generated reference');
  }
  return previewMetadata(pr, repository);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const repository = process.env.GITHUB_REPOSITORY;
  const api = async path => {
    const response = await fetch(`${process.env.GITHUB_API_URL}/repos/${repository}/${path}`, {
      headers: {
        Authorization: `Bearer ${process.env.GH_TOKEN}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });
    if (!response.ok) throw new Error(`GitHub preview lookup failed (${response.status})`);
    return response.json();
  };
  try {
    const event = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
    const metadata = await resolvePreview(process.env.GITHUB_EVENT_NAME, event, repository, api);
    for (const [key, value] of Object.entries(metadata)) {
      appendFileSync(process.env.GITHUB_OUTPUT, `${key}=${value}\n`);
    }
    if (metadata.run === 'false') console.log('No MCP docs pull request needs a preview.');
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
