---
description: "Fail a replay when a chaos rule perturbs more or fewer responses than configured, or a required rule never matches any traffic."
sidebar_position: 7
---

# Chaos Fired

The `chaosFired` assertion checks that each chaos rule in the test config perturbed about as many responses as it was configured to.

It judges the replay as a whole rather than each replayed request. A rule that fires outside its band, or a required rule that no request matched, adds a notification to the report, which then ends in Missed Goals.

### Example <a href="#example" id="example"></a>

```javascript
{
  "type": "chaosFired",
  "config": {
    "required": "payments-outage",
    "tolerance": "5",
    "minFired": "1"
  }
}
```

### Configuration <a href="#configuration" id="configuration"></a>

| Key | Description |
| --- | --- |
| **rules** | Comma-separated chaos rules to judge, by id or name. Unset judges every enabled rule. |
| **required** | Comma-separated chaos rules, by id or name, that fail the assertion when no request matched them. |
| **tolerance** | How many percentage points a rule's perturbed share of its matched requests may be from its expected share. Defaults to 10. |
| **minFired** | The fewest responses each exercised rule must perturb. |

### How rules are judged <a href="#how-rules-are-judged" id="how-rules-are-judged"></a>

Each responder counts, per rule, the requests that matched the rule's scope while the rule was active, and the responses the rule perturbed. The counts from every responder replica are added together at the end of the run.

A rule's expected share is its percent, times the chance at least one of its effects survives its own toxicity. For example, a rule with percent 20 and one effect with toxicity 50 has an expected share of 10.

The band is the matched count times the expected share, plus or minus `tolerance` percentage points, and never below `minFired`. A rule passes when its perturbed count is within the band.

A rule with `stickyBySignature` rolls once per request signature, so it perturbs every request of a signature or none of them. Its share of requests then depends on how traffic splits across signatures, so below 100 percent its band runs from `minFired` to every matched request.

A rule no request matched is reported as not exercised. It fails the assertion only when it is listed in `required`. Rules are evaluated in order and the first match wins, so a rule behind a broader rule may legitimately see no traffic.

The assertion fails with its reason, rather than passing, when the test config has no chaos rules, the replay had no responder, or the responders did not report per-rule counts because they predate this assertion.

### Results <a href="#results" id="results"></a>

Every replay whose test config has chaos rules writes the report artifact `chaos-fired.json`, with or without this assertion. For each rule it lists `ruleId`, `name`, `percent`, `expectedPct`, `matched`, `fired`, and `sendOutcomes`, the perturbed responses by how they were sent. With the assertion, each rule also has `bandLow`, `bandHigh`, `required` and a `verdict` of `PASS`, `OUT_OF_BAND` or `NOT_EXERCISED`; without it the verdict is `UNJUDGED`.

The rules are shown on the report's **Mocked Responses** tab under **Chaos rules**.

The assertion is scored in Speedscale cloud replay reports. A local `proxymock replay` lists it as not evaluated, and a cloud-free cluster replay does not score it.

### What the responder sent <a href="#what-the-responder-sent" id="what-the-responder-sent"></a>

Every RRPair the responder records for a mocked call carries tags that say what the system under test was sent, after transforms, chaos and faults:

| Tag | Value |
| --- | --- |
| `sendOutcome` | `completed`, `withheld` (no response, as chaos "no response" and a stalled connection do), `reset` (the connection was refused or reset), `partial` (the response was cut off, as a dropped connection or a stopped gRPC stream does) or `write-failed` |
| `servedStatus` | The status code sent. Absent when no response was sent. |
| `servedBodySha` | The hex SHA-256 of the body sent. Absent when no response was sent. |

The recorded pair keeps the recorded response, so these tags are the record of the response as served.
