---
title: Tune a Replay Locally
description: "Use mock-lab, an AI coding agent, and the proxymock replay tuning script to measure replay misses and improve local mock coverage."
sidebar_position: 8
---

# Tune a Replay Locally

A replay miss usually means the app made an outbound request that the mock set cannot explain. The request may be new, the signature may include a value that changes on every run, or the mock recording may be missing traffic.

This guide shows a local loop for finding those misses and deciding what to change. You will record traffic from [mock-lab](https://github.com/speedscale/mock-lab), ask an AI coding agent to run the replay tuning skill, then inspect the `summary.json` and `mock-output/` artifacts it produces.

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

## 3. Pick the mock set to tune

The tuning script needs two inputs:

| Input | Meaning |
|---|---|
| `--mock-in` | The mock or recording directory you want to test as the candidate mock set |
| `--replay-in` | The request set to replay through that mock |

For this mock-lab walkthrough, use the committed mock set as the candidate and the recording you just made as the replay input:

```text
Mock input: lab/proxymock/recording
Replay input: replay-work/recording
```

In your own app, `Mock input` is usually the recording you expect to serve responses from. `Replay input` is the newer traffic that exposes misses.

## 4. Start your AI agent

Start your AI coding agent from the `mock-lab` repo root. Ask it to use the replay tuning skill and give it the two paths:

```text
Use the proxymock-replay-tuning skill to tune this replay.
Mock input: lab/proxymock/recording
Replay input: replay-work/recording
Run the tuning script, summarize HIT/MISS/PASSTHROUGH, and recommend what transforms or recordings need to change.
```

The skill lives in the repo at:

```text
skills/proxymock-replay-tuning/SKILL.md
```

The agent should run:

```shell
./skills/proxymock-replay-tuning/scripts/tune-proxymock-replay.sh \
  --mock-in lab/proxymock/recording \
  --replay-in replay-work/recording
```

You can run the script yourself if you do not want to use an agent.

## 5. Read the results

The script starts `proxymock mock`, sends the replay requests through it, then writes a work directory with:

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

Open the files in `mock-output/` for missed requests and compare them to the closest requests in `--mock-in`.

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
./skills/proxymock-replay-tuning/scripts/tune-proxymock-replay.sh \
  --mock-in lab/proxymock/recording \
  --replay-in replay-work/recording
```

Compare the new `summary.json` to the previous run. The loop is:

1. Run the tuning script
1. Read `summary.json`
1. Inspect misses in `mock-output/`
1. Update recordings, signatures, filters, or transforms
1. Rerun the same replay input

When the match rate is high enough, run a normal proxymock replay against your app to confirm response correctness, not just signature coverage.

## Prove the workflow

mock-lab includes a proof script that records real app traffic, creates a stale mock baseline, measures the misses, then proves that a tuned mock set improves the hit rate:

```shell
./skills/proxymock-replay-tuning/scripts/prove-proxymock-replay-tuning.sh
```

Use this when you want to validate the tuning workflow itself before applying it to your own traffic.
