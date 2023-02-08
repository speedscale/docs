---
sidebar_position: 1
---

# Traffic

The traffic section contains high-level, and commonly modified, settings for
the [generator and responder](../../../concepts/replay).

The tool tip for each setting should point you in the right direction and more nuanced settings are covered here.

## Endpoint Grouping

Traditionally the
[latency summary table](../../../guides/reports/performance-details/#latency-summary)
is provided with the raw endpoints observed during replay, but a common pattern
in API design involves embedding identifiers as a part of the URL.  This leads
to so many entries in the table that they are no longer useful.

Here the `/user/{id}/registration` endpoint has a new entry for each user.

![summary-no-group](./endpoint-summary-no-group.png)

By providing endpoint regex patterns in the test config we can group distinct
URLs together into what we would call a single API endpoint in an API server.

Using regular expressions (regex) we can group endpoints so they make more sense.  Here
we set the **Endpoint regex** pattern to `/user/.*/registration`.

![endpoint-grouping](./endpoint-grouping.png)

Now replays run with this test config will provide a more concise latency summary table.

![summary-with-group](./endpoint-summary-grouped.png)

And using the exact same pattern in [goals](../goals/) will set thresholds for the endpoint group.

![goals-endpoint-filter](./goals-endpoint-filter.png)

### Regex Troubleshooting

We recommend validating your regex by navigating to
[regex101.com](https://regex101.com/) and selecting the **Golang**
flavor on the left.

- both **Endpoint regex** and **Method regex** are optional
- an endpoint may only match 1 pattern so place more specific patterns at the top
- partial text will match, for example the pattern `cond` will match the endpoint `/first/second/third`

