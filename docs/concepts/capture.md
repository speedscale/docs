---
sidebar_position: 1
---
# Capturing Traffic

<iframe src="https://player.vimeo.com/video/986454551?badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479" width="640" height="582" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>
<p><a href="https://vimeo.com/986454551">Bootstrapping Traffic Capture</a> from <a href="https://vimeo.com/speedscale">Speedscale</a> on <a href="https://vimeo.com">Vimeo</a>.</p>

Speedscale captures [traffic](/reference/glossary.md#traffic) flowing through your application.
This includes inbound as well as outbound, and is usually handled by a [proxy sidecar](/reference/glossary.md#proxy) added to your workloads.

## Why capture traffic?

Capturing traffic is necessary for replaying traffic.
This is more accurate than simulated tests because it's the actual data that would flow through your application.
By using real data, it is easier to diagnose and reproduce problems, such as an occasional spike in traffic that causes downtime.

Additionally, that data can provide a basis for load testing.
Using Speedscale's test configurations, the traffic can be multiplied, replayed
over a longer period, or have various errors introduced to do chaos testing.

## Snapshots

A snapshot is a point in time set of captured traffic. It contains all the
inbound and outbound traffic to and from a service to be used for a replay
later on. A snapshot is created using a set of filters, the minimum set being
the service and time range. More filters can be added [as shown
here](/guides/creating-a-snapshot.md).

In addition to filtering, snapshots can be transformed before use in replays.
For eg. you may have timestamps as part of the header in your captured ingress
and your application rejects timestamps older than an hour. You can configure
[Traffic Transforms](/guides/transformation/overview) to achieve this.

## The Request Response Pair

Snapshots, as referenced above, are made up mostly of request / response pairs,
with a bit of metadata on top.  The request / response pair, often referenced
as just [RRPair](/reference/glossary.md#rrpair), is the Speedscale internal representation in which all traffic
is stored. The Goproxy sidecar stores captured traffic as RRPairs, a snapshot
is made of a collection of RRPairs, and new RRPairs are created and modified
during a replay. As suggested by the name RRPairs contain a request and
associated response with all of the details parsed into individual fields.

