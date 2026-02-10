# split

### Purpose

**split** chops a string into pieces based on a list of substring separators. This transform is most commonly used to split comma or pipe delimited strings.

### Usage

```json
"type": "split",
"config": {
    "index": "zero indexed integer",
    "separator": "comma separated list"
}
```

| Key                | Description                                                                                                                                                                                           |
| ------------------ | ------------------------------------------------------------------------------------------------------ |
| **index**          | zero indexed string segment to be extracted
| **separator**      | (optional) a comma delimited list of substrings to use as separators. Leave empty to split by comma.

### Example

### Before and After Example

#### Configuration

```json
{
   "type": "split",
   "config": {
       "index": 1,
       "separator": "|,."
   }
}
```

#### Example Chains

```
req_body() -> json_path(path="tags") -> split(index=0, separator=",")
```

This will extract the tags field from the request body and get the first tag from a comma-separated list.

```
http_req_header(header="Accept-Language") -> split(index=0, separator=",;")
```

This will extract the Accept-Language header and get the primary language preference.

```
res_body() -> json_path(path="path") -> split(index=2, separator="/")
```

This will extract a path field from the response body and get the third segment from a forward-slash separated path.

#### Before (Original Values)

- **Tags List**: `javascript,react,frontend,typescript`
- **Accept-Language**: `en-US,en;q=0.9,fr;q=0.8`
- **File Path**: `/api/v1/users/profile`
- **Pipe Delimited**: `string.splitting|is|fun`

#### After (Split Transformed)

- **Tags List (first tag)**: `javascript`
- **Accept-Language (primary language)**: `en-US`
- **File Path (third segment)**: `users`
- **Pipe Delimited (second segment)**: `splitting`

