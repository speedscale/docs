# file

### Purpose

**file** reads the entire contents of a file from the local file system or in a user defined document. This transform can only be used on the generator and responder. Typically this extractor is used to pull small amounts of data like a secret or configuration item, or from [user data](../../glossary.md#user-data).

### Usage

```json
"type": "file",
"config": {
    "filename": "<path to file>"
}
```

- **filename** - the fully qualified path to a local file or user data in the Speedscale cloud

### Example

Pull from a file on the local file system:

```json
"type": "file",
"config": {
    "filename": "/var/secrets/myssecret.key"
}
```

The `s3://` prefix indicates that the file is [user data](../../glossary.md#user-data).

```json
"type": "file",
"config": {
    "filename": "s3://values.csv"
}
```
