---
title: Coverage
description: "The Coverage readiness family compares the inbound endpoints a replay exercised with the ones production hit over the coverage window and grades the share of production call volume represented."
sidebar_position: 5
---

# Coverage

Coverage grades how much of production the replay reached.

The inbound endpoints the replay exercised are compared with the ones the service's recorded traffic hit over the coverage window, and the measure is the share of production call volume that landed on endpoints the replay exercised.

Covering the busy endpoints counts for more than covering many rare ones.

The default role is Off.

The same share is the coverage factor of [confidence](./how-grading-works.md#confidence), and that factor applies whatever the family's role.

## The production window

Production is the service's recorded inbound traffic in the window that ends at the replay's start.

The window defaults to 14 days and is set on the [Readiness tab of the test config](./test-config-settings.md#windows) between 1 and 90 days.

One lookup runs per service of the report, listing the busiest endpoints up to the gateway's cap of 200.

When a service has more endpoints than that, the family is marked truncated: calls beyond the listed endpoints stay in the production total as not represented, and a replayed endpoint beyond the cap reads as not in production.

Endpoints are matched by method and path with every identifier-shaped segment folded to `{id}`, on both sides, so `GET /v2/orders/{id}` in production meets `GET /v2/orders/8f3c` in the replay.

## When the family is n/a

| Sentence on the report | Cause |
|---|---|
| "Production traffic was not looked up for this replay." | The report was analyzed without a production lookup. |
| "Production traffic for `<service>` could not be loaded: `<error>`." | The lookup failed. |
| "No recorded traffic for `<service>` in the 14 days before this replay." | Nothing was recorded in the window. |
| "The replay sent no inbound calls to compare with production." | The replay had no inbound traffic. |

The tile reads "not looked up", "lookup failed", "no recorded traffic" or "no inbound calls", and the first and third link to the service's traffic for the window.

## Findings and check ids

| Check id | Meaning | Count |
|---|---|---|
| `endpoint_not_exercised` | A production endpoint the replay never called: "GET /v2/orders carried 12% of production calls and was not replayed." | Its production calls |
| `status_class_not_exercised` | A status class production returned on an endpoint the replay called without ever getting that class: "GET /v2/orders/\{id\} returned 4xx on 310 calls in production and never in the replay." The field path is the class. | Production calls with that class |
| `endpoint_not_in_production` | A replayed endpoint production did not hit in the window: new, or test-only. Informational; it never lowers the measure. | Its replay calls |

The detail groups them as **Replay more** (the first two; the fix is a fuller snapshot, not a code change), **New or test-only** and **Accepted**.

Accepting an unexercised endpoint takes its calls out of the production total, and its status classes out of the status-class total.

Accepting an unexercised status class takes that pair out of the status-class total.

Accepting a replay-only endpoint changes nothing.

## What the detail shows

The headline reads like "75% of production calls; B at >= 85%. The floor is B at 85%."

The detail sentence is "The replay exercised N of M production endpoints, carrying X% of the C calls recorded in the 14 days before it; the K endpoints not replayed carried Y%." followed, when they exist, by the replayed endpoints not seen in production and "N of M status classes production returned were seen in the replay."

The detail page shows three numbers (production calls represented, endpoints exercised, status classes seen), the window, the services and the replay's inbound call count, and an Endpoints table sorted busiest in production first.

A row with no replay calls was not exercised; a row with no production calls is new or test-only.

Status classes are shown for both sides, and a class that came back in production and never in the replay is highlighted.

The table filters to Not replayed or Replay only, and a truncated lookup shows a notice.

## What moves the letter

Up to two steps, each one unexercised endpoint, busiest first: "Replay GET /v2/orders; it carried 12% of production calls. Coverage 75% to 87%."

The Requests action opens the Accuracy tab, which lists the replayed inbound calls the production surface was compared with.
