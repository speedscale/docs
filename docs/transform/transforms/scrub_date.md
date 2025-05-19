import ScrubDateExample from './scrub_date/scrub-date-example.png'

# scrub_date

**scrub_date** searches for all dates within a JSON payload and replaces them with "*". This is useful for eliminating "flaky" responder requests containing dynamic timestamps. For instance, the request may have a request timestamp that needs to be blanked out. Here is an example of what this transform does:

<img src={ScrubDateExample} width="600"/>


### Usage

```json
"type": "scrub_date",
"config": {
    "ignorePaths": "<comma separated list of keys>"
}
```

:::tip
ignorePaths only requires a string match - it is not a full JSONPath. That means if you want to ignore nested key called "foo" you don't need to enter the full JSONPath (ex: some.nested.key.foo), you only need to enter foo.
:::
