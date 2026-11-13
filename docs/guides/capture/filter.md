---
description: "Explore the Speedscale Traffic View to filter and replicate traffic, inspect transactions, and create environment snapshots for effective API testing."
sidebar_position: 2
---

import ViewTagsImg from './filter/snapshot-actions.jpg'
import RawSizeImg from './filter/raw-size.png'

# Traffic View

Speedscale replicates environments by replicating traffic. Selecting what traffic to replicate allows you to select which databases and endpoints will be included in the environment snapshot. By filtering the traffic viewer, you are selecting which set of inbound and outbound peers will be present when Speedscale replicates the environment. For instance, if Speedscale sees even one Postgres SELECT statement in traffic viewer then it will stand up a Postgres mock with that query loaded. The Speedscale traffic viewer allows you to inspect inbound and outbound transactions. The amount of data can become overwhelming and so you will want to filter down the window of visibility. When creating snapshots, the filter will also determine what parts of the environment are replicated.

Keep in mind that the Traffic Viewer continually refreshes. In logging tools this is called a "live tail" and means by default new traffic will appear at the top of the list. Traffic Viewer is not perfectly real time but generally observed requests show in the UI within a minute or less.

:::tip
A filter query string determines which traffic is included in a view (or snapshot). The filter query string follows a fairly straightforward filter syntax that you can learn about in the [guide](../creating-filters.md). As the traffic viewer view changes, the underlying filter query string also changes.
:::

### Request Response (RRPair) Details <a href="#rrpairs" id="rrpairs"></a>

Clicking on any individual row reveals a Request / Response Pair. This could be for an inbound transaction to the service, or even a call from the service to a downstream system, even if it uses TLS. The following information is shown in the view:

* **Info** section includes high level details like response code, duration, URL, etc.
* **Request** section includes the Headers and Body that were sent
* **Response** section includes the Headers and Body that were received

![Request Response Pair](../../observe-rrpair.png)

Now that you understand how to view an individual request, you will want to start working with groups of traffic and that means filters.

:::tip
Additional tabs may appear with analysis or potential actions for the specified RRPair. For example, Speedscale automatically decodes JWT headers and displays details in the `Auth` tab.
:::

## Simple Filters <a href="#simple-filters" id="simple-filters"></a>

When getting started with the traffic viewer, you'll want to select three key filter criteria:
* Time range - Speedscale defaults to 15 minutes but this can stretch for days or even weeks.
* Services - Define the services to be replicated. Services are the containers you will be performance testing, etc. There can be more than one in a single snapshot
* Inbound and outbound dependencies - If you'd like to view/replicate a frontend and backend service, that's ok. But you don't need to include things like monitoring systems and heartbeats.

As you use cases get more advanced you can explore more complex filters, but these are the most important to get started with.

Editing simple filters can be accomplished in different three ways:

