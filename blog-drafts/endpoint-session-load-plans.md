# Stress statements. Watch transaction posting.

_Draft for review. This describes the release candidate. Publish after the full dashboard and Kubernetes acceptance gates pass._

I wanted to use mocks to make this feature faster to test. Then we measured it.

For our tiny local banking dependency, the mock was about 4.4% slower. There goes the easy headline.

The useful result was more specific. We could control the dependency while keeping the bank, authentication, transaction handling, and workload generator real. That gave us a repeatable way to ask a better load-testing question.

What happens to transaction posting when statement traffic gets expensive?

## One traffic knob misses the question

Increasing the load on an entire recording is useful. It does not isolate which workload interferes with another.

For a bank, I want to increase statement requests while holding transaction posting steady. Then I want a latency goal on posting. A healthy average across both endpoints could hide the result I care about.

Endpoint and session load plans give selected traffic its own schedule and goals. Filters define the traffic. A group can contain one endpoint, several endpoints, or complete recorded journeys.

The endpoint filter stays prominent in the interface. A name such as "Statement pressure" helps identify the experiment, but it should never obscure what will actually run.

## Decide what you are increasing

Threads, sessions, request starts, and achieved throughput answer different questions.

JMeter users will recognize separating workloads into [Thread Groups](https://jmeter.apache.org/usermanual/component_reference.html#Thread_Group). k6 makes the scheduling distinction explicit with [open and closed workload models](https://grafana.com/docs/k6/latest/using-k6/scenarios/concepts/open-vs-closed/): independently scheduled arrivals behave differently from workers that wait for the previous iteration to finish.

Our load plans apply those ideas to recorded traffic:

- **Request arrivals:** start individual requests on a schedule.
- **Session arrivals:** start complete journeys on a schedule.
- **Concurrent sessions:** keep a chosen number of journeys active.
- **Adaptive TPS:** adjust request workers within a reserved budget to pursue a throughput target.

A ramp belongs to the selected workload. Existing chaos rules still change request behavior where they apply. You can raise statement traffic, inject dependency latency, and keep posting steady during the same experiment.

If the generator cannot deliver the requested starts, that is evidence. By default, missed starts fail the run. Healthy endpoints do not silently inherit another group's missed allocation.

## A session is a journey

Filtering by a single session isolates that actor. Most load tests need a population.

A session group selects actors whose recorded journeys match its filter. Each start replays a complete journey. A request-level goal can still measure only transaction posting inside that journey.

Population and concurrency are separate. One hundred eligible actors can rotate through ten concurrent journey slots. An active actor slot is not shared by two journeys.

Choose rotation, preferential reuse of an available actor, or a single execution per actor. Cloning requires explicit synthesized identities and accounts the target accepts. Generating a new identifier does not provision a bank account.

Credential diagnostics remain advisory. Existing Automations and Sessions workflows help prepare replacements. A warning about an old token should help someone investigate, rather than prevent an experiment they understand.

## Make failure mean something

A test needs an explicit statement of success. k6 expresses that idea through [thresholds](https://grafana.com/docs/k6/latest/using-k6/thresholds/). Our scoped goals apply it to selected replay requests and observation windows.

For the banking experiment, hold posting at two starts per second while statements ramp up. Require posting p95 response-header latency to stay below 500 milliseconds during the final twenty seconds. Require enough samples to judge it.

The report separates planned starts, actual starts, HTTP attempts, failures, latency, and journey drain. An HTTP 200 does not prove a throughput target was met. Missing evidence does not produce a pass.

That distinction caught a real integration gap during development. The Kubernetes generator delivered exactly 100 statement requests and 50 posting requests. An older staging analyzer omitted their TPS verdicts. The acceptance check failed instead of treating a green-looking summary as proof.

## Keep the bank real

The demo exercises both individual endpoints and sessionized journeys. It includes shared and isolated contention paths, identity checks, worker limits, and intentional goal failures.

proxymock supplies a controlled dependency for the fast development loop. The bank's own journal independently records what reached the app. Kraken also exercises the actual Kubernetes configuration, operator, generator, and cloud-report path.

Neither path substitutes for the other. A local mock cannot establish that an operator preserves the plan or that a cloud report retains a failed goal.

Our [eight matched real/mock trials](./endpoint-load-plan-feedback-measurements.json) measured reset, discovery, complete session work, and journal assertions. Median time was 143.19 ms with the real local dependency and 149.46 ms with the mock. Capture, startup, cluster setup, and artifact uploads were excluded.

That result supports no claim of faster delivery. It gives us a baseline and a controlled test dependency. We will measure slower and less predictable dependencies separately.

## Start with one interference test

Pick the endpoint users cannot afford to lose. Give it a steady workload and a scoped goal. Then increase a different workload that shares application resources.

Use individual requests when endpoint pressure is the question. Use complete sessions when login, account identity, ordering, and state are part of it.

The [load-plan guide](https://docs.speedscale.com/guides/replay/endpoint-session-load-plans) includes both banking examples and the runnable demo commands.

I still want shorter test cycles. First I want a failed experiment to tell us what failed.

---

_Editorial checks before publication: confirm the guide URL is deployed; remove the release-candidate note only after final acceptance; move the linked measurement attachment with the post. Dashboard recording preview and namespaced inline-plan staging are not claimed complete here._
