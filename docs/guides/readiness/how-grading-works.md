---
title: How a report is graded
description: "What the Ready, Not ready and Still grading verdicts mean, how each readiness family earns its letter, roles and floors, the weighted score, confidence and the default letter boundaries."
sidebar_position: 1
---

# How a Report Is Graded

The scorecard is computed once, when a report completes, from measurements the analyzer stores on the report and the `readiness` section of the test config the replay ran with.

Because the measurements are kept, a report can be re-graded without rerunning it: the test config editor previews a threshold change against recent reports, and an acceptance re-grades the report it was made from.

## The verdict

The verdict word sits at the top of the Readiness tab, in the Readiness column of the reports grid and on every column of the service trend.

| Verdict | Meaning |
|---|---|
| **Ready** | Every family that blocks is at or above its floor letter and every grading step is done. |
| **Not ready** | At least one blocking family is below its floor. The summary names them, for example "Blocked by Regression at C (needs B)." |
| **Still grading** | The replay is still running. The tab shows the grading steps (Replay, then Trend) instead of letters. |
| **Not graded** | The report has no grade. The card says why: the replay ended in Error or Canceled, or the report was analyzed before readiness grading existed and needs a reanalysis. |

Under the verdict word, the summary sentence says which report the Trend family compared with, for example "Compared with report 8f3c... of Oct 24, 2026 14:02 UTC." or "No previous graded report in the trend window to compare with."

A Not ready report lists "What gets this build to ready": one line per blocking family with its current letter, its floor and the measure it needs to reach.

Advisory families never appear there; the ones below their floor are listed under "Worth knowing before you ship".

## Families and letters

Ten metric families are graded, each with its own collector, measure and letter.

| Family | Headline measure | Grades n/a when |
|---|---|---|
| Regression | Assertion pass rate | No assertions ran in this replay. |
| Performance | The headline latency percentile against its goal, plus the error rate | No transactions were sent to the service, or there is no latency goal and no recorded p99. |
| Resilience | Share of faulted requests the service handled within the chaos bounds | The test config has no chaos rules, nothing was mocked, no rule fired, or no fault fell inside an inbound request. |
| Spec adherence | Share of replayed HTTP calls that conform to the service's OpenAPI document | No spec is attached to the service, the spec could not be used, or no call could be checked. |
| Security | Worst open severity among the static checks and the auth probe | No HTTP calls were replayed to scan. |
| Mock fidelity | Responder match rate | Nothing was mocked in this replay. |
| Coverage | Share of production call volume on the endpoints the replay exercised | Production traffic was not looked up, could not be loaded, there is none in the window, or the replay sent no inbound calls. |
| Runtime health | Restarts, OOM kills and readiness waits on the system under test | The replay did not run in a Kubernetes cluster. |
| Data layer | SQL statement match rate, or database mock match rate | The replay touched no database. |
| Trend | How many families fell since the previous graded report | No previous graded report of the same service and build in the trend window. |

A letter runs from A to F.

A family with nothing to grade on a report shows **n/a**: it is left out of the score and it never blocks, because a family with no input cannot fail a floor.

The exact sentence for each n/a case is on the family's page.

## Roles and floors

The test config gives every family a role.

| Role | Effect on the verdict | Effect on the score |
|---|---|---|
| **Blocks below `<floor>`** | The report is Not ready when the family's letter is below the floor letter. | Counted. |
| **Advises** | Never moves the verdict. | Counted. |
| **Off** | Never moves the verdict. | Left out. The family still shows a letter on the report. |

The floor is the lowest letter that still passes for a blocking family.

Every family's floor defaults to B.

The Speedscale defaults block on Regression and Mock fidelity, advise on Performance, Runtime health, Data layer and Trend, and keep Spec adherence, Security, Coverage and Resilience off so that switching them on is a decision the team makes on the [Readiness tab of the test config](./test-config-settings.md).

## Letter boundaries

Rate families earn the letter whose boundary the measure reaches; below the D boundary is F.