1. *Filter editor* - Click the **Filters** bar at the top to open the editor. Click a single filter in the bar to open the editor on that filter. See [The filter editor](#filter-editor) below.

![ui_filters](./filter/filters.png)

2. *Left sidebar* - Common filter criteria can be modified using left sidebar checkboxes.

![facets](./filter/facets.png)

3. *Shortcuts* - Some data can be quickly filtered on. Look for the small magnifying glasses next to some fields.

![shortcuts](./filter/shortcuts.png)

## The filter editor <a href="#filter-editor" id="filter-editor"></a>

The filter editor reads like a sentence: "Requests in the selected time range that match all of these", followed by one row per filter. The same editor is used everywhere you pick a subset of traffic, including snapshots, reports, filter rules, transform chains and test configs.

Each row is one field, a comparison and one or more values. Add a value by typing it and pressing Enter, or by picking a suggestion. Several values in one row read as "Service is orders or payments": "is" matches any of the values, and "is not" or "doesn't contain" exclude all of them. For "contains", click the word between two values to switch between "or" and "and".

Click **Add a filter** to pick a field. The field list is searchable and grouped by where the value comes from: where the request ran, the request, the response, identity, replay and testing, and database. Each field offers only the comparisons it supports. For example, Service can only be matched with "is", and Full Text can't be negated.

The word on the left between two rows says how they combine. On the Traffic page every row has to match, because the page also applies its time range. To match "this or that", click **Add an any-of group** and add the alternatives to the group, for example "Response Status is 500" or "Duration is more than 2000 ms". A group has its own all or any choice. Where nothing else applies, such as a filter rule, a test config scope or a chaos rule scope, the top line also lets you choose between all and any, and clicking the word between two rows switches it.

Transform chains, runtime variables and DLP rules store a flat list of filters that all have to match. Their editor has no groups, and an "is" row takes one value.

Below the rows, **Reads as** describes the whole filter in plain language. Rows that are still missing a value are left out until you finish them. **Cancel** discards your changes, and **Apply** applies them. Removing every filter and clicking **Apply** shows all traffic again.

## Complex Filters <a href="#complex-filters" id="complex-filters"></a>

Certain complex filter criteria are permitted when creating a snapshot but not in the Speedscale UI. Generally this involves whole-document payload comparisons like `requestBodyJson`. Request and response body filters on a single key, in JSON, XML, XPath or SOAP form, are available in the filter editor as **Request Body** and **Response Body**. Edit the remaining criteria directly in the filter query string. You may also notice complex JSON representations of filters hidden in the UI. This is the internal Speedscale filter presentation and is not typically edited by users. If you're curious about complex filters you can learn more in this [guide](../advanced-filters.md).

## Saving Traffic <a href="#saving" id="saving"></a>

Clicking the Save button at the top of the Traffic Viewer will cause the current view to be stored for future use. That could mean it's a section of traffic you want to replay or simply view later. Saving a snapshot does not cause additional ingest usage on your account. You should feel free to save snapshots without concern.

Traffic filters can also be saved for use as forwarder filters or snapshot criteria by clicking **Save as filter rule** in the filter editor. A filter rule can compare only one field inside each group, so the button is disabled while a group mixes fields. The Traffic Viewer also employs URL deep links which means you can copy/paste the URL bar in your browser to share a view.

## Resending Requests

You can resend any captured request directly from the traffic viewer. Click on an RRPair to open the detail view, then click the **Resend** button to open the resend panel. From there you can modify headers, body, and URL before sending. The response appears alongside the original for easy comparison. See the full [Resend RRPair guide](../resend-rrpair.md) for details.

## Full-Text Search

The traffic viewer supports full-text search across request and response content. Use the search bar to find specific strings in URLs, headers, and bodies across all visible traffic. This is particularly useful for tracking down requests containing specific tokens, error messages, or field values.

## Request and Response Editor

The RRPair detail view uses a Monaco-based code editor (the same editor that powers VS Code) for displaying request and response bodies.

![RRPair detail view with syntax highlighting](./rrpair-syntax.png)

The editor provides:

- **Syntax highlighting** for JSON, XML, HTML, and other content types
- **Code folding** to collapse and expand nested structures
- **Keyboard shortcuts** — standard editor shortcuts like `Cmd/Ctrl+F` for find, `Cmd/Ctrl+G` for go to line
- **Word wrap toggle** for long lines

## Managing Snapshot Size

:::tip
Snapshots do not have a fixed size limit but extremely large snapshots can time out because they take too much time to process. Beyond warnings in the UI, you'll know this is happening because your snapshot will process for a number of hours and suddenly stop with an error.
:::

Speedscale cloud is designed to horizontally scale analysis jobs but all systems have configuration limits. If your snapshot creation is timing out, follow the procedure below to chop it down to a more manageable size. Generally speaking, snapshot size has no limit but practically speaking snapshots over a few gigabytes become unmanageable simply because files that large take time to move. To handle snapshot creation timeouts you can follow the following procedure:

1. Save a snapshot for a minimal amount of time like 15 minutes (the default)
2. Once this is complete, open the snapshot's **More actions** menu and choose **Inspect data > View tags**. Look for the raw file size.

<img src={ViewTagsImg} width="248" alt="Snapshot actions menu with View tags under Inspect data" />

<a href={ViewTagsImg}>Open the action menu image full size</a>
<img src={RawSizeImg} height="300px" alt="The raw-size snapshot tag used for the size estimate in this example" />

3. Let's assume we want a 1 Gig snapshot since that is fairly easy to work with. We can do some basic multiplication to see that the existing file is roughly 10M and so if we captured 100x as much traffic that would be roughly 1GB. This assumes traffic size is fairly uniform which may or may not be reasonable for your application. Some apps have mid-day spikes so your mileage may vary.
4. Run the same snapshot with 10x the timeframe (150 minutes or roughly 2.5 hours)
5. Repeat step 2.
6. If the snapshot is still too big then apply filters for repetitive or common issues as explained in this [guide](../advanced-filters.md). Eliminating repetitive and useless heartbeats often times is all that is necessary.
7. Repeat until snapshot runs in a reasonable time or fits in your infrastructure expectations.