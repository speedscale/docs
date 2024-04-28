# json_path

### Purpose

**json_path** flattens the current RRPair down to its JSON representation and then extracts data using a JSONPath locator and regular expression filter. You can see examples of RRPairs in JSON format by looking inside of your snapshot raw, action or reaction files. These files are what `speedctl pull snapshot` downloads to your local machine.

Certain special cases are supported that allow deep inspection inside of certain data types. For example, you can append `.jwt.claims.<name>` to your JSONPath to look "inside" a JWT. See full example below.

### Usage

```
"type": "json_path",
"config": {
    "path": "<JSON path to data>",
    "regex": "<regular expression to use as a submatch filter>
}
```

- **path** - A properly formatted JSON Path expression with a few extra features.
- **regex** - (optional) a regular expression to be used as a submatch filter on the extracted value

### Example

Extract the Bearer token from the HTTP Authorization Header, then extract the `name` claim from inside the JWT:

```
"type": "json_path",
"config": {
    "path": "http.req.headers.Authorization.0.jwt.claims.name",
    "regex": "^(?i)Bearer (.*)(?-i)"
}
```

