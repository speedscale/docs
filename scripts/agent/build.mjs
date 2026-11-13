import { generateMirrors } from './markdown-mirrors.mjs';

const count = await generateMirrors('build', {
  contentSelector: '.theme-doc-markdown',
  siteName: 'Speedscale Documentation',
  publicBaseUrl: process.env.DOCS_PUBLIC_BASE_URL,
  resources: [
    { title: 'Agent skills', url: 'https://github.com/speedscale/skills', description: 'Installation and recorded traffic testing workflows for coding agents.' },
    { title: 'install-speedscale', url: 'https://raw.githubusercontent.com/speedscale/skills/main/skills/install-speedscale/SKILL.md', description: 'Install and verify the CLI, operator, and MCP integration.' },
    { title: 'improve-mock-match-rate', url: 'https://raw.githubusercontent.com/speedscale/skills/main/skills/improve-mock-match-rate/SKILL.md', description: 'Investigate and improve replay mock matching.' },
  ],
});
console.log(`Generated ${count} Markdown mirrors and indexes`);
