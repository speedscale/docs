---
title: Explore and heal journeys
description: "Let proxymock write a Playwright journey from a recorded user session, by finding the clicks and form fills that make the user's API calls with the API answered from the recording, and propose a new locator for a step whose element moved, accepted only when the journey makes the same API calls as the last run where it passed."
sidebar_position: 2
---

# Explore and heal journeys

`proxymock journeys` writes and repairs journeys with the frontend's API calls answered from a recording by `proxymock mock`. The mock passes nothing through: a call the recording does not have gets a miss instead of reaching the real host. Nothing proxymock clicks reaches a real backend, so exploring a form that places an order or deletes a record changes nothing.

Both commands judge a step by the API calls it makes, which Speedscale already records for every step:

- **explore** writes a journey from a recorded user session. A step counts only when the mock answers its call from the recording.
- **heal** proposes a new locator for a step whose element moved. A replacement counts only when the journey then makes the same API calls as the last run where it passed.

Both need `node` and `@playwright/test` with Chromium, found the same way as for [running journeys on your machine](./run-locally.md).

## Explore a recorded session

A recording holds what real users did, as API calls in order. `proxymock journeys explore` turns one user's calls back into the clicks that make them:

```bash
proxymock journeys explore --in proxymock/recorded --url http://localhost:5173
```

The frontend runs as it is now, with its current code. For each recorded call in turn, proxymock tries the page's links, buttons and forms until an action makes that call and the mock answers it from the recording:

- **Forms are filled with the recorded values.** A call that sent `{"email": "alice@example.com", "password": "..."}` is made by filling the form whose fields are named, labeled or placeholdered `email` and `password` and submitting it. A search sent as `?q=pens` fills a search box.
- **A click that makes no call is found too.** When a form sits behind a link, such as a "New order" page, proxymock tries a click followed by the next action.
- **Every attempt starts from a fresh page.** proxymock repeats the steps found so far before each attempt, so a click that changed the page cannot leak into the next one.

It writes `proxymock/journeys/explored-<session>.spec.ts`, prints each step with the calls it makes, and lists the recorded calls no action made, such as a call made on a timer. Write those steps by hand.

```text
Wrote proxymock/journeys/explored-tok-alice.spec.ts: 6 step(s) making 7 of the session's 7 recorded call(s).

  1. open /
  2. fill email, password
     makes POST /api/login, GET /api/orders, GET /api/orders
  3. click page.getByRole('link', { name: 'Order #2', exact: true })
     makes GET /api/orders/2
  4. click page.getByRole('link', { name: 'Orders', exact: true })
     makes GET /api/orders
  5. click page.getByRole('link', { name: 'New order', exact: true })
  6. fill item, qty
     makes POST /api/orders, GET /api/orders
```

The spec is plain `@playwright/test`. Each step is a `test.step` named after the calls it makes, and it waits for those calls, so the spec fails when the UI stops making them:

```ts
await test.step('fill email, password: POST /api/login, GET /api/orders, GET /api/orders', async () => {
  const call1 = page.waitForResponse((r) => r.request().method() === 'POST' && new URL(r.url()).pathname === '/api/login');
  const call2 = page.waitForResponse((r) => r.request().method() === 'GET' && new URL(r.url()).pathname === '/api/orders');
  await page.getByRole('textbox', { name: 'Email', exact: true }).fill('alice@example.com');
  await page.getByLabel('Password', { exact: true }).fill(process.env.JOURNEY_PASSWORD ?? '');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await call1;
  await call2;
});
```

A secret field, such as a password, PIN or API key, is read from a `JOURNEY_<FIELD>` environment variable and never written into the spec. proxymock prints the variables the spec reads. Set them to the recorded values to replay the journey against the recording.

Add assertions for what the user should see, as for any [journey you write](./write-journeys.md), then replay it with the command proxymock prints.

### Pick the session

proxymock follows the longest session by default. List the sessions and pick one by its id or a prefix of it:

