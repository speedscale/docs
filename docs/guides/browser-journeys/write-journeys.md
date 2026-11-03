---
title: Write journeys
description: "Write Playwright specs that Speedscale and proxymock can replay as browser journeys: file names, relative URLs, named steps, recording a journey with proxymock, starting signed in with a storage state and fresh tokens, and keeping journeys deterministic."
sidebar_position: 1
---

# Write journeys

A journey is an ordinary Playwright test. If your team already has Playwright specs for the frontend, they are journeys as they are. This page covers what a replay expects of them.

## A journey

```ts title="journeys/checkout.spec.ts"
import { test, expect } from '@playwright/test';

test('shopper checks out', async ({ page }) => {
  await page.goto('/');

  await test.step('add an item to the cart', async () => {
    await page.getByRole('button', { name: 'Add to cart' }).first().click();
    await expect(page.getByTestId('cart-count')).toHaveText('1');
  });

  await test.step('check out', async () => {
    await page.getByRole('link', { name: 'Checkout' }).click();
    await expect(page.getByRole('heading', { name: 'Thank you' })).toBeVisible();
  });
});
```

## What a replay expects

- **Spec file names.** A replay runs files named `*.spec.*` or `*.test.*`, such as `checkout.spec.ts`. Other `.ts`, `.js`, `.json`, `.csv` and `.txt` files in the folder, such as page objects, helpers and fixture data, come along so specs can import them.
- **Relative URLs.** Open pages by path, such as `page.goto('/cart')`. The replay sets Playwright's base URL to the frontend you name, so the same spec runs against a laptop, a staging cluster or production.
- **Imports.** On your machine, specs run with the `@playwright/test` installed in or above the journeys folder, along with any other packages there. In a cluster the generator image provides `@playwright/test`, and no other npm packages are installed, so specs can import `@playwright/test` and their own files only.
- **No Playwright config.** The replay writes its own config and ignores yours. Set parallel workers, the per-journey timeout and blocked URLs in the [test config](../../reference/configuration/browser.md) or with `proxymock replay` flags instead.
- **Size.** A replay that carries journeys to a cluster packs at most 5 MB of them. `node_modules`, `test-results`, `playwright-report` and `.git` are left out.

Every run is headless Chromium with no retries. A trace and a screenshot are kept for each failed journey only. `test.only` fails the run, so a spec left focused while debugging cannot hide the others.

Service workers are blocked in the browser. A service worker would answer requests that neither the proxy nor the report can see.

## Name the steps

The report shows each journey as the steps Playwright reported, and credits every request the browser made to the latest action or `test.step` that began at or before it. Playwright actions such as `page.goto` and `locator.click` are named for you. Wrap a group of actions in `test.step` to give the calls they cause a name your team recognizes, such as `check out` in the example above.

A request that starts before the first step, such as a favicon fetched while the page opens, is counted for the journey but not for a step.

## Record a journey

proxymock can write a journey for you while it records the frontend's API calls:

```bash
proxymock record --browser http://localhost:3000
```

A Chromium window opens on the URL, driven by Playwright's code generator. Click through the journey and close the window to stop. proxymock writes the spec as `journeys/recorded-<time>.spec.ts` inside the recording, with the frontend's own URLs rewritten as paths so it replays against any frontend. The API calls the frontend made are saved in the same recording, ready to answer the journey's calls during a replay.

`proxymock record --browser` needs `node` and `@playwright/test` with Chromium installed in or above the current directory. Set `SPEEDSCALE_PLAYWRIGHT_DIR` to a directory that has them to use another install.

Treat a recorded spec as a first draft. Add assertions for what the user should see, and wrap the actions in named steps.

## Start signed in

Most journeys start behind a login. Rather than typing a password in every spec, give the replay a storage state: the cookies and local storage every journey's browser starts with.

```json
"browser": {
  "enabled": true,
  "storageState": {
    "cookies": [
      {
        "name": "session",
        "value": "${{secret:shop-session/cookie}}",
        "domain": "shop.example.com",
        "secure": true,
        "httpOnly": true
      }
    ],
    "origins": [
      {
        "origin": "https://shop.example.com",
        "localStorage": { "featureFlags": "{\"newCheckout\":true}" }
      }
    ]
  }
}
```

Any value can be, or contain, a `${{secret:name/key}}` reference. In a cluster the operator mounts the named Kubernetes secrets into the replay and the generator fills the values in. On your machine the values come from [proxymock secrets](../../proxymock/guides/secrets.md). A cookie's path defaults to `/` and its SameSite to `Lax`.

### Fresh session tokens

A recorded session cookie expires. When your app accepts a token from an identity provider, mint one when the replay starts and put it in the storage state with `${{token:<name>}}`:

```json
"browser": {
  "enabled": true,
  "tokens": [
    {
      "name": "session",
      "fetch": {
        "type": "oauth_client_credentials",
        "config": {
          "tokenUrl": "https://login.example.com/oauth2/token",
          "clientId": "${{secret:shop-idp/client_id}}",
          "clientSecret": "${{secret:shop-idp/client_secret}}",
          "scope": "shop.read shop.write"
        }
      }
    }
  ],
  "storageState": {
    "origins": [
      {
        "origin": "https://shop.example.com",
        "localStorage": { "accessToken": "${{token:session}}" }
      }
    ]
  }
}
```

`fetch` takes a `token_fetch` or [`oauth_client_credentials`](../transformation/transforms/oauth_client_credentials.md) transform. Its `prefix` setting does not apply: `${{token:session}}` is replaced with the raw token. Each token is minted once, before the first journey starts, and is not refreshed during the run, so keep the run shorter than the token's lifetime.

## Keep journeys deterministic

Third-party scripts such as analytics, chat widgets and error reporters make journeys slow and flaky, and their calls are rarely in a recording. Block them in the browser:

```bash
proxymock replay --browser ./journeys --browser-block '**/*.hotjar.com/**' --browser-block '**/www.googletagmanager.com/**' ...
```

In a test config, list the same globs in `blockPatterns`. A blocked request is aborted before it leaves the browser.
