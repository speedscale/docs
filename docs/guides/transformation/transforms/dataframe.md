---
description: "Explore how to utilize Dataframes in Speedscale for efficient data retrieval and dynamic key usage in your API testing and traffic replay scenarios"
sidebar_position: 6
---

# Dataframe

### Purpose

A Dataframe is a lookup table like a spreadsheet with named columns and a primary key commonly used in data science. This is useful for retrieving values associated with the primary key like you would in a spreadsheet or database for eg.

| Name          | Email                     | ID    |
| ------------- | ------------------------- | ----- |
| John Doe      | john.doe@example.com      | 12345 |
| Jane Smith    | jane.smith@example.com    | 67890 |
| Alice Johnson | alice.johnson@example.com | 24680 |
| Bob Brown     | bob.brown@example.com     | 13579 |

So if we use `Name` as our primary key then we would do something like

```
Initial variable setup:
my_dataframe = file("dataframe:people.csv") -> csv_dataframe("Name")

Transforms:
dataframe_lookup("my_dataframe", "Bob Brown", "Email") -> "bob.brown@example.com"
```

We may want to use `ID` as our primary key in which case we'd get something like

```
Initial variable setup:
my_dataframe = file("dataframe:people.csv") -> csv_dataframe("ID")

Transforms:
dataframe_lookup("my_dataframe", "12345", "Email") -> "john.doe@example.com"
```

The `dataframe:` prefix is a **portable** filename scheme: proxymock resolves it to a local file at `proxymock/dataframes/people.csv`, and the Speedscale cloud resolves the same key to [user data](../../../reference/glossary.md#user-data) called `people.csv`. For files inside a subdirectory, encode the path separator as `__` (e.g. `dataframe:lookup__people.csv` for `proxymock/dataframes/lookup/people.csv`). You can also use a plain `s3://people.csv` for cloud-only use, or an absolute local path for local-only use — see the [file extractor](../extractors/file.md) for the full description of all three forms.

### Usage

Variable

```json
{
  "type": "csv_dataframe",
  "primary_key": "a field that's in the header row of your csv"
}
```

Transform lookup

```json
{
  "type": "dataframe_lookup",
  "dataframe_name": "name of the variable previously setup",
  "key": "primary key value",
  "field": "field to be returned"
}
```

Note that the `key` or `field` values can contain variables using the [embedded syntax](../embedded-syntax.md) so the key can be used dynamically for eg.

```
# Extract the customer name from a json response body
res_body -> json_path(".customer.name") -> json_store("name")

# Then modify a subsequent request using that variable
req_body -> json_path(".customer.id") -> dataframe_lookup("my_dataframe", "${{name}}", "ID")
```

The same lookup is also available inline as an [embedded keyword](../embedded-syntax.md#dataframe-lookup), so you can reference a dataframe cell directly from any transform field — for example inside a `constant`:

```
${{dataframe:my_dataframe:${{name}}:Email}}
```
