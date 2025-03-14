---
description: "The Speedscale documentation provides detailed guidance on transforming traffic using DLP (Data Loss Prevention) in JSON format, ensuring effective management of sensitive data within your applications. Learn how to implement these transforms to enhance your data protection strategies."
---

# dlp_json

### Purpose

**dlp_json** accepts a JSON input and redacts sensitive keys. The keys to be redcated are controlled by the DLP configuration used by the generator, analyzer or responder. See more information on configuring the DLP [here](../../guides/dlp.md).

### Usage

```json
"type": "dlp_json"
```

### Example

#### Configuration

```json
{
   "type": "dlp_json"
}
```

#### Input Token

`{"userId":"4e216b8d-e6ce-4fc6-b566-d44acb6642f4"}`

#### Transformed Token

`{"userId":"REDACTED-b2291a2a7eed78cdb627354103a6eba35d2e448c20c831ecfc7f3c3b18432f31 (uuid)"}`
