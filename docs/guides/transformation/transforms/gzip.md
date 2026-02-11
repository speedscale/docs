---
sidebar_position: 12
---

# gzip

### Purpose

**gzip** compresses a raw byte slice and back again.

### Usage

```json
"type": "gzip"
```

### Example

### Before and After Example

#### Configuration

```json
{
    "type": "gzip"
}
```

#### Example Chains

```
req_body() -> json_path(path="largePayload") -> gzip()
```

This will extract the largePayload field from the request body and compress it using gzip.

```
res_body() -> json_path(path="compressedData") -> gzip()
```

This will extract compressed data from the response body and decompress it.


#### Before (Uncompressed Text)

- **Large JSON Payload**: `{"users":[{"id":1,"name":"John","email":"john@example.com"},{"id":2,"name":"Jane","email":"jane@example.com"}]}`
- **Log Message**: `ERROR: DATABASE CONNECTION FAILED AT 2024-01-15 10:30:00 - RETRYING IN 5 SECONDS`
- **Configuration Data**: `DATABASE_URL=POSTGRESQL://USER:PASS@HOST:5432/DB`
- **API Response**: `SPEEDSCALE CAN'T WAIT TO HELP ME SAVE TIME AND STOP QUALITY ISSUES`

#### After (Gzip Compressed - Binary Data)

- **Large JSON Payload**: *(compressed binary)*
- **Log Message**: *(compressed binary)*
- **Configuration Data**: *(compressed binary)*
- **API Response**: *(compressed binary)*
