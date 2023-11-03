# store_sig

### Purpose

Speedscale service mocks are matched using both automated and user defined signatures. Each request to an outbound system generates a request signature during snapshot analysis. If the signature of a request sent to the service mock engine matches a known signature then a response is returned. Not every data point in the request is used for comparison. Speedscale automatically applies known and likely signature data points to help match without creating noise.

Use this transform if you'd like to manually add any data items to the analysis. This transform will only have an effect in the Speedscale service mocking container; it should not affect load generation.

### Usage

```
"type": "store_sig",
"config": {
    "key": "<optional, name to assign this data for readability>"
}
```

- **key** - Name to assign this data for readability. This is optional because it is not used as part of the signature. Any existing value is replaced.

### Example

#### Configuration

```
"type": "store_sig",
"config": {
    "key": "look_here"
}
```
