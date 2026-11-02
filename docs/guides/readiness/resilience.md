---
title: Resilience
description: "The Resilience readiness family pairs every fault a chaos rule injected with the inbound request the service was answering and grades the share of faulted requests the service handled within the chaos bounds."
sidebar_position: 6
---

# Resilience

Resilience grades what the service did with the faults the test config's [chaos rules](/concepts/chaos) injected.

Every mocked call a chaos rule perturbed is paired with the inbound request the service was answering at the time, and that request is judged on four questions: did the service return a controlled answer, did it retry within bounds, did it slow down no more than the injected delay allows, and once the rule stopped firing, did the affected endpoint recover.

The measure is the share of faulted requests handled within the bounds.

The default role is Off.

Chaos fires on HTTP mocks only, so non-HTTP inbound requests and non-HTTP mocks are not paired.

## Fault windows and pairing

A fault window is one inbound request that at least one perturbed call was paired with.

Pairing uses the trace id first: the generator replays the recorded `traceparent` or B3 header, so a service that propagates it matches exactly.

Otherwise the perturbed call is paired with the latest inbound request in flight when it arrived, which is a heuristic under concurrency.

Each fault window is handled or falls into exactly one bucket, judged in this order: error passed through, unbounded retries, latency amplification.

The usual number of attempts per dependency endpoint and the usual latency per inbound endpoint are medians taken from the requests chaos left alone.

The collector keeps 200,000 calls per direction; a longer replay is graded on the calls kept and the detail says the later ones were not judged.

## The chaos bounds

Three bounds say what counts as handling a fault well.

They are set on the [Readiness tab of the test config](./test-config-settings.md#resilience-chaos-bounds), are applied when the report completes and are recorded on the report, so a changed bound applies from the next replay.

| Bound | Default | Meaning |
|---|---|---|
| Max retries | 3 | How many attempts beyond its usual ones a request may make on the faulted dependency before it counts as retrying without bound. |
| Max latency amplification | 2 | How many times the injected delay a request may slow down by. 1 passes the delay straight through; more means it waited for the fault more than once. Judged only for latency, stall and no-response effects. |
| Recovery window | 30 s | How long after a rule stops firing an affected endpoint has to answer without a 5xx before it counts as not recovered. |

A value at or below zero takes the default.

## When the family is n/a

| Sentence on the report | Cause |
|---|---|
| "The test config has no chaos rules; nothing was injected to judge resilience." | No rules. The detail offers Edit chaos rules, which opens the Traffic tab of the test config. |
| "Nothing was mocked in this replay, so no chaos rule could fire." | Rules on a generator-only replay. |
| "The test config has N chaos rules but none fired; no mocked call matched them." | Nothing matched the rules' scope. |
| "N faults injected but none fell inside an inbound request to judge." | No fault could be paired. |

## Findings and check ids

The endpoint pattern of a finding is the inbound endpoint and the field path is the chaos rule's id; the detail names the rule.

| Check id | Meaning |
|---|---|
| `error_passed_through` | The request answered 5xx or not at all while the fault lasted: "GET /orders/\{id\} answered 503 while chaos rule "payments down" returned 503 from api.payments.io POST /v1/charge." |
| `unbounded_retries` | The request called the faulted dependency more than the bound allows beyond its usual attempts: "... called api.payments.io POST /v1/charge 5 times during one request (usually 1) ...; the bound is 3 retries." |
| `latency_amplification` | The request slowed down by more than the bound times the injected delay: "GET /orders/\{id\} took 3.2 s against a usual 100 ms while chaos rule "slow-inventory" delayed inventory POST /stock by 1 s: 3.1x the fault's 1 s, above the bound of 2x." |
| `no_recovery` | The endpoint kept answering 5xx inside the recovery window after the rule stopped firing and never answered without one: "GET /cart/\{id\} kept answering 5xx for 30 s after chaos rule "cache-down" stopped firing." Each one caps the letter at D. |

The detail groups them as **Not handled**, **Retries**, **Latency**, **Recovery** and **Accepted**.

Accepting a bucket finding counts its requests as handled; accepting a `no_recovery` finding counts the endpoint as recovered and lifts the cap.

## The recovery cap

A service that stays broken after the fault is gone is worse than one that fails while it lasts.

Recovery is judged per affected endpoint and rule once the rule stops firing: recovered means it answered without a 5xx inside the recovery window, not recovered means it did not, and unknown means no request reached it after the fault cleared.

While any endpoint is not recovered the letter is at most D, and the threshold sentence adds "; D at most until every affected endpoint recovers".

## What the detail shows

The measure reads "92% of faults handled".

The detail sentence is "N faults from M chaos rules fell inside K requests; H were handled (X%): a answered 5xx or not at all, b retried more than 3 times, c ran over 2x the injected delay." followed by one of:

- "All N affected endpoints recovered within 2.1 s of their rule stopping."
- "N of M affected endpoints had not recovered 30 s after their rule stopped firing, which caps the letter at D."
- "Recovery could not be judged: no request reached the affected endpoints after the faults cleared."
- "Recovery could not be judged."

The detail page shows four numbers (faults handled, worst retry amplification, worst latency amplification and recovery), the faults injected and paired, the buckets, the bounds applied, and a Chaos rules table with each rule's effects, how many mocked calls matched and fired, the requests it faulted and how many were handled.

A rule whose matched count the responder did not report shows "not reported".

## What moves the letter

Up to two steps, the recovery cap first and then the biggest buckets: "`<finding>` Fixing or accepting it brings Resilience to 90% of faults handled; D to C."

The Mocks action opens the Mocked Responses tab, where the perturbed mocked calls are listed.

Adding, changing or removing a chaos rule between two consecutive reports shows as a "Chaos rules" mark on the [service trend](./service-trend.md); a change to the bounds alone shows as a config change.
