# Agent content retrieval

`yarn build` renders Docusaurus, then generates public Markdown mirrors and bounded `llms.txt` indexes. The converter reads rendered article content so imported components, OS tabs, callouts, and highlighted code survive without MDX imports. Every page advertises its Markdown and section index. The build checks every local index target. Existing agent skill links remain in the root index.

Run `yarn test:agents` and `node --test scripts/security-regressions.test.mjs`. Deploy Markdown with `scripts/deploy-markdown.sh` to preserve its content type, refresh unchanged object metadata, and remove retired mirrors. HTML redirect objects also get Markdown aliases. Preview deployments publish explicit Markdown URLs; S3 website previews do not run CloudFront negotiation.

The docs CloudFront function lives in `infra/structure`, under `prod/global/docs.tf`. Its negotiation change must remain in draft until the Markdown objects and redirect aliases are deployed. After deployment, request the same canonical page as HTML, by `index.md`, and with `Accept: text/markdown`. Repeat HTML after Markdown and verify content types, `Vary: Accept`, code content, and redirects. Check that nonexistent pages still return 404.

## Retrieval evaluation

Start at `/llms.txt`, follow indexes, and record the pages needed for each answer. Verify these tasks against the canonical source and the released CLI where applicable:

- Install proxymock on Linux and distinguish that installation from speedctl and the Kubernetes operator.
- Find the local record, mock, and replay workflow, including which process stays running.
- Find the MCP tool parameters for recording traffic and cite the exact reference heading.
- Find current release notes and identify the version and date for a command change.

A successful retrieval contains the correct command or parameter, an applicable platform/version, and a canonical source citation. Record wrong-page fetches and missing answers. Fix the relevant reference page when an answer is incomplete; do not add an independent summary that can drift from the source.

## Request metrics

Use existing CDN access logs, where available, for Markdown/index requests and retrieval 404s. Browser analytics only measures clients that execute its script. Group identified agent user agents separately from generic Markdown clients and exclude internal probes, preview traffic, uptime checks, and scanners. Verify whether logs capture the original or rewritten URI before assigning formats. Count requests separately from human page loads and sessions. User-agent strings and Markdown routes alone cannot establish the total number of AI readers.

Review recurring failed routes and the retrieval evaluation together. Track answer correctness, canonical citations, and unnecessary fetches before introducing a hosted docs search service.
