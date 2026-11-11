---
description: "Reference for the generator.browser section of a Speedscale test config, which runs Playwright browser journeys instead of recorded requests: journeys, base URL, workers, proxy and responder settings, blocked URLs, timeout, storage state and tokens."
sidebar_position: 5
---

# Browser

The `generator.browser` section turns a replay into a browser journey replay: the generator runs Playwright specs in Chromium instead of sending recorded requests. [Browser Journeys](../../guides/browser-journeys/index.md) explains how to write, run and read them.

`proxymock replay --browser`, `proxymock cluster replay start --browser` and the dashboard's replay launcher fill this section in for you. Set it yourself to run journeys from your own test config.

```json
{
  "generator": {
    "browser": {
      "enabled": true,
      "baseUrl": "http://shop-frontend.web:80",
      "responderProxy": true,
      "workers": 2,
      "journeyTimeout": "60s",
      "blockPatterns": ["**/www.googletagmanager.com/**"],
      "storageState": {
        "cookies": [
          { "name": "session", "value": "${{secret:shop-session/cookie}}", "domain": "shop-frontend.web" }
        ]
      }
    }
  }
}
```

## Fields

| Field | Type | Default | Description |
|---|---|---|---|
| `enabled` | boolean | `false` | Run browser journeys instead of the recorded requests. |
| `journeysDir` | string | none | A folder of Playwright specs on the generator's filesystem. Its `node_modules`, when present, supplies the journeys' dependencies and the `@playwright/test` version they run with. `proxymock replay --browser` sets it. |
| `journeyFiles` | map of string to string | none | Spec files carried in the config, keyed by path relative to the journeys root, for a generator that cannot read the author's files. Merged over `journeysDir` when both are set. Without either, the journeys stored with the snapshot run. |
| `baseUrl` | string | the replay's default target | The frontend URL relative URLs in the journeys resolve against. |
| `workers` | integer | `1` | How many journeys run at once, each in its own browser context. |
| `journeyTimeout` | duration | Playwright's default (30 seconds) | The longest one journey may run, such as `"60s"`. |
| `responderProxy` | boolean | `false` | Send the browser's traffic through a responder running beside it, which answers the calls the recording has and passes every other host through. In a cluster the operator adds the responder to the generator pod. See [Mocks and real APIs](../../guides/browser-journeys/mocks-and-real-apis.md). |
| `observeRealApis` | boolean | `false` | With `responderProxy`, send every call to the real API instead of answering from the recording, and compare each answer with the recorded call it matches. |
| `proxy` | string | none | Send the browser's traffic through this HTTP proxy instead, such as `proxymock mock` at `http://localhost:4140`. Wins over `responderProxy`. |
| `proxyBypass` | list of strings | none | Hosts that skip `proxy`, in Playwright's bypass format. |
| `ignoreHttpsErrors` | boolean | `false` | Accept any TLS certificate, needed when a proxy intercepts HTTPS. |
| `blockPatterns` | list of strings | none | URL globs aborted in the browser, for analytics, chat and error-reporting scripts that make journeys nondeterministic. |
| `storageState` | object | none | Cookies and local storage every journey starts with. See [Storage state](#storage-state). |
| `tokens` | list | none | Tokens minted once before the journeys start, for `${{token:<name>}}` in the storage state. See [Tokens](#tokens). |

A journey replay normally runs with `cluster.replayMode` set to `generator-only`: the responder it needs runs inside the generator pod, so a separate responder deployment has nothing to answer.

## Storage state

| Field | Description |
|---|---|
| `cookies[].name`, `cookies[].value` | The cookie. The value can be or contain a `${{secret:name/key}}` or `${{token:<name>}}` reference. |
| `cookies[].domain` | The cookie's domain, such as `shop.example.com` or `.example.com`. |
| `cookies[].path` | Defaults to `/`. |
| `cookies[].httpOnly`, `cookies[].secure` | The cookie's flags. |
| `cookies[].sameSite` | `Strict`, `Lax` or `None`. Defaults to `Lax`. |
| `origins[].origin` | `scheme://host[:port]`, such as `https://shop.example.com`. |
| `origins[].localStorage` | Local storage keys and values for that origin. Values can contain references like cookie values. |

In a cluster the operator mounts the Kubernetes secrets the references name, and the generator fills the values in before the first journey starts. It writes the resolved state to a file only it can read and removes it after the run.

## Tokens

| Field | Description |
|---|---|
| `tokens[].name` | The name `${{token:<name>}}` refers to. |
| `tokens[].fetch` | A `token_fetch` or [`oauth_client_credentials`](../../guides/transformation/transforms/oauth_client_credentials.md) transform, as `{ "type": ..., "config": { ... } }`. Values can reference `${{secret:name/key}}`. Its `prefix` setting does not apply. |

Each token is minted once, before the first journey starts, and is not refreshed during the run. [Start signed in](../../guides/browser-journeys/write-journeys.md#start-signed-in) has a worked example.

## Goals

A journey replay reports the `browserJourneyPassPct` metric and web vitals metrics such as `browserLcpP95`, which [goals](./goals.md) can use. [Read the results](../../guides/browser-journeys/read-results.md#goals) lists them all.
