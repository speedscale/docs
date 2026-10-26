---
title: Browser Journeys
description: "Run your Playwright front-end tests through a Speedscale or proxymock replay: Chromium drives your frontend, the frontend's API calls are answered from a recording or sent to the real APIs, and the report shows each journey's steps, the calls each step made, web vitals, and a screenshot and trace of every failure."
sidebar_label: Overview
---

# Browser Journeys

A browser journey is a Playwright test that clicks through your frontend the way a user does: open the shop, add an item, check out. Speedscale runs your journeys in Chromium as a replay, against the frontend you name, and reports how each one went.

Running journeys as a replay gives you what a plain Playwright run does not:

- **No API tier to deploy.** The browser's calls to your APIs can be answered from a recording, so the frontend runs on its own with realistic data.
- **Each step tied to the calls it made.** The report credits every request the browser sent to the Playwright action or step that caused it, and flags the calls the recording could not answer.
- **Real APIs checked against the recording.** With mocks off, the browser calls the real APIs and the report names the calls whose answer differs from the recording.
- **Web vitals as goals.** Largest Contentful Paint, First Contentful Paint, Time to First Byte and Cumulative Layout Shift are measured on every journey and can fail the replay like any other goal.
- **A screenshot and trace of every failure.** Playwright keeps them for failed journeys. The report shows the screenshot and opens the trace in Playwright's trace viewer, without the trace leaving your browser.

## How a journey replay runs

1. The generator runs your spec files with the Playwright test runner in headless Chromium. Relative URLs in a spec, such as `page.goto('/')`, resolve against the frontend URL you give the replay.
2. The browser's traffic goes through a proxy. With mocks on, a responder answers the frontend's calls to the hosts the recording knows from the recording and passes every other host through. With mocks off, it sends every call to the real API and notes the recorded call it matches.
3. Every request the browser makes is recorded as traffic, tagged with its journey and step, so the report's usual views work on it.
4. Each journey passes or fails as Playwright decides. The replay's goals decide whether the replay as a whole passes.

## Where journeys run

| Where | How | Use it to |
|---|---|---|
| Your machine | `proxymock replay --browser` | Write and debug journeys against a local frontend. See [Run journeys on your machine](./run-locally.md). |
| Your cluster, from the command line | `proxymock cluster replay start --browser` | Run journeys against a frontend deployed in Kubernetes, with or without Speedscale cloud. See [Run journeys in a cluster](./run-in-cluster.md#from-the-command-line). |
| Your cluster, from the dashboard | The replay launcher, on a snapshot that carries journeys | Start the same run from Speedscale cloud and read it as a report. See [Run journeys in a cluster](./run-in-cluster.md#from-the-dashboard). |

## Try it

Record a journey and the API calls behind it, then replay the journey with those calls answered from the recording:

```bash
proxymock record --browser http://localhost:3000
```

Click through the journey in the Chromium window that opens, then close it. proxymock saves the recording, writes the journey as a Playwright spec in its `journeys` folder, and prints the two commands that replay it. Run the first in one terminal and the second in another:

```bash
proxymock mock --in <recording>
```

```bash
proxymock replay --in <recording> --browser <recording>/journeys \
  --test-against http://localhost:3000 --browser-proxy http://localhost:4140
```

## Next steps

- [Write journeys](./write-journeys.md): what a spec needs, how steps are named, and how to start a journey signed in.
- [Run journeys on your machine](./run-locally.md) and [in a cluster](./run-in-cluster.md).
- [Read the results](./read-results.md): the Journeys tab, the calls behind each step, web vitals and goals.
- [Mocks and real APIs](./mocks-and-real-apis.md): how each call the browser makes is answered and scored.
- [Browser test config reference](../../reference/configuration/browser.md): every `generator.browser` setting.

To capture a browser's traffic by hand through Firefox instead, see [Capture browser traffic with proxymock](../browser.md).
