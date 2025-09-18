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

### Example

### Before and After Example

#### Configuration

```json
{
   "type": "scrub_date",
   "config": {
       "ignorePaths": "createdBy,version"
   }
}
```

#### Example Chains

```
req_body() -> scrub_date()
```

This will scrub all date values from the request body JSON.

```
res_body() -> scrub_date(ignorePaths="lastModified,audit")
```

This will scrub all date values from the response body JSON except those in fields containing "lastModified" or "audit".

```
http_req_header(header="X-Timestamp") -> scrub_date()
```

This will scrub any date values found in the X-Timestamp header.

#### Before (Original Values)

- **Request Body**: `{"orderId": "12345", "timestamp": "2021-04-19T10:30:00Z", "user": {"createdAt": "2021-01-15T08:00:00Z", "lastLogin": "2021-04-19T09:15:30Z"}}`
- **Response Body**: `{"data": {"processedAt": "2021-04-19T10:30:15Z", "expires": "2021-04-20T10:30:15Z", "version": "2021-04-01"}}`

#### After (Scrub Date Transformed)

- **Request Body**: `{"orderId": "12345", "timestamp": "*", "user": {"createdAt": "*", "lastLogin": "*"}}`
- **Response Body**: `{"data": {"processedAt": "*", "expires": "*", "version": "2021-04-01"}}` (version ignored)
