# Transform guidance and search dialog review evidence

Original screenshots: published docs.speedscale.com on November 5, 2026. Candidate screenshots: isolated local production build at commit 02dda81, using live public Algolia search without response stubs. Desktop: 1440x1000. Mobile: 390x844.

All three original guides claim the configuration UI is being built. The candidate replaces only those passages with the existing Prepare, preview, save and replay workflow.

Original search container: role=button, aria-labelledby=docsearch-label, no aria-modal; zero dialogs in the accessibility tree. Candidate: role=dialog, aria-labelledby=docsearch-label, aria-modal=true; accessibility tree starts with dialog "Search". Input focus, Command-K, results, keyboard selection, Escape dismissal and focus return pass at both widths. No screen-reader session was run.
