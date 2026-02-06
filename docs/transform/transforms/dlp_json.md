---
description: "The Speedscale documentation provides detailed guidance on transforming traffic using DLP (Data Loss Prevention) in JSON format, ensuring effective management of sensitive data within your applications. Learn how to implement these transforms to enhance your data protection strategies."
---

# dlp_json

### Purpose

**dlp_json** accepts a JSON input and redacts sensitive keys. This transform operates on specific JSON keys defined in the DLP configuration - it does not walk through all JSON keys automatically. The keys to be redacted are controlled by the DLP configuration used by the generator, analyzer or responder. See more information on configuring the DLP [here](/dlp/).

### Usage

```json
"type": "dlp_json"
```

### Example

### Before and After Example

#### Configuration

```json
{
   "type": "dlp_json"
}
```

#### Example Chains

```
req_body() -> dlp_json()
```

This will walk the entire request body of an RRPair and then redacting JSON values that appear to be sensitive information according to the current dlp configuration of the generator, responder or forwarder.

```
res_body() -> dlp_json()
```

This will walk the entire response body of an RRPair and then redacting JSON values that appear to be sensitive information according to the current dlp configuration of the generator, responder or forwarder.

```
res_body() -> json_path(path="foo") -> dlp_json()
```

This will extract the contents of the json key foo within the response body. Those contents will be treated as nested JSON and then walked to find sensitive values according to the dlp configuration of the generator, responder or forwarder.


#### Before (Original JSON)

```json
{
  "user": {
    "id": "4E216B8D-E6CE-4FC6-B566-D44ACB6642F4",
    "profile": {
      "email": "JOHN.DOE@EXAMPLE.COM",
      "contact": {
        "phoneNumber": "+1-555-123-4567"
      }
    }
  },
  "payment": {
    "creditCard": "4532-1234-5678-9012",
    "identity": {
      "ssn": "123-45-6789"
    }
  }
}
```

#### After (DLP Transformed JSON)

```json
{
  "user": {
    "id": "REDACTED-UUID-B2291A2A7EED78CDB627354103A6EBA35D2E448C20C831ECFC7F3C3B18432F31",
    "profile": {
      "email": "REDACTED-EMAIL-8F14E45FCEEA167A5A36DEDD4BEA2543",
      "contact": {
        "phoneNumber": "REDACTED-PHONE_NUMBER-D0941E68D8C82D3C87D0C8E73C7D0E8A"
      }
    }
  },
  "payment": {
    "creditCard": "REDACTED-CREDIT_CARD-C3499C2729730A7F807EFB8676A92DCB6F8A3F8F",
    "identity": {
      "ssn": "REDACTED-SSN-A665A45920422F9D417E4867EFDC4FB8A04A1F3FFF1FA07E998E86F7F7A27AE3"
    }
  }
}
```
