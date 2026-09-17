---
title: Test one endpoint while stressing another
description: "Run a banking interference test, rotate complete sessions, and diagnose missed load with proxymock and Kubernetes."
sidebar_position: 7
---

# Test one endpoint while stressing another

This walkthrough raises bank statement traffic while keeping transaction posting
steady. It then repeats the experiment with complete recorded customer journeys.
Use it to distinguish slow application responses from load the generator could
not deliver.

## 1. Run the executable banking example

Install proxymock with the grouped-load engine (v2.5.1012 or a compatible later
version), Git, Make and Node.js with built-in `fetch`. The demo has no npm
installation step. Run:

```sh
git clone https://github.com/speedscale/demo.git
cd demo/sessions-demo
make test
PROXYMOCK_BIN="$(command -v proxymock)" make bank-load-workers
```

The harness starts a real bank and statement dependency, records traffic, replaces
the dependency with proxymock, and stops its real backend. It creates fresh fixture
credentials and uses the bank's journal to verify received requests independently
of the replay report. It stops its processes when finished.

Look for `"success":true` and the printed artifact directory. An assertion failure
is a failed validation even if individual HTTP responses succeeded. Each case
retains its plan, replay log, generator evidence and bank journal.

Run the focused throughput and dependency-failure experiments next:

```sh
PROXYMOCK_BIN="$(command -v proxymock)" make bank-load-tps
PROXYMOCK_BIN="$(command -v proxymock)" make bank-load-chaos
```

The TPS profile includes an intentionally under-capacity statement group while
posting still passes. The chaos profile checks baseline, statement-dependency
failure with unaffected posting, then recovery. The overall harness succeeds
only if those deliberate failures occur as expected. To run every banking case,
use `make bank-load-groups` with the same `PROXYMOCK_BIN` setting.

## 2. Prepare your own recording

Record both statement and posting endpoints, or choose an existing recording that
contains them. Prepare a target with accounts that accept repeated transactions.
Use [Sessions](../../proxymock/guides/sessions.md) to inspect actors and ordering,
and existing Automations/credential replacement workflows when tokens need renewal.
The compiled preview's credential warnings are advisory; they do not prove that
credentials work against the target.

A request group replays selected requests independently. It does not automatically
log in first. Choose complete sessions when login, correlation, account ownership
and transaction ordering are part of the experiment.

## 3. Give each workload its own schedule

Copy the [bank-endpoints.json example](./endpoint-session-load-plans.md#stress-statements-while-measuring-transaction-posting)
and change its URL filters to match your application. It gives statements a ramp
from 5 to 20 starts per second, keeps posting at 2 starts per second, and checks
posting p95 response-header latency against 500 ms during the final 20 seconds.

In proxymock web, open **Replay > Load plan**, import the JSON, then select the
recording directories and destination in **Source & Target**. Preview the plan
before running. Confirm both endpoint selections are nonempty, check which group
owns each request, and reserve enough workers for each workload. Use a method
filter as well as a URL filter when reads and writes share a route.

For the equivalent CLI execution:

```sh
proxymock replay --in ./proxymock --out ./results/bank-endpoints \
  --load-plan ./bank-endpoints.json --test-against http://localhost:3000
```

Replace the input directory and target URL with your recording and app. Keep
this plan as a baseline. Increase statement pressure in a copy while leaving the
posting schedule and goal unchanged; compare posting latency and delivered load
between the two runs.

## 4. Repeat with complete sessions

Use the [bank-sessions.json example](./endpoint-session-load-plans.md#rotate-complete-banking-journeys).
Its transaction filter selects actors with a matching request, then each start
replays that actor's entire journey. It rotates through available recorded actors
with at most four journeys active and a total budget of ten journey starts.
Ten journeys can issue many more than ten HTTP requests.

Check the preview's eligible actor count. Filtering to a single session leaves
only one source actor; increasing concurrency does not create more accounts.
Use a wider filter to rotate a population. If you deliberately clone actors,
configure synthesis, transforms and identity verification as described in the
[feature guide](./endpoint-session-load-plans.md#choose-requests-or-complete-sessions).

You can combine request and session groups. Session groups claim their complete
journeys first; request groups only see remaining records. Preview ownership to
avoid accidentally removing all traffic from the independent posting probe.

## 5. Read the result

Inspect `load-groups.json` in the output directory and the group report:

| Observation | What to investigate |
| --- | --- |
| Posting latency goal fails while both groups deliver their starts | Shared application contention or dependency latency. |
| Missed starts with all observed HTTP responses successful | Worker/actor capacity or scheduling lateness; the load target was not met. |
| TPS fails with successful HTTP responses | Actual attempt count outside the stage's throughput tolerance. |
| Session population or identity check fails | Source selection, synthesized identities, transforms or target account preparation. |
| A goal has too few samples | Selection and observation window; missing samples cannot pass. |
| Authentication warning before replay | Review existing credentials; inspect actual replay responses before concluding auth failed. |

Compare stage counts and the drain row, then check session source execution
counts for rotation. Do not infer PASS from a finished process or a green HTTP
summary. The demo also supplies an independent bank journal for this comparison.

## 6. Use the same plan in Kubernetes

With a compatible installation, follow [Run the same plan in Kubernetes](./endpoint-session-load-plans.md#run-the-same-plan-in-kubernetes).
Cloud-backed launch saves and reads back the test config; namespaced launch
carries a bounded inline plan in its replay request. Verify the TrafficReplay
verdict and the cloud report's delivery, TPS and scoped-goal assertions.

For reproducible testing, retain the plan, recording, component versions, report
and independent app evidence. Local success alone does not verify Kubernetes
transport or cloud reporting. Full deployment acceptance remains separate from
this locally verified workflow.
