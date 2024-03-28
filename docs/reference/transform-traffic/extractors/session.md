# session

### Purpose

**session** extracts the session ID of the RRPair. Every RRPair has an speedscale-internal data field called a session which is intended to uniquely identify the client making the request. The session field is typically sourced from a JWT or other unique identifier found within the request. Use this extractor if you would like to read or write that field.

### Usage

```
"type": "session"
```

This extractor has no user configuration.

### Example

```
"type": "session"
```
