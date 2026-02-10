---
description: "Discover how to effectively use regular expressions with Speedscale transforms to filter and modify traffic data in your applications. This documentation provides a comprehensive guide to utilizing regex patterns for enhanced traffic transformation capabilities."
---

# regex

### Purpose

**regex** extracts the first instance of a regular expression pattern.

Validate regex patterns at https://regex101.com using the Golang flavor.

### Usage

```json
"type": "regex",
"config": {
    "pattern": "<regular expression>"
    "captureGroup": "<int>"
}
```

| Key              | Description |
| ---------------- | ------------|
| **pattern**      | Regular expression pattern to match against.
| **captureGroup** | (optional) Capture group to use when capture groups are defined.  Capture groups start at 1.  By default capture groups may be used but no one group will be selected.

### Example

### Before and After Example

#### Configuration

```json
{
   "type": "regex",
   "config": {
       "pattern": "\\d{4}(-\\d{2}){0,2}$"
   }
}
```

#### Example Chains

```
req_body() -> json_path(path="filter") -> regex(pattern="\\d{4}(-\\d{2}){0,2}$")
```

This will extract the filter field from the request body and extract the date pattern from it.

```
http_req_header(header="User-Agent") -> regex(pattern="Chrome/([0-9.]+)", captureGroup=1)
```

This will extract the Chrome version number from the User-Agent header.

```
res_body() -> json_path(path="url") -> regex(pattern="location/(.*)/info", captureGroup=1)
```

This will extract the location name from a URL path in the response body.

#### Before (Original Values)

- **Filter String**: `filter=(contains(subject, 'order') and ReceivedDateTime ge 2021-04-19`
- **User-Agent**: `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36`
- **URL Path**: `/location/Miami/info`
- **Email Pattern**: `Contact us at support@example.com for help`

#### After (Regex Extracted)

- **Filter String (date extracted)**: `2021-04-19`
- **User-Agent (Chrome version)**: `91.0.4472.124`
- **URL Path (location name)**: `Miami`
- **Email Pattern (email extracted)**: `support@example.com`
