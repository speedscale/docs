# dlp_field

### Purpose

**dlp_field** redacts the current token with a string in format `REDACTED-<sha256> (pattern)`. Pattern will only be present if data pattern discovery is enabled. No DLP configuration is necessary as this transform will always redact the input field.

### Usage

```json
"type": "dlp_field"
```

### Example

#### Configuration

```json
{
   "type": "dlp_field"
}
```

#### Input Token

`4e216b8d-e6ce-4fc6-b566-d44acb6642f4`

#### Transformed Token

`REDACTED-b2291a2a7eed78cdb627354103a6eba35d2e448c20c831ecfc7f3c3b18432f31 (uuid)`
