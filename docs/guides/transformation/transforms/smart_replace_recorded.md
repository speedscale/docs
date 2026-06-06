---
description: "Map recorded values to their live counterparts across an entire RRPair with the smart_replace_recorded transform in Speedscale — the variant of smart_replace that keys on the recorded value and replaces it with the actual one seen at replay or analysis time."
sidebar_position: 25
---

# smart_replace_recorded

The `smart_replace_recorded` transform registers a key→value mapping in the replay session's substitution table, then lets that mapping propagate across the **entire RRPair** after every transform chain finishes. It is the variant of [`smart_replace`](./smart_replace.md) to reach for when the right-hand side of the mapping — the new value — is the **live token** observed at replay time, and the left-hand side — the key — is the **recorded token** from the original capture.

It does **not** modify only the field its chain extracts. Once a mapping is learned, every occurrence of the recorded value anywhere in the request or response — headers, body, URL, signature fields, downstream RRPairs in the same session — is rewritten to the live value.

- **Transform type name (config/API):** `smart_replace_recorded`
- **Shorthand format:** `smart_replace_recorded(overwrite=...)`
- **Requires recorded responses:** yes — the transform pulls the original token from the recorded RRPair (or from transform state stashed during analysis mode, see below).

## Quick Start

```json
"type": "smart_replace_recorded",
"config": {
    "overwrite": "false"
}
```

Place `smart_replace_recorded` at the **start** of the transform chain that extracts the live value. The chain's tail produces the new (live) value; the transform looks up the recorded counterpart automatically.

## How It Works

`smart_replace_recorded` is the mirror image of [`smart_replace`](./smart_replace.md): instead of capturing the original token from the same chain and pairing it with whatever downstream transforms produce, it pairs an **externally supplied recorded value** with the **live token** flowing through the chain.

All of the work happens in the first phase. The second phase is a no-op.

1. **First phase** — read the live token (the actual value). Look up the recorded counterpart from one of two sources (see below). Register `recorded → live` in the replay session's substitution table and return the live token unchanged.
2. **Second phase** — does nothing. The mapping is already registered.

After every transform chain on the RRPair completes, the substitution table is applied across the entire RRPair: every registered recorded key is rewritten to its live replacement wherever it appears.

```
            ┌────────────── chain runs here ──────────────┐
extract ──► smart_replace_recorded (1st) ──► (downstream transforms)
            (looks up recorded value,
             registers recorded → live)

after every chain completes:
    every recorded key is rewritten to its live value, everywhere it appears in the RRPair
```

### Where the Recorded Value Comes From

`smart_replace_recorded` chooses its source based on what the chain has available, with a fixed precedence:

| Source | Used when | Typical caller |
|---|---|---|
| Recorded RRPair value (passed in alongside the live token) | The chain has direct access to the original RRPair — the transform reads the value from the same extracted location in the recorded copy | Generator (live replay) |
| Transform state slot named `recorded` | The recorded RRPair is not directly accessible at the point the chain runs; an earlier pass — running in **analysis mode** — stashed the value into transform state for the responder to pick up later | Responder (mock server) |

If neither source has the recorded value, the transform returns the live token unchanged and does not register a mapping. No error is raised.

### Analysis Mode vs Replay Mode

The `isAnalysisMode` flag is set when the transform is constructed, and it changes the first-phase behaviour:

| Mode | First-phase behaviour |
|---|---|
| **Analysis mode** | The live token is stashed into transform state under the slot name `recorded` and returned unchanged. No mapping is registered. |
| **Replay mode** (default) | The recorded value is resolved (RRPair > transform state), paired with the live token, and registered as `recorded → live`. |

The two modes are designed to run as a pair when the recorded RRPair is not directly available at replay time. In that pairing:

1. The responder runs the chain once in analysis mode against the **recorded** traffic so the recorded token is parked in transform state.
2. The responder runs the chain again in replay mode against the **live** traffic, picks the recorded value out of transform state, and registers the `recorded → live` mapping.

In the generator (live replay), the recorded RRPair is directly available, so analysis mode is not needed — the transform runs once in replay mode and finds the recorded value via the first source.

### JSON-String Unwrapping

Before storing the mapping, both the recorded value and the live value are unwrapped if they are JSON string scalars. A response body of `"<JWT>"` (a JSON-quoted string) is stored as `<JWT>` so it matches the unquoted form found in headers like `Authorization: Bearer <JWT>`.

| Recorded value | Live value | Mapping registered |
|---|---|---|
| `"recorded-jwt"` | `"live-jwt"` | `recorded-jwt → live-jwt` |
| `"recorded-jwt"` | `live-jwt` | `recorded-jwt → live-jwt` |
| `recorded-jwt` | `"live-jwt"` | `recorded-jwt → live-jwt` |
| `recorded-jwt` | `live-jwt` | `recorded-jwt → live-jwt` |
| `{"token":"recorded-jwt"}` | `{"token":"live-jwt"}` | full-object key, not unwrapped — `{"token":"recorded-jwt"} → {"token":"live-jwt"}` |

Only JSON **string scalars** are unwrapped. Object and array bodies are left intact.

## Configuration

```json
"type": "smart_replace_recorded",
"config": {
    "overwrite": "<boolean>"
}
```

| Parameter | Required | Default | Description |
|---|---|---|---|
| `overwrite` | No | `false` | Whether a second sighting of the same recorded key updates the stored live value. |

### `overwrite` Behaviour

