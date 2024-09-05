# Generator Sizing Guide

When running a load test it is helpful to understand the environmental
requirements for reaching your desired throughput.  After all, setting a target
of 20,000 [RPS](/reference/glossary.md#requests-per-second) in your [test
config](/reference/glossary.md#test-config) won't be enough if the load
[generator](/reference/glossary.md#generator) only has 1 CPU to work with.

Load tests in Speedscale are driven by the generator, a process that sends
requests to your service as fast as possible. This guide will help you
understand the factors that can affect generator throughput and setup your
environment accordingly.

## Factors Affecting Throughput

The largest factor in generator throughput is available CPU. The generator is
CPU bound so more CPU will almost always mean higher potential throughput.  See
[recommended resources](#recommended-resources) for specific information.

:::warning
Latency calculation is no longer reliable once the generator is using at or
close to 100% CPU so it is critical to ensure some headroom.
:::

The second largest factor is the [SUT](/reference/glossary.md#sut), your
application.  Given the same available CPU an application with an average
response latency of 100ms will achieve higher throughput than one with 500ms.

## Recommended Resources

The table below contains observations made while running a replay on servers
with various resources.  It shows the number of (virtual) CPUs available to
the generator, the maximum observed
[RPS](/reference/glossary.md#requests-per-second), and the number of concurrent
[vUsers](/reference/glossary.md#vuser) when that throughput was
observed.  The [SUT](/reference/glossary.md#sut) latency was set at 100ms and
the observation was taken when increasing the vUser count no longer yielded higher
RPS.

| CPU Cores | Observed RPS | vUsers | 
| --------- | ------------ | ------ | 
| 2         | 430          | 100 | 
| 4         | 1,300        | 100 | 
| 8         | 8,000        | 1,050 | 
| 16        | 22,000       | 2,500 |
| 30        | 30,000       | 3,600 | 
| 60        | 45,000       | 5,000 |

:::note
Contact Speedscale support for solutions that scale beyond the observed RPS seen here.
:::

## Configuration

Load tests should always set the [test
config](/reference/glossary.md#test-config) to run with [low data
mode](/reference/glossary.md#low-data-mode) enabled to avoid sending thousands
or millions of [RRPairs](/reference/glossary.md#rrpair) to the Speedscale
cloud.  If the load is high enough the generator will generate requests, and
RRPairs, faster than they can be captured resulting in the generator running
out of memory and crashing.  For the same reason avoid setting the log level
higher than "info" during load tests to avoid flooding the logs with millions
of events which could also cause the generator to crash.

If you are looking to achieve the highest throughput possible you should define
load patterns with vUsers as opposed to setting a desired number of RPS.  This
is because the RPS strategy creates artificial delays in between requests in
order to hold a desired throughput.

See [load patterns](/guides/load-patterns/) for suggestions on simulating specific load patterns.


