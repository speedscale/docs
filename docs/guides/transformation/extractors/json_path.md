---
description: "Utilize the json_path feature in Speedscale to flatten RRPair data and extract values using JSONPath locators and regex filters for advanced automation tasks"
canonicalUrl: 'https://docs.speedscale.com/guides/transformation/extractors/json_path/'
sidebar_position: 12
---

# json_path

### Purpose

**json_path** flattens the current RRPair down to its JSON representation and then extracts data using a JSONPath locator and regular expression filter. This extractor is very uncommon and is mostly used by automation. If you just want to extract a JSON key from a request or response body, you are most likely looking for a Request Body or Response Body extractor followed by the [json_path transform](../transforms/json_path.md), which takes a path inside the selected body. You can see examples of RRPairs in JSON format by looking inside of your snapshot raw, action or reaction files. These files are what `speedctl pull snapshot` downloads to your local machine in the directory `~/.speedscale/data/snapshots`.

Certain special cases are supported that allow deep inspection inside of certain data types. For example, you can append `.jwt.claims.<name>` to your JSONPath to look "inside" a JWT. See full example below.

In the RRPair JSON, the captured HTTP body is stored base64 encoded under `http.req.bodyBase64` and `http.res.bodyBase64`. A path that enters a body starts there, and the extractor decodes the body and continues into its JSON, for example `http.req.bodyBase64.user.email`. The `http.req.body` and `http.res.body` fields are always empty, so a path that starts with them matches nothing, and the dashboard rejects it.

### Usage

```json
{
  "type": "json_path",
  "config": {
    "path": "<JSON path to data>",
    "regex": "<regular expression to use as a submatch filter>"
  }
}
```

- **path** - (required) A dot-separated path into the RRPair JSON. Array elements are selected by index, as `items.0` or `items[0]`. Wildcards such as `[*]` and filter expressions such as `[?(@.name=='admin')]` are not supported.
- **regex** - (optional) a regular expression to be used as a submatch filter on the extracted value

## Examples

### Example 1: Basic JSON Path Extraction

#### Configuration
```json
{
   "type": "json_path",
   "config": {
       "path": "http.req.bodyBase64.user.email"
   }
}
```

#### Before (RRPair JSON)
```json
{
  "http": {
    "req": {
      "bodyBase64": "eyJ1c2VyIjogeyJlbWFpbCI6ICJqb2huLmRvZUBleGFtcGxlLmNvbSIsICJpZCI6IDEyM319"
    }
  }
}
```

#### After (Extracted Value)
```
john.doe@example.com
```

### Example 2: Array Element Extraction

#### Configuration
```json
{
   "type": "json_path",
   "config": {
       "path": "http.res.bodyBase64.data.items[0].id"
   }
}
```

#### Before (RRPair JSON)
```json
{
  "http": {
    "res": {
      "bodyBase64": "eyJkYXRhIjogeyJpdGVtcyI6IFt7ImlkIjogIml0ZW0tMDAxIiwgIm5hbWUiOiAiUHJvZHVjdCBBIn0sIHsiaWQiOiAiaXRlbS0wMDIiLCAibmFtZSI6ICJQcm9kdWN0IEIifV19fQ=="
    }
  }
}
```

#### After (Extracted Value)
```
item-001
```

### Example 3: Header Extraction with Regex

#### Configuration
```json
{
   "type": "json_path",
   "config": {
       "path": "http.req.headers.Authorization.0",
       "regex": "^(?i)Bearer (.*)(?-i)"
   }
}
```

#### Before (RRPair JSON)
```json
{
  "http": {
    "req": {
      "headers": {
        "Authorization": ["Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."]
      }
    }
  }
}
```

#### After (Extracted Value)
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Example 4: JWT Claims Extraction

#### Configuration
```json
{
   "type": "json_path",
   "config": {
       "path": "http.req.headers.Authorization.0.jwt.claims.sub"
   }
}
```

#### Before (RRPair JSON)
```json
{
  "http": {
    "req": {
      "headers": {
        "Authorization": ["Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"]
      }
    }
  }
}
```

#### After (Extracted Value)
```
1234567890
```

### Example 5: JWT Claims with Email

#### Configuration
```json
{
   "type": "json_path",
   "config": {
       "path": "http.req.headers.Authorization.0.jwt.claims.email"
   }
}
```

#### Before (RRPair JSON)
```json
{
  "http": {
    "req": {
      "headers": {
        "Authorization": ["Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiZW1haWwiOiJqb2huLmRvZUBleGFtcGxlLmNvbSIsImlhdCI6MTUxNjIzOTAyMn0.kP_DYKsOCWRkr-SgT6dhUCrgk4xZBZgGiYxE3xWHYeQ"]
      }
    }
  }
}
```

#### After (Extracted Value)
```
john.doe@example.com
```

### Example 6: Nested Arrays with a Regex Filter

#### Configuration
```json
{
   "type": "json_path",
   "config": {
       "path": "http.res.bodyBase64.users.0.roles.0.permissions",
       "regex": "write|delete"
   }
}
```

#### Before (RRPair JSON)
```json
{
  "http": {
    "res": {
      "bodyBase64": "eyJ1c2VycyI6IFt7ImlkIjogMSwgInJvbGVzIjogW3sibmFtZSI6ICJhZG1pbiIsICJwZXJtaXNzaW9ucyI6ICJyZWFkLHdyaXRlLGRlbGV0ZSJ9XX1dfQ=="
    }
  }
}
```

#### After (Extracted Value)
```
write
```
