---
title: Tune a Replay Locally
description: "Use mock-lab and the proxymock replay tuning script to measure replay misses and gate a match-rate threshold, offline and in CI."
sidebar_position: 9
---

# Tune a Replay Locally

A replay miss usually means the app made an outbound request that the mock set cannot explain. The request may be new, the signature may include a value that changes on every run, or the mock recording may be missing traffic.

This guide shows a scripted local loop for finding those misses and deciding what to change. You record traffic from [mock-lab](https://github.com/speedscale/mock-lab), run the tuning script, then inspect the `summary.json` and `mock-output/` artifacts it produces. Because it is a single command with a `--fail-under` threshold, it also drops straight into CI.

Looking to have an AI agent find and fix the misses for you — analyze each miss and accept mock recommendations until the match rate reaches 100%? See [Improve Mock Match Rate with AI](./mock-match-rate.md). This guide is the scripted counterpart.

The workflow is file-based. It does not require Kubernetes or Speedscale Cloud access.

## Before you begin

Make sure you have:

- `proxymock` [installed](../getting-started/quickstart/quickstart-cli.md)
- `git`
- Go installed, for the mock-lab example
- An AI coding agent that can read local files and run shell commands

The example uses the Go app in `mock-lab`, but the same pattern works with any app that proxymock can record.

## 1. Clone mock-lab

Clone the demo repository and create a workspace for the recording you are about to make:

```shell
git clone https://github.com/speedscale/mock-lab.git
cd mock-lab
mkdir -p replay-work
```

## 2. Record app traffic

Start the Go demo app under proxymock record. The `--out` flag gives the recording a stable path that you can pass to the tuning script later.

```shell
cd go
proxymock record --out ../replay-work/recording -- go run .
```

Leave that process running. In another terminal from the repo root, drive the app's demo traffic through proxymock:

```shell
./lab/tests/run_tests.sh --recording
```

Stop the recording with `Ctrl-C`. The recorded RRPair files are now in `replay-work/recording`.

A recording holds both directions of traffic: the inbound requests the app received, and the outbound calls it made to its dependencies. The tuning script cares about the outbound calls, and sorts them out for you.

## 3. Run the tuning script

The script takes one input:

| Input | Meaning |
|---|---|
| `--in` | A recording to tune. Its outbound pairs are replayed against the mock; its inbound pairs are skipped automatically. |

Point it at the recording you just made:

```shell
./skills/proxymock-replay-tuning/scripts/tune-proxymock-replay.sh --in replay-work/recording
```

The skill that wraps this lives in the repo at `skills/proxymock-replay-tuning/SKILL.md`.

Because the mock set and the replay set come from the same recording here, a clean recording matches itself and reports a high hit rate. Misses show up once the mock set falls behind the traffic: a new endpoint, a stale recording, or a signature that pins a value which changes every run. To watch the tuner surface those on purpose, run the [proof script](#prove-the-workflow), which breaks a mock set and measures the misses.

## 4. Start your AI agent

Start your AI coding agent from the `mock-lab` repo root. Ask it to use the replay tuning skill and give it the recording:

```text
Use the proxymock-replay-tuning skill to tune this replay.
Recording: replay-work/recording
Run the tuning script, summarize HIT/MISS/PASSTHROUGH, and recommend what transforms or recordings need to change.
```

You can run the script yourself if you do not want to use an agent.

## 5. Read the results

The script starts `proxymock mock`, sends the outbound requests through it, then writes a work directory with:

| Artifact | What to check |
|---|---|
| `summary.json` | Match counts, match rate, and script status |
| `mock.log` | The `proxymock mock` run log |
| `replay.log` | Requests sent during the tuning run |
| `mock-output/` | Observed RRPairs, including misses |

Start with `summary.json`. Treat the outcomes this way:

| Outcome | Meaning |
|---|---|
| `HIT` | proxymock found a matching mock response |
| `MISS` | proxymock saw the request, but no mock signature matched |
| `PASSTHROUGH` | Traffic escaped the mock instead of being served by it |

A high `MISS` count usually means the mock set is stale, incomplete, or matching on fields that should be transformed or ignored.

## 6. Inspect misses

Open the files in `mock-output/` for missed requests and compare them to the closest requests in the mock set.

Look for:

- New endpoints that were never recorded
- IDs, timestamps, tokens, or query parameters that change between runs
- Request bodies with dynamic JSON fields
- Header values that should not be part of the mock signature
- A host, path, or method difference that points to real app behavior drift

If the request is legitimate but missing, add or refresh the mock recording. If only a volatile value changed, tune the signature or add a transform.

For dynamic IDs and bearer tokens, start with [Fix Replay Failures with Recommendations](./recommendations.md). For direct RRPair edits, see [Modifying Tests/Mocks](./modify-rrpairs.md).

## 7. Rerun until the match rate is useful

After each change, rerun the same tuning command:

```shell
./skills/proxymock-replay-tuning/scripts/tune-proxymock-replay.sh --in replay-work/recording
```

Compare the new `summary.json` to the previous run. The loop is:

1. Run the tuning script
1. Read `summary.json`
1. Inspect misses in `mock-output/`
1. Update recordings, signatures, filters, or transforms
1. Rerun the same recording

When the match rate is high enough, run a normal proxymock replay against your app to confirm response correctness, not just signature coverage.

## Prove the workflow

mock-lab includes a proof script that records real app traffic, creates a stale mock baseline, measures the misses, then proves that a tuned mock set improves the hit rate:

```shell
./skills/proxymock-replay-tuning/scripts/prove-proxymock-replay-tuning.sh
```

Use this when you want to validate the tuning workflow itself before applying it to your own traffic.
