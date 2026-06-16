---
title: Workspace Layout
description: "Reference for the proxymock workspace directory layout — what each directory holds, when it is created, and what is safe to delete or gitignore."
sidebar_position: 4
---

# Workspace Layout

A proxymock **workspace** is just a directory on disk. By convention it is named
`proxymock/` and sits at the root of the project you are testing, but any
directory works — it is whatever you point `--in` at (which defaults to the
current directory). Everything proxymock reads and writes lives under that one
directory, so the workspace is portable: copy it between machines, commit parts
of it to git, or push it to the cloud as a [snapshot](/reference/glossary.md#snapshot).

This page is the reference for what each directory is, when it gets created, and
what is safe to remove. For how recording, replay, and mocking flow through
these directories, see [Lifecycle](/proxymock/how-it-works/lifecycle.md).

## At a glance

```text
proxymock/
├── recorded-<timestamp>/        # your recordings — the source of truth
│   └── <host>/*.md              #   one RRPair file per request/response
├── results/                     # output from replay and mock runs
│   ├── replayed-<timestamp>/    #   one dir per `proxymock replay`
│   └── mocked-<timestamp>/      #   one dir per `proxymock mock`
├── blueprints/                  # saved transform rules
├── dataframes/                  # payloads referenced by transforms
│   └── <id>/payload.csv
├── .metadata/                   # snapshot binding (transforms, tokenizer config)
│   └── snapshot.json
├── .proxymock/                  # web-UI state (backups, dismissed hints, vendored assets)
└── .proxymock-replay/           # transient replay scratch — regenerated every run
    └── .metadata/snapshot.json
```

## Directories in detail

### `recorded-<timestamp>/`
The recordings themselves — the output of each `proxymock record` run, and where
`proxymock cloud pull snapshot` drops pulled traffic. Files are
[RRPair](/reference/glossary.md#rrpair) markdown grouped into one subdirectory
per host (`recorded-<timestamp>/<host>/*.md`). This is the **source of truth** and
the obvious replay source, which is why recordings sit at the top level rather
than under a hidden directory. Each `record` run creates a new timestamped
directory; old ones are never touched.

### `results/`
Output from `proxymock replay` and `proxymock mock`. Each run writes a new
timestamped subdirectory — `results/replayed-<timestamp>/` or
`results/mocked-<timestamp>/` — containing the RRPairs captured during that run.
Keeping replay/mock output under `results/` (rather than at the top level)
prevents a later `record` run, or a replay that scans the workspace, from
accidentally re-feeding itself last session's output.

### `blueprints/`
Saved transform rules (credential swaps, JWT re-signing, value substitutions,
and so on) created through the web UI or CLI. Blueprints are applied as an
overlay at replay time; deleting this directory loses your saved transforms but
not your recordings.

### `dataframes/`
Payloads referenced by transforms — for example the CSV a `csv_dataframe`
transform draws values from, stored at `dataframes/<id>/payload.csv`. Removing a
dataframe that a blueprint still references will break that transform, so treat
this directory as configuration, not scratch.

### `.metadata/snapshot.json`
The snapshot binding: tokenizer configuration and the transform set that applies
to the workspace. It lives at the workspace root and applies to every recording
in the workspace, which is why a single-snapshot `cloud pull` writes it one level
up from the `recorded-`/snapshot subdir. Replay walks parent directories to find
it, so pointing `--in` at a subdirectory still picks up the transforms.

### `.proxymock/`
Web-UI state — backups taken before destructive edits, dismissed recommendation
hints, saved replay configurations, and vendored UI assets. This is bookkeeping
for the `proxymock web` experience, not part of your traffic data.

### `.proxymock-replay/`
Transient scratch written at the start of every replay. It holds the merged
blueprint overlay (`.proxymock-replay/.metadata/snapshot.json`) that the replay
runner layers on top of your recordings. It is regenerated from `blueprints/` and
`.metadata/` on every run, so it is always safe to delete.

## What is safe to delete

| Path | Safe to delete? | What you lose |
| --- | --- | --- |
| `.proxymock-replay/` | **Yes** | Nothing — regenerated on the next replay |
| `results/` | **Yes** | Previous replay/mock output (re-created on the next run) |
| `.proxymock/` | Mostly | Web-UI convenience state (backups, dismissed hints) |
| `recorded-<timestamp>/` | **No** | Your recordings — the source of truth |
| `.metadata/`, `blueprints/`, `dataframes/` | **No** | Transform and snapshot configuration |

To prune everything that proxymock can regenerate while keeping your recordings
and transforms, remove `results/` and `.proxymock-replay/`.

## Recommended `.gitignore`

If you commit a workspace to version control, keep the recordings and transform
configuration but ignore the regenerable and machine-local directories:

```gitignore
# proxymock — regenerable / machine-local
proxymock/results/
proxymock/.proxymock-replay/
proxymock/.proxymock/
```

## Keeping the workspace tidy

A few habits avoid scattered or confusing directories:

- **Run proxymock from the same directory each time.** The default output
  location is resolved relative to where you run the command, so running from the
  workspace parent on one invocation and from inside `proxymock/` on the next can
  drop directories in two places. Pick one and stick with it, or pass `--out`
  explicitly.
- **Use `--out` in scripts and CI** so output lands in a known, stable location
  regardless of the working directory.
- **Sync recordings, not results.** When copying a workspace between machines or
  to cloud storage, exclude `results/` and the hidden scratch directories — they
  regenerate on the destination. See
  [Swapping credentials for replay](/proxymock/guides/credentials-swap.md) for
  concrete `aws s3 sync` / `gcloud storage rsync` examples.
