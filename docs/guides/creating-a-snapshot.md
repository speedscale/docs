---
sidebar_position: 5
title: Creating a Snapshot
description: "Create, tune, and restore snapshot traffic in Speedscale for repeatable API replay tests."
---

<iframe title="Speedscale Traffic Viewer tutorial" src="https://www.youtube.com/embed/uxymGbdm_v8?rel=0&modestbranding=1" width="640" height="582" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>

## Observe Traffic

The Traffic Viewer provides a detailed log of every transaction in the system.

Click on one of the instances to open the Traffic Viewer which provides:

* A time picker to look at trends during specific time windows
* Throughput graphs for inbound calls to the service and outbound calls to backend systems
* Filters for searching for specific requests or otherwise customizing the list

![Traffic Viewer](./observe-traffic-viewer.png)

### Filtering <a href="#analyze-steps" id="analyze-steps"></a>

Utilize the filters to drill down even further into a subset of requests or to filter out unwanted traffic like heartbeats.

![Filters](./select-filters.png)

:::info
Did you know that you can filter traffic so that it is never sent to Speedscale cloud? This can help you prevent noise, lower your bill and keep private data safe. Check out the [filters](/reference/filters/README.md) section for suggestions.
:::

:::tip Fitting a large selection into a snapshot
A snapshot supports up to 1,000,000 request/response pairs. Use a **Sampled** filter to reduce a large selection while keeping whole sessions together. For example, keeping one in five sessions reduces the amount of traffic to analyze and replay. See [Sampling a large selection](/guides/creating-filters.md#sampling-a-large-selection).
:::

### Request Response Details <a href="#overview" id="overview"></a>

Clicking on any individual row reveals a Request / Response Pair. This could be for an inbound transaction to the service,
or even a call from the service to a downstream system, even if it uses TLS. The following information is shown in the view:

* **Info** section includes high level details like response code, duration, URL, etc.
* **Request** section includes the Headers and Body that were sent
* **Response** section includes the Headers and Body that were received

![Request Response Pair](../observe-rrpair.png)

Now that you have identified the subset of traffic that you would like to replay, it's time to create a snapshot.

## View Snapshot

A traffic snapshot is created from the selected traffic when running a replay so the same set of traffic can be reviewed and replayed again.

![The Overview tab of a snapshot: whether it is ready to replay, its Tests and Mocks, and its latency and throughput](./snapshot.png)

In addition to these details, a Service Map visually represents the inbound and outbound traffic, and how the replay will be orchestrated.

![Service Map](../select-service-map.png)

### Lock a snapshot

If other teams or CI pipelines depend on a snapshot, you can lock it from the **⋮** menu so it cannot be renamed, edited, reanalyzed, or deleted until the locking user or an Admin unlocks it. See [Locking a Snapshot](/guides/locking-a-snapshot.md).

## Tune and inspect a snapshot

The snapshot page has four tabs: **Overview**, **Traffic**, **Prepare** and **Replays**.

**Overview** says whether the snapshot is ready to replay and shows what it recorded. **Traffic** is for looking at requests: select Tests, Mocks or one dependency across the top, and use Endpoints, Sessions, Database, Kafka and Findings to read the same traffic in other ways.

![The Traffic tab: Tests and Mocks across the top, the list of requests, and a Changes column that marks the requests with suggestions](./snapshot-traffic.png)

Select a request to read it in the pane beside the list. A request to a mock also has a **Signature** tab, which shows what the mock server matches on. **Recorded** and **After transforms** show one version at a time. **Compare** shows both side by side, highlights what changed, and widens the pane. The **Expand** icon fills the page with the pane, which helps on a small screen, and **Esc** collapses it. It is also on the request viewer on the main **Traffic** page and in reports. **After transforms** and **Compare** show saved transforms, not changes still waiting in **Prepare**.

In **Prepare**, review each suggestion and credential, its proposed transform chain, and the requests that chain matches. Open them in **Traffic** to check the scope. A warning that a chain matches no traffic means its filters need review before the chain can affect a replay. See [Traffic Transformation](./transformation/overview.md).

![The Prepare tab: the list of suggestions, the selected transform chain with its values on a real request, and the requests it matches](./transformation/recommendations/prepare-merged-row.png)

### Restore deleted traffic

If the snapshot has deleted RRPairs, its traffic toolbar offers **Restore deleted (N)**. Open it to see deleted IDs and available audit details. Select individual entries and choose **Restore selected**, or choose **Restore all**.

Restoring removes the deletion entries and triggers reanalysis. The list and traffic grid refresh afterward. The dialog lists IDs rather than the deleted request bodies. Snapshot write restrictions still apply, including locks and operations already in progress. If the control is unavailable on an older deployment, check that the backend supports snapshot restoration.

## Endpoint Grouping
The **Endpoints** view on the **Traffic** tab groups URLs that fall in the same category automatically. In the following picture, every `/api/v3/breachedaccount/{account}` URL has been grouped into one row to give a better view of the results.

![The Endpoints view with /api/v3/breachedaccount/(.*) grouped into one row](../Auto-Endpoint-Grouping.png)

You can also define this grouping yourself with **Manage Regexes** in that view, or in the snapshot definition. For example, adding the following `endpoint_regexes` to the snapshot definition groups all `v1` API calls into one row.
```json
"endpoint_regexes":[
   {
     "url": "/v1/(.*)",
     "method":"(.*)"
   }
]
```


## Transform Traffic

Speedscale provides a sophisticated data transformation system to ensure that traffic replays successfully.

:::info
Before using any custom configuration, attempt a traffic replay with defaults. The default `standard` configuration works in many cases so most users should skip ahead to the next step.
:::

If a replay has low accuracy or unexpected behavior, inspect the affected requests in **Traffic**, then open the snapshot's **Prepare** tab to review suggestions, credentials, and transform chains. Use the chain editor to preview changes against a recorded request, save the configuration, and replay again to check the result. See [Traffic Transformation](/guides/transformation/overview.md) for the workflow. For help with your configuration, ask in the [Speedscale Slack community](https://slack.speedscale.com) or [email support](mailto:support@speedscale.com).
