---
description: "Shift recorded date and time values relative to replay time using the date (date_shift) transform in Speedscale, preserving the original temporal offset from the recording."
sidebar_position: 7
---

# date

The `date` transform (shown in the dashboard as **date_shift** — "Adjust timestamps relative to current time") rewrites date and time values in traffic so they remain valid during replay and mocking. It preserves the **temporal relationship** between a date field and when the RRPair was originally recorded, then re-applies that relationship relative to the current replay time.

It does **not** unconditionally replace every date with "today." It shifts dates relative to replay time while preserving how far the field was from the recording timestamp.

- **Transform type name (config/API):** `date`
- **UI name:** `date_shift`
- **Shorthand format:** `date(layout=...,precision=...,offset=...)`

## Quick Start

For most dynamic replay scenarios on date-only fields:

```json
"type": "date",
"config": {
    "layout": "auto",
    "precision": "24h"
}
```

Do **not** set `offset` unless you want a fixed arithmetic shift from the recorded value (see [Mode 2](#mode-2-fixed-offset)). The `offset` parameter is the single biggest source of confusion with this transform.

## How It Works

The transform runs in two phases inside a transform chain.

1. **First phase (at capture)** — parse the date field, compute the offset from the recording timestamp, and store an internal pattern `{speedscale_date(<duration>)}`. In fixed-offset mode, this phase instead applies the configured offset directly and writes the shifted date.
2. **Second phase (at replay)** — resolve the `{speedscale_date(...)}` pattern to a final date string relative to replay time and write it back, or keep the pattern in place for signature matching (see [When the Final Date Is Resolved](#when-the-final-date-is-resolved)).

### Time References

| Concept | Source | Used when |
|---|---|---|
| **Recording timestamp** | The RRPair's original capture time | Computing the offset during the first transform phase |
| **Replay time** | Current time at replay or preview | Resolving the final date during the second transform phase |

### Internal Pattern Format

```
{speedscale_date(-744h0m0s)}
```

- Produced during the first phase in relative-shift mode.
- If a token already starts with `{speedscale_date(`, the first phase leaves it unchanged (idempotent).
- In Preview Mode or verbose transform output, this pattern may appear as an intermediate value before the final resolved date is written back.

## Operating Modes

### Mode 1: Relative Shift (default — no `offset`)

This is the primary mode for dynamic replay.

**At capture (first phase):**

1. Parse the date value in the field using `layout`.
2. Optionally truncate to `precision`.
3. Compare against the **recording timestamp**.
4. Compute `duration = recording_timestamp - fieldDate`.
5. Replace the field value with `{speedscale_date(<duration>)}`.

A negative duration means the field date is **after** the recording timestamp.

**Example:**

- RRPair recorded at `2021-05-19`
- Field contains `2021-06-19` (31 days after recording)
- First phase produces: `{speedscale_date(-744h0m0s)}`

**At replay (second phase):**

1. Read the `{speedscale_date(...)}` pattern.
2. Parse the stored duration.
3. Compute: `replayDate = replay_time - duration`.
4. Format and write back using `layout`.

The net effect is:

```
replay_date = replay_time + (field_date - recording_timestamp)
```

**Example replay outcomes (assuming replay on 2026-06-05):**

| Recorded timestamp | Original field date | Offset from recording | Replay result |
|---|---|---|---|
| 2023-06-01 | 2023-06-01 | 0 days | 2026-06-05 (today) |
| 2023-06-01 | 2023-06-15 | +14 days | 2026-06-19 |
| 2023-06-01 | 2023-01-01 | −151 days | still in the past |

:::caution
If the recorded field was an absolute past date (an order date, a birth date, etc.), replay will keep it in the past. This is by design. Applications with "must be current or future" validation may still reject the value unless the original offset from recording places it at or after replay time.
:::

### Mode 2: Fixed Offset

When `offset` is configured, the transform does **not** use the recording timestamp or replay time. It applies a fixed duration directly to the parsed field value:

```
new_value = field_value + offset
```

- First phase immediately returns the shifted date string (not a `{speedscale_date(...)}` pattern).
- Second phase is a no-op for offset mode.
- Recording timestamp and replay time are irrelevant.

**Example:**

- Field: `2024-06-19`
- Config: `offset=24h`
- Result: `2024-06-20` (still an old date if replaying years later)

Use fixed offset only when you need a constant arithmetic shift from the recorded value, **not** when you need dates relative to replay time. For dynamic replay, omit `offset`.

## Configuration

```json
"type": "date",
"config": {
    "layout": "<date format>",
    "precision": "<rounding precision>",
    "offset": "<fixed shift duration>"
}
```

| Parameter | Required | Default | Description |
|---|---|---|---|
| `layout` | No | `auto` | How to parse and format the date value. |
| `precision` | No | none (full precision) | Truncation applied to both the field date and the recording timestamp before comparison. |
| `offset` | No | none | If set, enables fixed-offset mode. |

### `layout` Values

| Value | Meaning |
|---|---|
| `auto` | Auto-detect format from the first observed value. The detected format is cached on the transform instance for subsequent requests. |
| `epoch` | Unix timestamp in **seconds** (integer string). |
| `epoch_ms` | Unix timestamp in **milliseconds** (integer string). |
| Go time layout | Any Go [`time.Format`](https://pkg.go.dev/time#example-Time.Format) layout string, e.g. `2006-01-02`, `2006-01-02T15:04:05Z07:00`, `Mon, 02 Jan 2006 15:04:05 MST`. |

`layout` supports variable substitution via `${{...}}` syntax, resolved from the variable cache at runtime.

### `precision` and `offset` Duration Format

Standard Go duration strings: `ns`, `us` (or `µs`), `ms`, `s`, `m`, `h`.

**Day suffix extension:** days can be expressed with `d` (case-insensitive) and are converted internally to hours.

- `3D2h1m5s` → 74h1m5s
- `-2D` → −48h

The day suffix applies to both `precision` and `offset`.

**Common precision values:**

- `24h` — date-only fields (`YYYY-MM-DD`); ignores time-of-day
- `1ms`, `1ns` — high-precision timestamps
- `0s` — explicit zero truncation for epoch seconds

## When the Final Date Is Resolved

In relative-shift mode, the `{speedscale_date(...)}` pattern produced during the first phase is either resolved to an actual date string at replay or kept in place for signature matching. Which behavior applies depends on **where** the transform runs and which side of the RRPair it targets.

**The final date is resolved** when transforms run in:

- **Generator** (live replay) — both request-side and response-side transform chains.
- **Preview Mode** in the dashboard — simulates what generator replay will produce.
- **Responder** (mock server) — when transforming **response** traffic returned to the caller.

**The `{speedscale_date(...)}` pattern is kept** (not resolved to a literal date) when transforms run in:

- **Responder** (mock server) — when transforming **incoming request** traffic, so the mock can match requests that carry different absolute dates.

### Behavior by Context

| Where transforms run | Request or response traffic | Final output |
|---|---|---|
| **Generator** (live replay) | Request | Resolved date relative to replay time |
| **Generator** (live replay) | Response | Resolved date relative to replay time |
| **Preview Mode** (dashboard) | Request or response | Resolved date — matches generator replay for request-side transforms |
| **Responder** (mock server) | Incoming request | `{speedscale_date(...)}` pattern kept for signature matching |
| **Responder** (mock server) | Outgoing response | Resolved date in the mock response body or headers |

### Terminology

| Term | Meaning |
|---|---|
| **Preview Mode** | Dashboard feature that previews transform results before running a live replay. Resolves date patterns to show what generator replay will produce. |
| **Generator** | Live traffic replay — sends transformed requests to your application under test. |
| **Responder** | Mock server that returns recorded responses. Request transforms normalize values for signature matching; response transforms rewrite outgoing mock responses. |
| **Recording timestamp** | When the RRPair was originally captured. |
| **Replay time** | When the current replay or preview is running. |

## Recommended Configurations

**Most common — dynamic replay of date-only fields:**

```json
"type": "date",
"config": {
    "layout": "auto",
    "precision": "24h"
}
```

**Explicit ISO date:**

```json
"type": "date",
"config": {
    "layout": "2006-01-02",
    "precision": "24h"
}
```

**Unix epoch seconds:**

```json
"type": "date",
"config": {
    "layout": "epoch"
}
```

**Unix epoch milliseconds:**

```json
"type": "date",
"config": {
    "layout": "epoch_ms",
    "precision": "1ns"
}
```

## Examples

### Example 1 — Relative shift, date-only

- Recording timestamp: `2021-05-19`
- Field value: `2021-06-19`
- Config: `date(layout=2006-01-02, precision=24h)`
- After first phase: `{speedscale_date(-744h0m0s)}`
- After second phase, replayed on `2026-06-05`: `2026-07-05` — 31 days after the replay date, preserving the original offset.

### Example 2 — Relative shift, auto-detected RFC1123

- Field: `Mon, 12 Dec 2022 16:36:54 GMT`
- Recording timestamp: `Tue, 13 Dec 2022 16:36:54 GMT`
- Config: `date(layout=auto, precision=24h)`
- After first phase: `{speedscale_date(24h0m0s)}` — the field is 1 day before recording.
- After second phase: resolves relative to replay time.

### Example 3 — Fixed offset (not relative to replay)

- Field: `2024-06-19`
- Config: `date(layout=2006-01-02, offset=24h)`
- Result: `2024-06-20` — regardless of when replay runs.

### Example 4 — Embedded in a larger string (OData-style filter)

Date patterns can appear inside larger extracted values:

```
ReceivedDateTime ge {speedscale_date(720h0m0s)}
```

The `{speedscale_date(...)}` token is the shifted date portion within the full string and is resolved or retained the same way as a standalone pattern.

## Common Misconceptions

1. **"It sets dates to today."**
   No. It preserves the offset between the field and the recording timestamp, applied relative to replay time.

2. **"Preview Mode and live generator replay behave differently for request-side transforms."**
   No. Preview Mode is designed to match generator replay output. Both resolve date patterns to actual dates relative to replay time.

3. **"`offset` shifts relative to current time."**
   No. `offset` adds a fixed duration to the recorded field value. Omit `offset` for replay-relative behavior.

4. **"Seeing `{speedscale_date(...)}` means it's broken."**
   Not necessarily. It is an expected intermediate form during transform processing, and the expected final form for **responder request** transforms, where the pattern is used for signature matching against incoming requests.

5. **"Old dates will pass validation after transform."**
   Only if the preserved offset places them at or after replay time. Past absolute dates stay relatively past.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Date still in the past after replay | Field was a past absolute date; relative shift preserves that offset | Use the `constant` transform for a fixed value, or ensure the recorded date is near the recording time |
| Date is recorded value plus a fixed amount, not relative to today | `offset` parameter is set | Remove `offset` |
| Preview Mode shows `{speedscale_date(...)}` pattern | Viewing intermediate transform output, or the transform is configured on responder request traffic | Check the final preview result; for responder request transforms, the pattern is expected to remain |
| Parse errors | Wrong `layout` for the field's format | Use `auto` or match the exact Go layout |
| Time-of-day mismatch on date-only fields | Missing `precision` | Add `precision=24h` |
| Epoch values not parsing | Wrong layout | Use `epoch` or `epoch_ms`, not a format string |

## Related Transforms

- [`constant`](./constant.md) — replace with a static value; supports `${{...}}` variable substitution. Use when you need a specific fixed date string rather than relative shifting.
- [`smart_replace`](./smart_replace.md) — auto-detects and replaces dynamic values using a different mechanism than date shifting.

For signature and matching scenarios, the `{speedscale_date(...)}` pattern in request fields is what allows the responder (mock server) to match requests that carry different absolute dates.

## Advanced Notes

- The transform does not require response data from a prior request to run.
- `layout=auto` detects the format on the first token and caches it for subsequent requests in the same transform chain.
- Negative durations in `{speedscale_date(...)}` patterns are normal and expected — they indicate the field date was after the recording timestamp.
- The day suffix (`D`) in durations is a Speedscale extension beyond standard Go `time.ParseDuration`.