```bash
proxymock journeys explore --in proxymock/recorded --list
proxymock journeys explore --in proxymock/recorded --url http://localhost:5173 --session tok-bob
```

A visit usually starts with a sign-in that has no session yet, so proxymock puts a call made before a session existed into the session it opened: the one whose id its response returned, such as the token a login hands out, or else the session that starts right after it.

### Which recordings work

- **A recording of the browser**, from `proxymock record --browser` or a browser sent through `proxymock record`, has the frontend's calls as it made them.
- **A recording of the backend**, such as a snapshot of the API service, has the same calls inbound. proxymock answers them as outbound calls for the browser, and leaves out the page, its scripts and its images so the frontend loads as it is now.
- **A recording made under another host**, such as an API recorded in a cluster as `orders.shop.svc`, needs `--api-host` set to the host the frontend calls, such as `--api-host localhost:8080`.

- **An API on the frontend's own origin cannot be explored or healed.** The frontend loads straight from its own server, so a call to the same host and port, such as `/api` proxied by a dev server, would reach the real backend. proxymock stops with an error instead. Run the API on its own port, such as the frontend on `localhost:5173` and the API on `localhost:8080`.

If no action makes any recorded call, check that the frontend calls the recorded host, and that `--start` names the page the user started on.

## Heal a journey whose element moved

A journey that fails because a locator no longer finds its element, after a button was renamed or a link moved, can often be repaired without reading the trace:

```bash
proxymock journeys heal --in proxymock/recorded --browser journeys --url http://localhost:5173
```

`--url` takes the frontend as `--test-against` does, so `localhost:5173` works too.

proxymock runs the journeys with the API answered from the recording. For each one that fails on an action's locator, it looks at the page where the step failed and tries the elements that most resemble the lost one. It accepts a replacement only when the journey then passes and makes the same API calls as the newest replay in which it passed:

```text
sign in and open an order (shop.spec.ts): healed
  failed step: Click getByRole('link', { name: 'Order #2' }) at shop.spec.ts:8
  the journey passes and makes the same API calls as in the run where it last passed
  tried page.getByRole('link', { name: 'Order #1', exact: true }): the journey passes, but it makes GET /api/orders/1, which the passing run did not, and it does not make GET /api/orders/2
  tried page.getByRole('link', { name: 'Notebook details', exact: true }): accepted
  - await page.getByRole('link', { name: 'Order #2' }).click();
  + await page.getByRole('link', { name: 'Notebook details', exact: true }).click();
```

The first link in the example resembles the lost one and lets the journey pass, but it opens another order, so it is not a heal. Comparing the API calls turns "the UI moved but the flow is intact" into a fact proxymock checks, rather than a judgment.

When several elements moved, proxymock heals the next failure after each accepted heal, up to five per journey, and accepts them together only when the whole journey passes.

### Review and apply the patch

heal never changes a journey on its own. It writes the accepted heals as a patch, `journey-heal.diff`, beside the journeys folder. Its paths start at your git repository's root, or at the patch's own folder outside a repository, and heal prints where to apply it from:

```bash
git apply e2e/journey-heal.diff
```

Run it again with `--write` to apply the heals to the journey files instead.

### What heal leaves alone

- **Assertions.** A failed `expect` can be a real regression, so heal reports it and changes nothing.
- **A locator kept in a variable or built across lines.** heal replaces a locator written inline on the line that acts on it, such as `page.getByRole('button', { name: 'Sign in' }).click()`, including on a page object such as `this.page`.
- **A journey with no passing run.** heal compares against replay output in which the journey passed, read from `browser-journey-results.json` and the traffic beside it. By default it searches the workspace's results. Name another folder with `--baseline`, or replay the journey once while it passes.

A replay's [failure bundle](../../proxymock/guides/replay-verdicts.md) for a journey that failed on a locator names the exact `proxymock journeys heal` command to run.

## From a coding agent

The proxymock MCP server's `browser_journeys` tool runs the same three actions: `sessions`, `explore` and `heal`. heal returns the patch and never writes it, so the agent shows you the diff before anything changes.
