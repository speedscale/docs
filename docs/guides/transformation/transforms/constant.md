---
description: "Learn how to implement constant transformations with Speedscale to modify traffic patterns and enhance testing environments. This documentation provides a comprehensive guide to configuring and utilizing constant transformations effectively."
sidebar_position: 3
---

# constant

### Purpose

**constant** replaces the current token with a specified string

### Usage

```json
"type": "constant",
"config": {
    "new": "<string>"
}
```

- **new** - string to insert into token

### Example

### Before and After Example

#### Configuration

```json
{
    "type": "constant",
    "config": {
        "new": "these are not the droids you're looking for"
    }
}
```

#### Example Chains

```
req_body() -> json_path(path="environment") -> constant(new="production")
```

This will extract the environment field and replace it with the constant value "production".

```
http_req_header(header="User-Agent") -> constant(new="SpeedscaleBot/1.0")
```

This will replace the User-Agent header with a constant value.


#### Before (Original Values)

- **Environment**: `DEVELOPMENT`
- **User Agent**: `MOZILLA/5.0 (WINDOWS NT 10.0; WIN64; X64) APPLEWEBKIT/537.36`
- **API Version**: `V2.1.BETA`
- **Test Data**: `R2D2`

#### After (Constant Transformed Values)

- **Environment**: `PRODUCTION`
- **User Agent**: `SPEEDSCALEBOT/1.0`
- **API Version**: `V3.0.STABLE`
- **Test Data**: `THESE ARE NOT THE DROIDS YOU'RE LOOKING FOR`
