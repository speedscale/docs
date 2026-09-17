---
description: "Explore how to implement Chaos Engineering with Speedscale to test API resilience by simulating failures and manipulating request behaviors for robust applications"
sidebar_position: 6
---

# Chaos Engineering (API)

[Chaos Engineering](https://en.wikipedia.org/wiki/Chaos_engineering#Days_of_Chaos) means designing experiments to ensure that your service will tolerate failures adequately. This term was popularized by Netflix in the early 2010's and was initially focused on experiments involving infrastructure failures like network latency or server failure.

Speedscale introduces chaos at the API level by manipulating individual request response times, status codes and data patterns. For example, Speedscale service mocks can automatically slow down an occasional transaction (versus an entire network connection) or produce an occasional error at random. This is the type of behavior commonly seen when using 3rd party APIs over the internet. Running a chaos oriented test in addition to a stress test provides an extra level of safety for a new build of your code. 

The Speedscale chaos approach is complementary to infrastructure experiments provided by tools like [Gremlin](https://www.gremlin.com/) or [Chaos Monkey](https://netflix.github.io/chaosmonkey/).

## Combine chaos with endpoint load

[Endpoint and session load plans](../guides/replay/endpoint-session-load-plans.md) choose which traffic starts and when; chaos rules change request behavior. For example, ramp statement traffic and fail its dependency while keeping transaction posting steady, then remove chaos and check recovery. The [banking how-to](../guides/replay/endpoint-load-how-to.md) includes an executable scoped dependency-failure test.
