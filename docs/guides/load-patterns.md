---
description: "Discover effective load patterns to optimize performance testing with Speedscale, as detailed in this comprehensive guide. Learn how to simulate real-world traffic scenarios to enhance application resilience and scalability."
sidebar_position: 16
---

# Load Patterns

## Overview

In performance testing, understanding how your system behaves under various conditions is crucial. Different load patterns simulate various real-world scenarios to help you identify potential bottlenecks, optimize performance, and ensure reliability. Here are a few reasons why you need different load patterns:

1. **Identify Performance Bottlenecks**: Different load patterns can reveal how your system handles varying user loads, helping you pinpoint specific issues that arise under certain conditions.
2. **Understand System Capacity**: By testing with different loads, you can determine the maximum number of users your system can handle before performance degrades.
3. **Ensure Stability and Reliability**: Simulating real-world usage patterns helps ensure your system remains stable and reliable under various conditions.
4. **Optimize Resource Utilization**: Knowing how your system responds to different loads allows you to optimize resource allocation and avoid over-provisioning or under-provisioning.

## Types of Load Patterns

In Speedscale, you can configure various load patterns to simulate different user behaviors. The most common load patterns include:

1. **Constant Load**:
    - Simulates a fixed number of users accessing the system over a period of time.
    - Useful for understanding system behavior under a steady-state load.

2. **Ramp-Up Load**:
    - Gradually increases the number of users over a specified period.
    - Helps identify the point at which the system begins to struggle with increased load.

3. **Peak Load**:
    - Simulates sudden spikes in user activity, followed by a return to normal load levels.
    - Useful for testing how the system handles sudden increases in traffic, such as during marketing campaigns or major events.

4. **Soak (Endurance) Load**:
    - Applies a constant load over an extended period.
    - Helps identify potential memory leaks or degradation in performance over time.

5. **Stress Load**:
    - Involves increasing the load until the system breaks.
    - Helps determine the system’s breaking point and understand its limits.

6. **Spike Load**:
    - Introduces a sudden, large increase in load for a short period.
    - Tests the system's ability to handle sudden bursts of high traffic.

