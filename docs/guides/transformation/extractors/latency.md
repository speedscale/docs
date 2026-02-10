# latency

### Purpose

**latency** extracts the expected latency for this RRPair. This extractor is typically used in the responder to modify response time before sending the response back. The normal pattern to modify the latency would be `latency() <-> constant("100ms")`.

### Usage

```json
"type": "latency"
```

This extractor has no user configuration.

### Example

```json
"type": "latency"
```
