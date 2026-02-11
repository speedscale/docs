---
canonicalUrl: 'https://docs.speedscale.com/reference/transform-traffic/extractors/json_path/'
sidebar_position: 12
---

# json_path

### Purpose

**json_path** flattens the current RRPair down to its JSON representation and then extracts data using a JSONPath locator and regular expression filter. This extractor is very uncommon and is mostly used by automation. If you just want to extract a JSON key you are most likely looking for the [json_path](../transforms/json_path.md). You can see examples of RRPairs in JSON format by looking inside of your snapshot raw, action or reaction files. These files are what `speedctl pull snapshot` downloads to your local machine in the directory `~/.speedscale/data/snapshots`.

Certain special cases are supported that allow deep inspection inside of certain data types. For example, you can append `.jwt.claims.<name>` to your JSONPath to look "inside" a JWT. See full example below.

### Usage

```json
"type": "json_path",
"config": {
    "path": "<JSON path to data>",
    "regex": "<regular expression to use as a submatch filter>
}
```

- **path** - A properly formatted JSON Path expression with a few extra features.
- **regex** - (optional) a regular expression to be used as a submatch filter on the extracted value

## Examples

### Example 1: Basic JSON Path Extraction

#### Configuration
```json
{
   "type": "json_path",
   "config": {
       "path": "http.req.body.user.email"
   }
}
```

#### Before (RRPair JSON)
```json
{
  "http": {
    "req": {
      "body": "{\"user\": {\"email\": \"john.doe@example.com\", \"id\": 123}}"
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
       "path": "http.res.body.data.items[0].id"
   }
}
```

#### Before (RRPair JSON)
```json
{
  "http": {
    "res": {
      "body": "{\"data\": {\"items\": [{\"id\": \"item-001\", \"name\": \"Product A\"}, {\"id\": \"item-002\", \"name\": \"Product B\"}]}}"
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

### Example 6: Nested JSON with Filtering

#### Configuration
```json
{
   "type": "json_path",
   "config": {
       "path": "http.res.body.users[*].roles[?(@.name=='admin')].permissions",
       "regex": "write|delete"
   }
}
```

#### Before (RRPair JSON)
```json
{
  "http": {
    "res": {
      "body": "{\"users\": [{\"id\": 1, \"roles\": [{\"name\": \"admin\", \"permissions\": \"read,write,delete\"}]}]}"
    }
  }
}
```

#### After (Extracted Value)
```
write
```

