# json_path

**json_path** extracts an element from a JSON document using JSONPath. The input token must be a JSON document and the JSONPath must be valid. Note that we use the excellent [gjson](https://github.com/tidwall/gjson) library but not all JSONPath combinations are supported. Check the github page to see if a more complicated JSONPath is supported.

### Usage

```
"type": "json_path",
"config": {
    "path": "<JSONPath>"
}
```

### Example

#### Configuration

```
"type": "json_path",
"config": {
    "path": "client_secret"
}
```

#### Input Token

```
{
    "client_id": "srn:dev:iam:na:9999999999:sa:policy-api",
    "client_secret": "c2783a54ad41c87a3ca6bed685b285c98957e408fF7cdf7FS5c52F376ce3897d",
    "tenant_id": "9999999999",
    "issuer": "http://music-testhost-9543:multiverse ed.shearan"
}
```

#### Transformed Token

`c2783a54ad41c87a3ca6bed685b285c98957e408fF7cdf7FS5c52F376ce3897d`