Performance works the other way: the boundary is the percent over the latency goal the measure may not exceed.

Runtime health, Trend and Security have fixed rungs that the config cannot move.

The defaults below are the grader's own.

A test config can override the rungs of any family in the first table; an override that sets one rung keeps the default for the others.

| Family | A | B | C | D | Direction |
|---|---|---|---|---|---|
| Regression | 99.5% | 98% | 95% | 80% | At least this pass rate |
| Performance | 0% | 0% | 10% | 25% | At most this percent over the latency goal |
| Mock fidelity | 99% | 97% | 90% | 80% | At least this match rate |
| Data layer | 99% | 97% | 90% | 80% | At least this match rate |
| Spec adherence | 99% | 97% | 90% | 80% | At least this conformance |
| Coverage | 95% | 85% | 70% | 50% | At least this share of production calls |
| Resilience | 95% | 85% | 70% | 50% | At least this share of faults handled |

Performance also needs the headline percentile to be at most 5% over the previous graded report's for an A, and the error rate caps the letter: above 1% of transactions without a response the letter is at best C, above 5% at best D.

| Family | A | B | C | D | F |
|---|---|---|---|---|---|
| Runtime health | Nothing happened | Readiness waits only | A restart, no OOM kill | An OOM kill or crash loop the service recovered from | The service never became ready |
| Trend | No family fell | One advisory family fell | One blocking family fell one letter | More than that | Three or more families fell, or a blocking family fell three letters |
| Security | No open findings | Low findings only | Nothing above medium | Nothing above high | A critical finding is open |

The ledger on the Readiness tab shows each family's measured value and its threshold sentence, for example "99.7% pass" against "B at >= 98%".

For a blocking family the threshold names the floor; for the others it names the letter earned.

## The weighted score

The score is the weighted mean of the graded letters on a 4-point scale: A is 4, B is 3, C is 2, D is 1 and F is 0.

Families graded n/a and families whose role is Off are left out.

Every weight defaults to 1 and can be changed on the Readiness tab of the test config; a weight of 0 is read as the default, so Off is how a family leaves the score.

The score is rounded to two decimals and shown as "of 4".

When acceptances lifted a letter, the ledger also shows the score without acceptances.

## Confidence

Confidence says how much of production the replay vouches for.

It is the product of three factors and sits beside the score; it is never folded into a letter or the verdict.

| Factor | Value |
|---|---|
| Mock fidelity | The responder match rate as a factor, rounded to two places (72.4% matched is 0.72). 1 when nothing was mocked. |
| Coverage | The share of production call volume the replay exercised, with accepted findings applied. 1 when the Coverage family is n/a. This factor applies even when the Coverage family's role is Off. |
| Rerun agreement | 1 for a single run. |

The Readiness tab prints the factors beside the value, for example "mock fidelity 0.99 x coverage 0.75 x rerun agreement 1", and says when coverage lowers confidence.

A replay whose mocks missed often, or that reached a tenth of production, vouches for less even when every letter is A.

## Acceptances and the frozen verdict

An acceptance takes a finding out of its family's measure.

The family is measured twice: as recorded, which is kept as the letter without acceptances, and with the accepted findings out, which is the letter the family gets.

A letter that rose this way is marked as lifted, and the accepted findings stay visible under Accepted on the family's detail.

An acceptance never moves a graded report's verdict on its own.

Re-grading an already graded report keeps the verdict it had, and the Readiness tab says why: "The verdict does not move: an acceptance never changes a graded report's verdict, so it stays Not ready until the next replay grades with the acceptance in effect."

The next replay grades afresh with the acceptance in effect, so an accepted blocker makes that replay Ready.

A threshold change in the test config applies to replays started after you save.

Past reports keep the grades they were given; the preview on the Readiness tab shows what they would earn under the draft without writing anything.

## Letters held since

Each ledger row says how long the family has held its letter.

A letter equal to the previous graded report's keeps that report's "since", so a family that has been at B for ten replays says so; a letter that changed starts at this report.
