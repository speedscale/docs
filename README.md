[![Build](https://github.com/speedscale/docs/actions/workflows/main.yaml/badge.svg)](https://github.com/speedscale/docs/actions/workflows/main.yaml)

# Website

This website is built using [Docusaurus 2](https://docusaurus.io/), a modern static website generator.

### Installation

```
$ yarn
```

### Local Development

```
$ yarn start
```

This command starts a local development server and opens up a browser window. Most changes are reflected live without having to restart the server.

### Build

```
$ yarn build
```

This command generates static content into the `build` directory and can be served using any static contents hosting service.

### Deployment

Using SSH:

```
$ USE_SSH=true yarn deploy
```

Not using SSH:

```
$ GIT_USER=<Your GitHub username> yarn deploy
```

If you are using GitHub pages for hosting, this command is a convenient way to build the website and push to the `gh-pages` branch.

### Partials

`.mdx` files beginning with a `_` character are partials. These are useful for including a piece of content in multiple locations, such as tables of annotations that can be inserted both in their relevant section, as well as stored in a single reference location.

### Dead Links

If you delete a page you should create a redirect for it so that it doesn't break links.  This configuration is located in the [docusaurus config](./docusaurus.config.js)

### AI Citation Readiness Checklist

Use this checklist when adding or updating docs pages:

- Start with a plain-language definition of what the feature does.
- State who should use it and when to use it.
- Keep terminology consistent with canonical terms (`Speedscale`, `proxymock`, `snapshot`, `replay`, `transform`).
- Use clear headings and short sections that can be quoted out of context.
- Prefer decision/comparison tables for "which option should I choose" content.
- Align product descriptions with `speedscale.com` and `llms.txt` wording.

### Public Writing Checks

Follow the [repository public-writing rules](./AGENTS.md#public-writing) and run `yarn check:writing` before pushing documentation changes. It checks added public prose by default, while `yarn check:writing --all` reports the existing backlog. The same checker runs in pull request and main-branch CI.

### Dependency Maintenance

The docs maintainer reviews npm dependencies and GitHub Actions at least monthly and opens a maintenance PR when updates are justified. Routine Dependabot version-update PRs are disabled. GitHub vulnerability alerts remain enabled; automatic security-update PRs are currently disabled.

1. Review the repository's [vulnerability alerts](https://github.com/speedscale/docs/security/dependabot) and run `yarn audit` and `yarn outdated`. Triage new advisories promptly: record the affected dependency, advisory, available fix, and impact in Linear. Security fixes take priority over the monthly review. Record any deferred finding and its reason.
2. Read upstream release notes before choosing versions. Keep Docusaurus packages aligned, check React compatibility, and inspect `package.json` overrides in `resolutions`; a dependency bump can be ineffective when an override still pins the old version. Handle major upgrades separately when they require migration work.
3. Update the selected dependencies and matching overrides, then run `yarn` to regenerate `yarn.lock`. Review the lockfile diff for unexpected dependency changes. For GitHub Actions, retain full commit-SHA pins and update their version comments from the corresponding upstream releases.
4. Validate with `yarn --frozen-lockfile`, `yarn test:writing`, `yarn check:writing --base origin/main`, `node --test scripts/security-regressions.test.mjs`, and `yarn build`. Run any additional regression tests affected by the update. Compare vulnerability findings before and after the change.
5. Open one PR for a coherent maintenance batch. Explain why the updates are needed, identify behavior changes and remaining advisories, and include validation results. Inspect the published preview, including affected diagrams, search, redirects, and navigation, before requesting human review.

Vulnerability alerts and their triage are separate from version-update automation. Keep alerts enabled in the repository settings when changing this process.
