---
sidebar_position: 4
---

# csv

### Purpose

**csv** parses CSV data and sequentially extracts values from a single column every time it is called. For example, let's say that we want to replace a product SKU inside of a JSON blob with new values. The CSV transform allows us to walk through the CSV data and produce a new value with each call. You must select a column to walk through, either by index or header name. If there is a problem with the data, or a missing column on the current row, the transform will not proceed. Once the last row is processed the CSV transform will reset to the first value indefinitely.

- If the CSV data contains headers, then set hasHeader to true.
- If you want to choose a column based on its numerical index, set the index parameter.
- If you'd rather lookup the column based on its header name, set the header parameter. This parameter must be a case sensitive exact match.
- You cannot set both the index and header parameters.

### Usage

```json
"type": "csv",
"config": {
    "index": "<integer>",
    "header": "<string>",
    "hasHeader": "<boolean>"
}
```

| Key           | Description                                                                         |
| ------------- | ----------------------------------------------------------------------------------- |
| **index**     | [optional] zero indexed column number to extract values from (header must be empty) |
| **header**    | [optional] header name to extract values from (index must be empty)                 |
| **hasHeader** | [optional] indicates whether the first row contains headers (default: false)        |

### Example

Let's use the following CSV file as an example:

```csv
firstName,lastName
John,Doe
Jane,Doe
Wanda,Brown
```

The first row of this CSV file is dedicated to headers which identify the data so we can reference those directly.

```json
"type": "csv",
"config": {
    "hasHeader": "true",
    "header": "firstName"
}
```

Use the `index` config value to reference the first field of the CSV data when there are no headers present. Indexes start at 0.

```json
"type": "csv",
"config": {
    "index": "0"
}
```
