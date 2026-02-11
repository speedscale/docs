---
title: File Format
sidebar_position: 7
---

# Markdown Format Specification

## Overview

**proxymock** creates files as artifacts when recording, replaying, and mocking. The [RRPair](/reference/glossary.md#rrpair) markdown format is a human-readable representation of API traffic data used by Speedscale. This format allows developers and LLMs to easily read, understand, and modify API request/response data while maintaining all necessary technical details for accurate replay.

:::note
The markdown format is not supported for all protocols.  For protocols without
markdown support JSON will be used instead.
:::

## Key Benefits

- **Human Readable**: Easy to read and understand API interactions
- **LLM Friendly**: Structured format ideal for AI analysis and generation
- **Round-trip Conversion**: Lossless conversion between markdown and internal formats
- **Version Control**: Text-based format works well with git and diff tools
- **Debugging**: Simple format for troubleshooting API issues

## File Structure

RRPair markdown files use section headers with the pattern `### SECTION_NAME ###` to organize content. Each section's content is wrapped in triple backticks (```):

````markdown
### REQUEST ###
```
METHOD PROTOCOL://HOST:PORT/PATH?QUERY HTTP/VERSION
Header-Name: Header-Value
```

```
BODY
```

### RESPONSE ###
```
HTTP/VERSION STATUS_CODE STATUS_MESSAGE
Header-Name: Header-Value
```

```
{
  "response": "body content here"
}
```

### SIGNATURE ###
```
key1 is value1
key2 is value2
key3 is -NONE-
```

### METADATA ###
```
direction: IN|OUT
uuid: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
ts: YYYY-MM-DDTHH:MM:SS.nnnnnnnnnZ
duration: DURATION
tags: key1=value1, key2=value2
```

### INTERNAL - DO NOT MODIFY ###
```
json: {"msgType":"rrpair","ts":"YYYY-MM-DDTHH:MM:SS.nnnnnnnnnZ",...}
```
````

## Section Specifications

### REQUEST Section

The REQUEST section represents the HTTP request made to an API endpoint.

#### Format
````markdown
### REQUEST ###
```
METHOD PROTOCOL://HOST:PORT/PATH?QUERY HTTP/VERSION
Header-Name: Header-Value
Another-Header: value1, value2
Trailer: T1, T2, T3
T1: trailer-value-1
T2: trailer-value-2
T3: trailer-value-3
```

```
{
  "request": "body content here"
}
```
````

#### Rules
- **First Line**: HTTP request line with method, full URL, and protocol version
- **Headers**: Listed alphabetically, case-sensitive
- **Multi-value Headers**: Joined with `, ` (comma-space)
- **Trailer Headers**: Listed after `Trailer:` header
- **Content-Length**: Automatically calculated, excluded from display
- **Section Wrapping**: Headers and body are wrapped in separate backtick blocks
- **Body Formatting**: JSON is pretty-printed, HTML is formatted

#### Example
````markdown
### REQUEST ###
```
POST https://api.example.com/v1/users HTTP/2.0
Authorization: Bearer eyJ0eXAiOiJKV1Q...
Content-Type: application/json
User-Agent: MyApp/1.0
```

```
{
  "username": "john_doe",
  "email": "john@example.com"
}
```
````

### RESPONSE Section

The RESPONSE section represents the HTTP response from an API endpoint.

#### Format
````markdown
### RESPONSE ###
```
HTTP/VERSION STATUS_CODE STATUS_MESSAGE
Header-Name: Header-Value
```

```
{
  "response": "body content here"
}
```
````

#### Rules
- **Status Line**: First line contains HTTP version, status code, and status message
- **Headers**: Listed alphabetically, case-sensitive
- **Content-Length**: Excluded (recalculated during processing)
- **Body Formatting**: JSON pretty-printed, HTML formatted
- **Empty Bodies**: Represented as empty section

#### Example
````markdown
### RESPONSE ###
```
HTTP/2.0 201 Created
Content-Type: application/json
Location: /users/12345
X-Request-ID: abc123
```

```
{
  "id": 12345,
  "username": "john_doe",
  "email": "john@example.com",
  "created_at": "2024-01-15T14:30:22Z"
}
```
````


### SIGNATURE Section

The SIGNATURE section defines matching criteria for request replay.

#### Format
````markdown
### SIGNATURE ###
```
key1 is value1
key2 is value2
key3 is -NONE-
```
````

#### Rules
- **Format**: `key is value`
- **Empty Values**: Represented as `-NONE-`
- **Alphabetical Order**: Keys sorted alphabetically
- **Common Keys**:
  - `http:host` - Target hostname
  - `http:method` - HTTP method
  - `http:url` - URL path
  - `http:queryparams` - Query parameters
  - `instance` - Instance number for disambiguation

#### Example
````markdown
### SIGNATURE ###
```
http:host is api.example.com
http:method is POST
http:queryparams is -NONE-
http:url is /v1/users
instance is 0
```
````

### METADATA Section

Contains essential metadata about the request-response pair.

#### Format
````markdown
### METADATA ###
```
direction: IN|OUT
uuid: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
ts: 2024-01-15T14:30:22.123456789Z
duration: 150ms
tags: key1=value1, key2=value2
```
````

#### Fields
- **direction**: Traffic direction (`IN` for incoming, `OUT` for outgoing)
- **uuid**: Unique identifier in standard UUID format
- **ts**: Timestamp in RFC3339Nano format (ISO 8601 with nanoseconds)
- **duration**: Request duration in milliseconds
- **tags**: Comma-separated key=value pairs for categorization

#### Example
````markdown
### METADATA ###
```
direction: IN
uuid: f3ead946-90b1-43ab-a7d6-be3f799e8e83
ts: 2024-01-15T14:30:22.489942Z
duration: 155ms
tags: environment=staging, service=user-api, test_case=registration
```
````

### INTERNAL Section

Contains the complete JSON representation of the RRPair for system use.  This is
not intended for humans.

#### Format
````markdown
### INTERNAL - DO NOT MODIFY ###
```
json: {"msgType":"rrpair","ts":"2024-01-15T14:30:22.489942Z",...}
```
````

#### Rules
- **Single Line**: Entire JSON object on one line
- **Base Truth**: Used as foundation during decoding
- **Override**: Other sections override specific fields
- **No Manual Editing**: Should not be modified by hand
- **Base64 Encoding**: Binary data encoded as base64 in JSON

## Content Processing

### JSON Bodies
- **Pretty Printing**: 2-space indentation for readability
- **Compaction**: Whitespace removed during decoding
- **Auto-Detection**: JSON content detected regardless of Content-Type
- **Validation**: Invalid JSON preserved as-is

### HTML Bodies
- **Formatting**: Uses gohtml formatter for readability
- **Minification**: Whitespace optimized during decoding
- **Content-Type Required**: Must have Content-Type containing "html"

### Binary Content
- **Base64 Encoding**: Binary data encoded in INTERNAL section
- **Preservation**: Original binary content maintained
- **Display**: May show as placeholder in markdown sections

### Headers
- **Sorting**: Alphabetical by header name
- **Case Preservation**: Original case maintained
- **Multi-value**: Multiple values joined with `, `
- **Escaping**: Commas escaped as `\,`, backslashes as `\\`
- **Content-Length**: Automatically excluded and recalculated

## Complete Examples

### API Request Example
````markdown
### REQUEST ###
```
POST https://api.payment.com/v1/charges HTTP/2.0
Authorization: Bearer sk_test_123456789
Content-Type: application/json
Idempotency-Key: charge_12345
```

```
{
  "amount": 2000,
  "currency": "usd",
  "source": "tok_visa",
  "description": "Test charge"
}
```

### RESPONSE ###
```
HTTP/2.0 200 OK
Content-Type: application/json
Request-ID: req_abc123def456
```

```
{
  "id": "ch_1234567890",
  "amount": 2000,
  "currency": "usd",
  "status": "succeeded",
  "created": 1642176622
}
```

### SIGNATURE ###
```
http:host is api.payment.com
http:method is POST
http:queryparams is -NONE-
http:url is /v1/charges
instance is 0
```

### METADATA ###
```
direction: IN
uuid: f3ead946-90b1-43ab-a7d6-be3f799e8e83
ts: 2024-01-15T14:30:22.489942Z
duration: 155ms
tags: service=payment, environment=test
```

### INTERNAL - DO NOT MODIFY ###
```
json: {"msgType":"rrpair","ts":"2024-01-15T14:30:22.489942Z","l7protocol":"http","duration":155,"tags":{"service":"payment","environment":"test"},"uuid":"8+rZRpCxQ6un1r4/eZ6Ogw==","direction":"IN","http":{"req":{"url":"/v1/charges","uri":"/v1/charges","version":"2.0","method":"POST","host":"api.payment.com","headers":{"Authorization":["Bearer sk_test_123456789"],"Content-Type":["application/json"],"Idempotency-Key":["charge_12345"]}},"res":{"contentType":"application/json","statusCode":200,"statusMessage":"200 OK","headers":{"Content-Type":["application/json"],"Request-ID":["req_abc123def456"]},"bodyBase64":"eyJpZCI6ImNoXzEyMzQ1Njc4OTAiLCJhbW91bnQiOjIwMDAsImN1cnJlbmN5IjoidXNkIiwic3RhdHVzIjoic3VjY2VlZGVkIiwiY3JlYXRlZCI6MTY0MjE3NjYyMn0="}}}
```
````

### Outbound API Request Example
````markdown
### REQUEST ###
```
GET http://internal-api.company.com/v1/users?limit=10&offset=0 HTTP/1.1
Authorization: Bearer internal_token_123
User-Agent: MyService/2.1.0
```

```

```

### RESPONSE ###
```
HTTP/1.1 200 OK
Content-Type: application/json
X-API-Version: v1
```

```
{
  "users": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com"
    },
    {
      "id": 2,
      "name": "Jane Smith",
      "email": "jane@example.com"
    }
  ],
  "total": 2
}
```

### SIGNATURE ###
```
http:host is internal-api.company.com
http:method is GET
http:queryparams is limit=10&offset=0
http:url is /v1/users
instance is 0
```

### METADATA ###
```
direction: OUT
uuid: ba659889-6d94-40f1-b49f-d78f38df7dbd
ts: 2024-01-15T14:31:25.250965Z
duration: 42ms
tags: service=user-api, call_type=internal
```

### INTERNAL - DO NOT MODIFY ###
```
json: {"msgType":"rrpair","ts":"2024-01-15T14:31:25.250965Z","l7protocol":"http","duration":42,"tags":{"service":"user-api","call_type":"internal"},"uuid":"umWYiW2UQPG0n9ePON99vQ==","direction":"OUT","http":{"req":{"url":"/v1/users","uri":"/v1/users?limit=10&offset=0","version":"1.1","method":"GET","host":"internal-api.company.com","headers":{"Authorization":["Bearer internal_token_123"],"User-Agent":["MyService/2.1.0"]}},"res":{"contentType":"application/json","statusCode":200,"statusMessage":"200 OK","headers":{"Content-Type":["application/json"],"X-API-Version":["v1"]},"bodyBase64":"eyJ1c2VycyI6W3siaWQiOjEsIm5hbWUiOiJKb2huIERvZSIsImVtYWlsIjoiam9obkBleGFtcGxlLmNvbSJ9LHsiaWQiOjIsIm5hbWUiOiJKYW5lIFNtaXRoIiwiZW1haWwiOiJqYW5lQGV4YW1wbGUuY29tIn1dLCJ0b3RhbCI6Mn0="}},"signature":{"http:host":"aW50ZXJuYWwtYXBpLmNvbXBhbnkuY29t","http:method":"R0VU","http:queryparams":"bGltaXQ9MTAmb2Zmc2V0PTA=","http:url":"L3YxL3VzZXJz","instance":"MA=="}}
```
````

## Usage Guidelines

### For Humans
- Focus on REQUEST, RESPONSE, and METADATA sections for understanding
- Use SIGNATURE section to understand request matching criteria
- INTERNAL section contains technical details but is not meant for manual editing
- Headers and bodies are formatted for readability
- Timestamps and UUIDs provide traceability

### For LLMs
- Parse section headers (`### SECTION_NAME ###`) to identify content types
- REQUEST and RESPONSE sections contain the actual API interaction data
- METADATA provides context about timing, direction, and categorization
- SIGNATURE section defines matching criteria for replay scenarios
- INTERNAL section contains complete technical representation
- Body content may be JSON (formatted) or other content types
- Headers are consistently formatted and sorted

### For Tools and Scripts
- Use the INTERNAL section as the authoritative source
- Other sections provide human-readable overlays
- Round-trip conversion preserves all data
- Headers exclude Content-Length (recalculated automatically)
- JSON bodies are formatted for display, compacted for processing

## Best Practices

1. **Don't Edit INTERNAL**: The INTERNAL section should be treated as read-only (unless you are experienced with proxymock)
2. **Preserve Formatting**: Maintain the section header format exactly
3. **Header Consistency**: Keep headers alphabetically sorted
4. **Body Formatting**: Let tools handle JSON/HTML formatting
5. **Metadata Accuracy**: Ensure timestamps and UUIDs are valid
6. **Tag Organization**: Use consistent tag naming conventions
7. **Signature Completeness**: Include all necessary matching criteria

