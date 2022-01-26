# date

### Purpose

**date** parses and inspects a timestamp, determines how far the timestamp differs from the recording time, and then updates the timestamp with the same offset from the current time. Or said more simply, it shifts timestamps so when they are replayed they have the same offset as when they were recorded.

For example, if the RRPair was recorded on `2021-05-19` but the time in a particular HTTP Header is `2021-06-19` then the resulting pattern would be `{speedscale_date(-744h0m0s)}`. This transform will have determined that the date in the HTTP Header is 31 days offset from the date it was recorded.

When the transaction is replayed in the generator, the current date shifted by 31 days will be automatically applied to that HTTP Header. The Service Under Test will get a date that is 31 days from the current date, just like when the traffic was first recorded. Note that in this example we used a round date to keep things simple but this can be applied to timestamps with nanosecond precision.

Check the [Common Patterns](../common-patterns/) section for practical examples.

### Usage

```
"type": "date",
"config": {
    "layout": "<date format>",
    "precision": "<rounding precision>"
}
```

**layout** - the expected date time format according to the Go time [format](https://pkg.go.dev/time#example-Time.Format)

The following layouts may also be used, which are not supported in the Go time format:

* **epoch** - Seconds since the Unix Epoch
* **epoch\_ms** - Milliseconds since the Unix Epoch

**precision** - a time interval to round the value to (like 1h). This is a possibly signed sequence of decimal numbers, each with optional fraction and a unit suffix, such as "300ms", "-1.5h" or "2h45m". Valid time units are "ns", "us" (or "µs"), "ms", "s", "m", "h".

### Example

#### Configuration

```
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

`{speedscale_date(-744h0m0s)}`

{% hint style="info" %}
Note that the transformed token is a placeholder representing the relative timestamp. The correct final timestamp will be inserted by the generator before sending.
{% endhint %}
