---
sidebar_position: 19
---

# replace

### Purpose

**replace** finds and replaces a substring. The incoming string will be passed through a "replace all" where the number of replacements can be limited (default is no limit).

### Usage

```json
"type": "replace",
"config": {
    "old": "<string>",
    "new": "<string>",
    "count": "<int>"
}
```

| Key         | Description |                                                                                                                                                                                          |
| ----------- | ------------|
| **old**     | Old value to be replaced.
| **new**     | New value to insert in place of old.
| **count**   | (optional) Maximum number of replacements to make. Defaults to no limit.

### Example

### Before and After Example

#### Configuration

```json
{
   "type": "replace",
   "config": {
       "old": "production",
       "new": "staging"
   }
}
```

#### Example Chains

```
req_body() -> json_path(path="environment") -> replace(old="production", new="staging")
```

This will extract the environment field from the request body and replace "production" with "staging".

```
http_req_header(header="Host") -> replace(old="api.example.com", new="api-test.example.com")
```

This will extract the Host header value and replace the production domain with the test domain.

```
res_body() -> json_path(path="database.connectionString") -> replace(old="prod-db", new="test-db", count=1)
```

This will extract the database connection string from the response and replace only the first occurrence of "prod-db" with "test-db".
