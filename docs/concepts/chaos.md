---
description: "Explore how to implement Chaos Engineering with Speedscale to test API resilience by simulating failures and manipulating request behaviors for robust applications"
sidebar_position: 6
---

# Chaos Engineering (API)

[Chaos Engineering](https://en.wikipedia.org/wiki/Chaos_engineering#Days_of_Chaos) means designing experiments to ensure that your service will tolerate failures adequately. This term was popularized by Netflix in the early 2010's and was initially focused on experiments involving infrastructure failures like network latency or server failure.

Speedscale introduces chaos at the API level by manipulating individual request response times, status codes and data patterns. For example, Speedscale service mocks can automatically slow down an occasional transaction (versus an entire network connection) or produce an occasional error at random. This is the type of behavior commonly seen when using 3rd party APIs over the internet. Running a chaos oriented test in addition to a stress test provides an extra level of safety for a new build of your code. 

The Speedscale chaos approach is complementary to infrastructure experiments provided by tools like [Gremlin](https://www.gremlin.com/) or [Chaos Monkey](https://netflix.github.io/chaosmonkey/).

## Behavior changes in Chaos v2

Chaos v2 replaces the original chaos implementation with a scoped rule engine. The corrections below are
deliberate, but they change what an existing configuration does at runtime — if a chaos rate or effect mix
looks different after upgrading, this is why.

### Response delay is no longer capped at 5 seconds

This one affects **every** replay and mock run, including those with no chaos configured at all.

The responder previously capped any artificial wait at 5 seconds. That cap applied to the recorded
latency itself, not just to injected delay, so a recording of a 30-second response replayed as a
5-second one, and a "very slow rogue transaction" never looked slow to a client whose timeout was
longer than 5 seconds.

The ceiling is now the generator's `requestTimeoutSeconds` when the test config sets one, and 30
seconds otherwise, with a hard maximum of 60 seconds. An individual rule can lower it with
`maxLatencyMs`. Runs whose recordings contain responses slower than 5 seconds will take longer than
they used to.

### Chaos fires at the configured percent, not one in a hundred more

The selection test was `<=` against a roll in `[0, 99]`, so a rule fired `percent + 1` times per
hundred. The absolute error was always one request in a hundred, but the relative error was largest
at low percentages: `chaosPercent: 1` fired roughly twice as often as configured.

### Every effect on a matched rule now applies

Enabling more than one of `badStatusCodes`, `intermittentResponses` and `randomLatency` previously
cycled through them round-robin, so exactly one effect fired per chaosed transaction. Effects now
compose, each gated by its own independent probability (`toxicity`), following Toxiproxy's toxic
semantics.

An existing configuration folds into a single match-all rule whose effects each carry
`toxicity = 100/N`, which preserves how often each effect fires on average. What changes is that the
effects are now independent: two can fire on the same transaction, or none can.

### Effect selection is seeded and reproducible

The 404-versus-500 choice and the factor-versus-fixed latency choice were both
`time.Now().UnixNano() % 2`, which correlated with arrival time and made a run impossible to
reproduce. Both are now derived from a seeded hash of the rule, request signature and occurrence.

One consequence is worth calling out: when a configuration sets **both** `randomHighLatencyFactor`
and `randomHighLatencyMs`, the factor now always wins, where the old coin flip alternated between
them.

### `X-Speedscale-Chaos: none` is no longer emitted

An unchaosed response previously carried the header with the literal value `none`. Absence of the
header is now the signal that nothing was applied. Anything matching on the string `none` must check
for the header being absent instead.

The header is also richer when chaos *did* apply: it lists every effect and names the rule that
fired, as `effect=latency;effect=status code;rule=chaos-1`. Readers should split on `;`, parse
`key=value`, and ignore keys they do not recognize.

### `intermittentResponses` actually withholds a response

It never did before. The generator returned "no response" but the responder still wrote the reply,
with the full recorded body and a status of `0` — which `net/http` sends as `200 OK`, silently
downgrading a recorded `201` in the process. Anyone who believed they had tested their client's
behavior against a dropped response had not.

The connection is now closed without a reply. Clients that were quietly succeeding against this will
start seeing the failure it was always supposed to produce.

### `--fault` is unchanged

The local `--fault` flag keeps its own `rate=F/N` counter, and overlapping `--fault` rules still merge
their effects rather than resolving first-match-wins. Chaos rules use a seeded probability and
first-match-wins ordering. The two selection models coexist deliberately for now; `--fault` compiling
into the rule engine is tracked separately.
