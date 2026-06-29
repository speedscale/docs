---
description: "Modify tests and mock responses in proxymock recordings effortlessly with this guide, ensuring updates reflect in future test runs."
sidebar_position: 5
---

import RRPairList from './modify-rrpairs/rrpair-list.png'
import RRPairDetail from './modify-rrpairs/rrpair-response-detail.png'

#  Modifying Tests/Mocks

Use this guide to  modify your tests or mock responses in an existing proxymock recording. Any modifications made will automatically show up the next time you run proxymock.

## Before you begin

Make sure you have:

- proxymock [installed](../getting-started/quickstart/quickstart-cli.md)
- existing proxymock recording (like this [one](https://github.com/speedscale/mock-lab/tree/main/lab/proxymock))
- (optional) set $EDITOR environment varaible inr your terminal (ex: `export EDITOR=code`)

## Editing from the TUI

proxymock provides a terminal UI for viewing request/response pairs (RRPairs). Open this view opening a terminal,  switching to the parent directory of your recording and running:

```shell
proxymock inspect
```

<img src={RRPairList} alt="proxymock tui" width="500" style={{ display: 'block', margin: '0 auto' }} />

Press the `e` key to open an RRPair in your editor of choice. Your `$EDITOR` environment variable must be set for this to work.

Modify the RRPair and save the file. proxymock will **automatically** update its view. The next time you run proxymock as a mock or test server the new data will be used.


## Editing raw files

If you don't want to use the terminal UI, you can navigate the proxymock files and edit them like normal markdown. Each recording is srored in its own directory under the `proxymock` parent directory.


For more information about the RRPair file format, check this [link](../how-it-works/rrpair-format.md).
For more information about how mock signatures are built from the raw traffic recording see this [link](../how-it-works/signature.md).

## Applying transforms in proxymock web

The TUI and raw-file edits above change the recorded data in place. When you instead want to *overlay* a change at run time — swap an expired token, mask a field, substitute a constant — apply a **transform** from the request detail in `proxymock web`. Transforms are saved as [blueprints](./recommendations.md#inspecting-and-editing-the-blueprint) and applied every time you run proxymock as a mock or test server; the recording itself is untouched.

Start the web UI from the parent of `proxymock/`:

```shell
proxymock web
```

Open a request in the **Requests** grid to see its RRPair detail, then add a transform to the field you want to change:

- **Header or query field** — in the **Request** or **Response** tab, hover the row and click the transform (wand) icon next to the value.
- **Body field** — open the **Body** tab and right-click the line you want, then choose **Add transform…**.

Either opens a short menu of transforms — *Replace with constant*, *Smart replace*, *Store in variable*, and the rest of the [transform library](/guides/transformation/transforms). Pick one, fill in any value it needs, and proxymock writes a rule into a blueprint named **Field Transforms**, scoped to that request's endpoint and method. The rule is active immediately and applies on your next run.

<!-- screenshot: RRPair detail with the field transform menu open on a response body field -->

You can review and edit every rule in the **Blueprints** tab — the same place the [recommendations workflow](./recommendations.md) lands its rules.

## Previewing blueprint impact

Before you replay, you can see exactly what the active blueprints will change. In the **Requests** grid, switch the lens to **Preview blueprints**. proxymock applies the blueprints to the current run's traffic in memory and shows a before/after diff of every request they touch — no replay required.

The card above the grid steps through each change one at a time. Use **‹** / **›** to walk them: each step opens the affected request, names the field and the rule that changes it, and highlights the change in the before/after view.

<!-- screenshot: Preview blueprints lens with the change stepper card -->

This is the quickest way to confirm a new rule does what you expect — and only what you expect — before committing to a full replay.