:::note
Testers may be used to thinking in terms of [vUsers](/reference/glossary.md#vuser) as representing user flows or sessions. In this document, the term vUser is used interchangeably with "concurrent thread." Sessions are handled elsewhere and setting vUsers in Speedscale will not directly map to what you are familiar with in other traditional testing tools. If you are unfamiliar, it may be easier to think in terms of requests per second or RPS instead of vUsers. This document uses both as examples but feel free to change RPS to vUsers and vice versa. RPS may be a better measurement for stress and performance testing because it better maps to what is expected in production monitoring tools.
:::

:::note
Make sure your desired scenario is not already covered by the default test configs. For instance, `performance_500replicas` already exists by default but is shown here as an example.
:::

## Example Use Cases

### Constant Load Pattern

All examples in this section are created by modifying or creating a new test [config](../reference/configuration/README.md). You can enter these workflows by opening an existing config like [performance_100replicas](https://app.speedscale.com/config/performance_100replicas) and clicking **Copy test config**, or by clicking **Create Test Config**.

Each example edits stages on the test config's **Load Pattern** tab. Click the pencil on a stage to edit it, or **Add stage** to add one, then click **Ok** in the stage dialog and **Save** on the test config.

**Scenario**: A company wants to ensure their e-commerce website can handle a steady stream of 500 concurrent vUsers during normal business hours.

**Implementation in Speedscale**:
1. Create a new Test [config](../reference/configuration/README.md).
2. Open the **Load Pattern** tab.
3. Edit stage 1.
4. Select **vUsers** and enter 500.
5. Run a replay and select this test config.

Your single stage should look something like this:

![The Stage 1 dialog set to run until all requests are sent with 500 vUsers at full speed](./load-patterns/500_vusers.png)

### Ramp-Up Load Pattern

**Scenario**: A new mobile app is launching, and the company expects to send notifications to users throughout the day, causing load to ramp over time.

**Implementation in Speedscale**:
1. Create a new Test [config](../reference/configuration/README.md).
2. Open the **Load Pattern** tab.
3. Edit stage 1. Select **Run for a fixed time** and enter 10800 seconds (3 hours).
4. Set **Ramp Time** to 3600 seconds (1 hour).
5. Select **vUsers** and enter 3000.
6. Run a replay and select this test config.

![The Stage 1 dialog with a fixed time of 10800 seconds, a ramp time of 3600 seconds and 3000 vUsers](./load-patterns/ramp.png)

### Peak Load Pattern

**Scenario**: A ticketing website expects a surge in traffic when concert tickets go on sale.

**Implementation in Speedscale**:
1. Create a new Test [config](../reference/configuration/README.md).
2. Open the **Load Pattern** tab.
3. Edit stage 1. Select **Run for a fixed time** and enter the stage length (e.g., 3600 seconds). Select **Request rate** and enter the expected steady-state or normal load (e.g., 100 TPS). A request rate stage needs a fixed time.
4. Add a stage with the same fixed time and a **Request rate** of the expected peak load (e.g., 3000 TPS).
5. Add a stage with the same fixed time and a **Request rate** of the expected steady-state or normal load (e.g., 100 TPS).
6. Run a replay and select this test config.

You will end up with three stages, shown in the chart and the stages table like this:

![The Load Pattern tab with three one-hour stages at 100, 3000 and 100 TPS and a chart of the peak](./load-patterns/peak.png)

### Soak Load Pattern

**Scenario**: A financial services application needs to be tested for reliability over a 24-hour period.

**Implementation in Speedscale**:
1. Create a new Test [config](../reference/configuration/README.md).
2. Open the **Load Pattern** tab.
3. Edit stage 1. Select **Request rate** and enter the expected average load (e.g., 1000 TPS).
4. Select **Run for a fixed time** and enter 86400 seconds (24 hours).
5. Run a replay and select this test config.

![The Stage 1 dialog with a fixed time of 86400 seconds and a request rate of 1000 TPS](./load-patterns/soak.png)

### Stress Load Pattern

**Scenario**: A social media platform wants to determine the maximum number of concurrent requests it can handle before failure.

**Implementation in Speedscale**:
1. Create a new Test [config](../reference/configuration/README.md).
2. Open the **Load Pattern** tab.
3. Edit stage 1. Select **Run for a fixed time** and enter a long duration (e.g., 1800 seconds), then select **Request rate** and enter an unreasonable amount of load (e.g., 5000 TPS).
4. Run a replay and select this test config.
5. Open the report for the replay you just ran and select the **Performance** tab.
6. If the app can handle the load, throughput climbs to the target and holds steady, as in this report from a 50 TPS replay.

![A report Performance tab where throughput climbs to the 50 RPS goal and holds steady while latency stays low](./load-patterns/steady.png)

Some app jitter at the start of a test is normal, for a variety of reasons including cache population. If jitter shows up later in the test, like the throughput dip and latency spike near the four minute mark in this soak test, it may be a sign of the app breaking down:

![A soak test report where throughput dips and latency spikes near the four minute mark](./load-patterns/soak-jitter.png)

### Spike Load Pattern

**Scenario**: An online news portal wants to test its response to sudden traffic spikes when breaking news is published.

**Implementation in Speedscale**:
Follow the same procedure as Peak Load Pattern, except with a shorter spike duration.

By understanding and implementing these load patterns in Speedscale, you can ensure your system is robust, scalable, and capable of handling a variety of real-world scenarios.

## FAQ

### How fast does the Speedscale Load Generator send requests? Can it be sped up?

After selecting vUsers in the test config stage editor you can select from two different modes:

**Full Speed:** -  The generator will send requests sequentially as fast as the application can respond. Each concurrent thread (or vUser) will wait for a response from the previous request before initiating a new request. If you were to chart out the time between requests it will be variable based on how fast the app responds. Each thread runs concurrently and slowdowns in use thread should not affect other threads.


**Multiply original latency:** - The generator will send requests at the same speed they were sent by the actual user in the original recording. Requests are still run sequentially but there is effectively a "think time" sleep to mimic what happened in the original recording. If the app is responds more slowly than the original recording then requests are sent as fast as they can be handled.

### Is there a limit on how long an overall test can run (i.e. soak for)?

There is no absolute limit but at some point the amount of data in the reports become unwieldy. If you are hitting a report timeout please notify Speedscale [support](https://slack.speedscale.com) and timeouts can be increased.

### Can I run a replay using only mocks and no load at all?

Yes. Select the "mocks-only" option in the test config editor. The Speedscale responder can container will run for an extended period of time without a load test. This is used frequently in pure "environment replication" and passthrough modes.
