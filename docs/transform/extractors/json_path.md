---
title: Extractors | JSON Path
canonicalUrl: 'https://docs.speedscale.com/reference/transform-traffic/extractors/json_path/'
---

# json_path

### Purpose

**json_path** flattens the current RRPair down to its JSON representation and then extracts data using a JSONPath locator and regular expression filter. You can see examples of RRPairs in JSON format by looking inside of your snapshot raw, action or reaction files. These files are what `speedctl pull snapshot` downloads to your local machine.

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

### Example

### Before and After Example

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

#### Example Chains

```
req_body() -> json_path(path="user.email")
```

This will extract the email field from the user object in the request body.

```
res_body() -> json_path(path="data.items[0].id")
```

This will extract the ID from the first item in a data array from the response body.

#### Before (Original Values)

- **Request Body User Email**: `{"user": {"email": "john.doe@example.com", "id": 123}}`
- **Response Data Array**: `{"data": {"items": [{"id": "item-001", "name": "Product A"}]}}`

#### After (JSON Path Extracted)

- **Request Body User Email**: `john.doe@example.com`
- **Response Data Array (first item ID)**: `item-001`

