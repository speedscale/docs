---
sidebar_position: 7
---

# date

### Purpose

**date** parses and updates timestamps.

There are 2 primary ways to configure this transform.

- Automatically update the timestamp based on the difference between the recorded timestamp and the current timestamp
- Manually set an offset

#### Automatic

This mode determines how far the timestamp differs from the recording time, and then updates the timestamp with the same offset from the current time. Or said more simply, it shifts timestamps so when they are replayed they have the same offset as when they were recorded.

For example, if the RRPair was recorded on `2021-05-19` but the time in a particular HTTP Header is `2021-06-19` then the resulting pattern would be `{speedscale_date(-744h0m0s)}`. This transform will have determined that the date in the HTTP Header is 31 days offset from the date it was recorded.

When the transaction is replayed in the generator, the current date shifted by 31 days will be automatically applied to that HTTP Header. The Service Under Test will get a date that is 31 days from the current date, just like when the traffic was first recorded. Note that in this example we used a round date to keep things simple but this can be applied to timestamps with nanosecond precision.

Do not configure an offset to automatically update the timestamp.

#### Manual Offset

Providing an offset will offset the timestamp by that duration.  Use a positive value to shift forward or negative to shift back.

### Usage

```json
"type": "date",
"config": {
    "layout": "<date format>",
    "precision": "<rounding precision>"
}
```

- **layout** - the expected date time format according to the Go time [format](https://pkg.go.dev/time#example-Time.Format)

The following layouts may also be used, which are not supported in the Go time format:

- **auto** - Speedscale will check a wide variety of common formats automatically
- **epoch** - Seconds since the Unix Epoch
- **epoch_ms** - Milliseconds since the Unix Epoch

- **precision** - a time interval to round the value to (like 1h). This is a possibly signed sequence of decimal numbers, each with optional fraction and a unit suffix, such as "300ms", "-1.5h" or "2h45m". Valid time units are "ns", "us" (or "µs"), "ms", "s", "m", "h", "d".
- **offset** - a duration to shift the timestamp by (like 1h). This is a possibly signed sequence of decimal numbers, each with optional fraction and a unit suffix, such as "300ms", "-1.5h" or "2h45m". Valid time units are "ns", "us" (or "µs"), "ms", "s", "m", "h", "d".

### Example - Automatic

:::note
Leave the layout blank (or set to `auto`) and Speedscale will usually figure out the format.
:::

#### Configuration

```json
"type": "date",
"config": {
    "layout": "2006-01-02",
    "precision": "24h"
}
```

#### Input Token

```
2021-04-19
```

#### Transformed Token

```
{speedscale_date(-744h0m0s)}
```

:::info
Note that the transformed token is a placeholder representing the relative timestamp. The correct final timestamp will be inserted by the generator before sending.
:::

### Example - Manual Offset

#### Configuration

```json
"type": "date",
"config": {
    "layout": "auto",
    "offset": "-1d2h3m4s"
}
```

#### Input Token

```
Mon, 12 Dec 2022 16:36:54 GMT
```

#### Transformed Token

```
Sun, 11 Dec 2022 14:33:50 GMT
```

