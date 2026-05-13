---
description: "Read local or user-defined files with Speedscale to extract small data items like secrets or configurations for your API testing and mocking needs"
sidebar_position: 2
---

# file

### Purpose

**file** reads the entire contents of a file from the local file system or in a user defined document. This transform can only be used on the generator and responder. Typically this extractor is used to pull small amounts of data like a secret or configuration item, or from [user data](../../../reference/glossary.md#user-data).

### Usage

```json
"type": "file",
"config": {
    "filename": "<path to file>"
}
```

- **filename** - the location of the file. Speedscale recognizes three forms:
  - an absolute path on the local file system (e.g. `/var/secrets/myssecret.key`)
  - `s3://<name>` to pull from [user data](../../../reference/glossary.md#user-data) in the Speedscale cloud
  - `dataframe:<key>` — a **portable** reference that resolves to user data in the cloud and to a local workspace file under `proxymock/dataframes/` when proxymock runs the replay. Use this form whenever you want the same transform to work in both environments without editing the filename.

### Examples

Pull from a file on the local file system:

```json
"type": "file",
"config": {
    "filename": "/var/secrets/myssecret.key"
}
```

Pull from user data in the Speedscale cloud. The `s3://` prefix indicates that the file is [user data](../../../reference/glossary.md#user-data).

```json
"type": "file",
"config": {
    "filename": "s3://values.csv"
}
```

Pull from a portable dataframe reference. The `dataframe:` prefix lets the same blueprint or transform work in both local proxymock replays and cloud replays — proxymock looks under `proxymock/dataframes/<id>/<file>` and the cloud resolves the same key under user data.

```json
"type": "file",
"config": {
    "filename": "dataframe:my-dataframe__values.csv"
}
```

The `__` separator stands in for a path separator in the underlying workspace layout (e.g. `my-dataframe/values.csv`). This is what `proxymock cloud push snapshot` writes when it migrates absolute filenames to the portable form, and what `proxymock automation` workflows emit out of the box.
