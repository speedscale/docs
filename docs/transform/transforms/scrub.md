# scrub_date

**scrub_date** replaces the incoming string with a new value. This works similar to [scrub_date](./smart_replace.md) in that it does a find/replace on the current RRPair. This is typically used to "blank out" rotating values like request IDs in a responder signature match. Using this transform will increase your match rate.

If you want the responder to learn the new value as a replacement for the old value before blanking it out you should insert *smart_replace_recorded* before using this transform. The combination of those transforms will cause the responder to learn that the new incoming value should replace the old value in subsequent RRPairs while also blanking it out in the current request to improve the match rate.

### Usage

```json
"type": "scrub",
"config": {
    "ignorePaths": "<comma separated list of keys>",
    "new": "<optional, defaults to *>"
}
```

:::tip
ignorePaths only requires a string match - it is not a full JSONPath. That means if you want to ignore nested key called "foo" you don't need to enter the full JSONPath (ex: some.nested.key.foo), you only need to enter foo.
:::
