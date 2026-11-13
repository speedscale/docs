---
description: "Fail a replay when the outbound HTTP calls an app makes to its mocked dependencies differ from the recording: missing, unexpected or repeated calls, changed arguments, and hosts that were not mocked."
sidebar_position: 6
---

# HTTP Output

The `httpOutput` assertion compares the outbound HTTP calls the app made to its mocked dependencies during a replay with the calls it made in the recording.

It judges the replay as a whole rather than each replayed request, so it does not change the per-request assertion counts. A difference adds a notification to the report, which then ends in Missed Goals.

The mock answers whatever the app sends as long as the request matches a signature, so a changed write to a dependency can still pass every response check. This assertion is where that change shows.

### Example <a href="#example" id="example"></a>

```javascript
{
  "type": "httpOutput",
  "config": {
    "ignore": "telemetry.example.com,/healthz",
    "countTolerance": "10",
    "maxRetries": "1",
    "mockRequired": "api.stripe.com,*.payments.example.com"
  }
}
```

### Configuration <a href="#configuration" id="configuration"></a>

| Key | Description |
| --- | --- |
| **includeOnly** | Comma-separated hosts or paths. When set, only calls to these are compared. A host can be exact (`api.stripe.com`) or a domain with every host under it (`*.example.com`). A path (`/v1/charges`) matches itself and everything under it, on any host. `api.stripe.com/v1` combines both. |
| **ignore** | Hosts or paths, in the `includeOnly` form, whose calls are left out of the comparison. |
| **countTolerance** | How far, in percent, an endpoint's call count may be from the recording's before it is a `COUNT` or `RETRIES` difference. Defaults to 0. |
| **maxRetries** | How many times the app may repeat each recorded call, beyond what `countTolerance` allows, before the repeats are a `RETRIES` difference. Defaults to 0. |
| **mockRequired** | Comma-separated hosts every call to which must be answered by a mock, in the `includeOnly` host form. A miss or passthrough on one of them is a `PASSTHROUGH` difference. |

### How calls are compared <a href="#how-calls-are-compared" id="how-calls-are-compared"></a>

Calls are grouped by endpoint: host, method, and the request path with identifier segments templated, so `/users/42` and `/users/7` are the same endpoint.

Within an endpoint, a call's shape is the set of its query parameter and body field names. Calls of the same shape are compared field by field.

A field whose recorded values vary from call to call, or look generated (UUIDs, opaque tokens, ULIDs, timestamps), is never compared, so idempotency keys and request IDs do not fail the assertion.

Recorded counts are scaled by how many times the replay ran the recorded tests. A replay that runs the tests twice is expected to make every call twice.

Mocks recorded for sessions or services the replay did not run as tests are not expected, so unused fixtures are not reported as missing.

Calls are compared for the whole run. There is no attribution of an outbound call to the inbound request that caused it.

### Differences <a href="#differences" id="differences"></a>

| Kind | Meaning |
| --- | --- |
| `MISSING` | The recording called an endpoint that the replay never called. |
| `UNEXPECTED` | The replay called an endpoint that the recording never called. |
| `COUNT` | Both called the endpoint, but the replay's call count is outside `countTolerance` of the scaled recorded count. |
| `RETRIES` | The replay made more calls of a recorded request than `countTolerance` and `maxRetries` together allow. Repeats are not counted again as `COUNT`. |
| `ARGUMENT` | A query parameter or body field that is stable in the recording has another value in the replay, or a field was added or dropped. |
| `PASSTHROUGH` | A call to a `mockRequired` host was missed or passed through to the live service. |

### When the comparison cannot run <a href="#when-the-comparison-cannot-run" id="when-the-comparison-cannot-run"></a>

The assertion fails with its reason, rather than passing, when:

- the replay had no responder, so no outbound calls were mocked,
- the responder ran in low data mode and kept none of the app's requests,
- the responder kept only the first 100 misses of a signature and dropped some on a compared host, so call counts are incomplete. The differences found are still listed.

### Results <a href="#results" id="results"></a>

The differences are written to the report artifact `http-output-diff.json` and shown on the report's **Accuracy** tab under **Outbound HTTP calls**. Each difference has `kind` (without the `HTTP_OUTPUT_DIFF_` prefix), `host`, `method`, `endpoint`, `field`, `expected`, `actual` and `count`. The file also carries `evaluated`, `error`, `truncated`, `callsExpected`, `callsActual` and `multiplier`.

A cloud replay is scored by the analyzer. A cloud-free cluster replay is scored by the generator from the calls the responder staged at the forwarder; it compares at most 20,000 calls and fails with a reason past that.

A local `proxymock replay` has no responder of its own. It evaluates `httpOutput` only when given the directory `proxymock mock` wrote while it served the replay, with `--mocks-out`, and then writes `http-output-diff.json` beside its replay verdict. Without `--mocks-out` the assertion is reported as not evaluated and does not change the exit code. `proxymock replay score --mocks-out <dir>` scores a finished local replay the same way.
