# csv

### Purpose

**csv** parses CSV data and sequentially extracts values from a single column every time it is called. For example, let's say that we want to replace a product SKU inside of a JSON blob with new values. The CSV transform allows us to walk through the CSV data and produce a new value with each call. You must select a column to walk through. If there is a problem with the data, or a missing column on the current row, the transform will not proceed. Once the last row is processed the CSV transform will reset to the first value indefinitely.

- If the CSV data contains headers, then set hasHeaders to true.
- If you want to choose a column based on its numerical index, set the column parameter.
- If you'd rather lookup the column based on its header name, set the header parameter. This parameter must be a case sensitive exact match.
- You cannot set both the column and header parameters.

### Usage

```
"type": "csv",
"config": {
    "column": "<integer>",
    "header": "<string>",
    "hasHeaders": "<boolean>"
}
```

| Key                | Description                                                                       |
| ------------------ | --------------------------------------------------------------------------------- |
| **column**         | [optional] column # to extract values from (header must be empty)
| **header**         | [optional] header name to extract values from (column must be empty)
| **hasHeaders**     | [optional] indicates whether the first row contains headers (default: false)

### Example

#### Configuration

```
"type": "csv",
"config": {
    "header": "SKU",
    "hasHeaders": "true"
}
```
