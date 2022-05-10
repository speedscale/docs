
# Replay Rules

## Generator

This section controls the behavior of the Speedscale load generator.

**Number of traffic copies** - Determines how many replicas of the traffic the generator will start concurrently. This is similar to the vUser setting in a traditional testing tool but not exactly because a single traffic recording could have multiple users.

Request wait between calls:

1. **Zero wait time** - calls will be sent as fast as possible with no artifical delay
2. **As recorded** - calls will be made with the same delay as observed in the real traffic (note: long snapshots will take a long time to run)
3. **Fixed time between requests** - each request will be sent the specified number of milliseconds after the last response is received

Duration:

**Replay traffic continuously** - keeps the generator running the same traffic over and over for the specified timeframe

## Responder

This section controls how the automatic mocking system (responders) will respond to requests sent from the service under test.
### Chaos

The Speedscale Responder can be configured to provide API request-level chaos responses. This is complimentary to traditional infrastructure chaos engineering because instead of breaking entire components, the application resiliency is tested for a single bad or slow response.

Three kinds of chaos are currently available:
1. **No Response** - the responder will provide no response and allow the app to timeout waiting
2. **Bad status code (404, 500)** - the responder will provide a 404 or 500 response instead of the correct status code
3. **High response time** - the responder will respond correctly, but after a specified duration

Chaos, by definition, is random but we allow you to configure how frequently bad responses will be sent. Set the **Active Chaos** parameter to determine the probability of the app receiving a bad response. For example, if the Active Chaos is set to 100% all mock responses will experience some kind of chaos. If Active Chaos is set to 0%, no bad responses will be sent.

The responder rotates through each type of bad response that is selected. For instance, if Active Chaos is set to 50% and all three options are checked (No response, Bad status code and High response time) then the app will receive roughly 16.6% No Response, 16.6% Bad status code and 16.6% High response time (16.6+16.6+16.6 = 50%).
