# File

### Purpose

**file** reads the entire contents of a file from the local filesystem. This transform can only be used on the generator and responder. Typically, this extractor is used to pull small amounts of data like a secret or configuration item.

### Usage

```
"type": "file",
"config": {
    "filename": "<path to file>"
}
```

**filename** - the fully qualified path to the desired file

### Example

```
"type": "file",
"config": {
    "filename": "/var/secrets/myssecret.key"
}
```