| Setting | First sighting | Subsequent sightings of the same recorded key |
|---|---|---|
| `false` (default) | Stores `recorded → live1`. | Returns the **previously stored** live value — i.e. data still gets transformed, just to the first-learned replacement. Mapping is not updated. |
| `true` | Stores `recorded → live1`. | Stores `recorded → liveN`; future RRPair-wide substitutions use the newest mapping. |

Use `overwrite=true` when you need to rotate values (e.g. each iteration through a per-user replay produces a fresh live token). Use the default for stable session, user, or token propagation where the first observed live value should win.

## Examples

### Example 1 — Propagate a regenerated session ID from a login response

```
smart_replace_recorded() → res_body() → json_path(path="sessionId")
```

1. Recorded `/login` response body contains `sessionId: "rec-sess-aaa"`.
2. Live `/login` response contains `sessionId: "live-sess-zzz"`.
3. Transform registers `rec-sess-aaa → live-sess-zzz`.
4. Every later RRPair in the session that carried `rec-sess-aaa` in a header, cookie, or body field has it rewritten to `live-sess-zzz` before it leaves the generator.

### Example 2 — JWT swap-through with responder analysis-mode pairing

When the responder needs the recorded JWT but doesn't have it in hand at replay time:

1. Analysis-mode pass on the recorded RRPair: extracts `"<JWT-rec>"` from the recorded response body and stashes it in the `recorded` transform-state slot.
2. Replay-mode pass on the live RRPair: extracts `"<JWT-live>"`, pulls `<JWT-rec>` out of transform state, unwraps the JSON-quoted form of both, and registers `<JWT-rec> → <JWT-live>`.
3. The responder substitutes any subsequent occurrence of `<JWT-rec>` in matching downstream traffic with `<JWT-live>`.

### Example 3 — Rotating values with `overwrite=true`

```
smart_replace_recorded(overwrite=true) → req_body() → json_path(path="iterationId")
```

Each request through replay produces a fresh `recorded → live` mapping for `iterationId`, so the RRPair-wide substitution always uses the current iteration's value rather than locking to the first one seen.

## Common Misconceptions

1. **"It only changes the field its chain targets."**
   No. The chain registers a mapping; the mapping is applied to every occurrence of the recorded value across the entire RRPair after all chains run.

2. **"It works like `smart_replace` — the chain produces both sides."**
   No. The chain produces the **live** value (the right side). The **recorded** value (the left side) comes from the recorded RRPair or from transform state stashed during analysis mode.

3. **"It works without recorded responses."**
   No. It requires the recorded RRPair to be available — either directly (generator) or via an analysis-mode pre-pass (responder). Without a recorded value, the transform is a no-op.

4. **"`overwrite=false` means subsequent sightings are left alone."**
   No. The recorded token is still rewritten on subsequent sightings — it just gets rewritten to the **first-learned** live value, not the latest one.

5. **"Analysis mode and replay mode are user-configurable."**
   No. They are set by the surrounding service. The generator runs in replay mode; the responder may run both passes internally as part of a single mock evaluation.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| No substitution happens | Recorded value couldn't be resolved from either source | Confirm the recorded RRPair is present in the action file; if running in the responder, confirm the analysis-mode pass ran before the replay-mode pass |
| Recorded JSON-quoted token won't substitute into a header | Should be handled by JSON-string unwrap; if not, the header value has extra whitespace, a `Bearer ` prefix, or other surrounding text not present in the body | Check the header's surrounding context; use [`jwt_resign`](./jwt_resign.md) or [`trim`](./trim.md) as appropriate |
| Mapping locks to an unexpected live value on retry | `overwrite=false` and an earlier (bad) live value was learned first | Set `overwrite=true`, or restart the replay/responder session |
| Field rewritten but downstream RRPairs unchanged | Substitution table is shared per session; downstream RRPair processed before this mapping was registered | Make sure the chain that registers the mapping runs on an earlier RRPair than the ones that need the substitution |
| Replacement appears in some places but not others | The recorded token differs across places (e.g. trimmed in one location, prefixed in another) | Add a normalising transform (`trim`, `regex`) upstream so all occurrences match the stored key |

## Related Transforms

- [`smart_replace`](./smart_replace.md) — same propagation mechanic, but the key is captured from the same chain rather than from the recorded RRPair. Use when no recorded counterpart exists, or when the new value is generated in-chain (e.g. `rand_string`, `constant`).
- [`smart_replace_csv`](./smart_replace_csv.md) — bulk-load `recorded → live` pairs from a CSV into the same substitution table without running a chain per pair.
- [`constant`](./constant.md), [`replace`](./replace.md), [`rand_string`](./rand_string.md) — for scoped, single-field substitution without propagation.

## Advanced Notes

- The substitution table is shared with `smart_replace` and `smart_replace_csv`. A mapping registered by any of the three is applied by all three for the rest of the session.
- Mappings persist for the duration of the replay or mock-server session, so a recorded → live pair captured early can substitute into RRPairs processed much later in the run.
- The live token bytes are copied at capture time, so subsequent transforms in the chain can mutate the value without disturbing the registered mapping.
- Analysis-mode state is stored under a fixed slot name (`recorded`). Two `smart_replace_recorded` transforms in the same evaluation share that slot — design the chain so only one is in flight at a time, or rely on the chain ordering to keep the value fresh.
- The transform reports that it requires recorded responses, which the responder and generator use to decide whether to keep the recorded copy of the RRPair around for matching.
