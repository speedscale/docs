# Tutorial frame naming evidence

Published baseline: docs.speedscale.com on November 5, 2026. Candidate: isolated local production build, source commit recorded in the pull request. Both pages use live YouTube responses without stubs. Desktop 1440x1000; mobile 390x844.

Before: Chromium Accessibility.getFullAXTree exposes Iframe with an empty name. After: Speedscale Traffic Viewer tutorial and Traffic Transform Templates tutorial. Playwright ariaSnapshot omits these names, so the Chromium accessibility tree is the asserted evidence. No screen-reader session was run.

The frame URLs, permissions, dimensions and rendered geometry are identical. On both pages and widths, Tab from the preceding native link/button reaches Play video and Enter starts real playback (time above one second, readyState 4, paused false, no error). Screenshots show layout; the JSON records semantic and playback results.

Run with Node and Playwright installed: node verify.cjs https://docs.speedscale.com before-layout or node verify.cjs http://127.0.0.1:31843 after. Optional CHROMIUM_EXECUTABLE_PATH selects a browser binary. Public pages only; no login, test data or remote objects. All owned browsers closed after capture.
