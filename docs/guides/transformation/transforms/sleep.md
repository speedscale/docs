# sleep

### Purpose

**sleep** pauses the current request for a specified time period.

### Usage

```json
"type": "sleep",
"config": {
    "duration": "<length of pause with time unit (ex: 1m)>"
}
```

| Key                | Description                                                                                            |
| ------------------ | ------------------------------------------------------------------------------------------------------ |
| **duration**       | duration of pause in go time.Duration format (1ms, 1m, 24h, etc)

### Example

#### Configuration

```json
"type": "sleep",
"config": {
    "separator": "150ms"
}
```

This config will cause the current [vUser](/reference/glossary.md#vuser) (only) to pause for 150ms before sending the current request.
