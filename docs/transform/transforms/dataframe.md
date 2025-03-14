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
my_dataframe = file("s3://dataframe.csv) -> csv_dataframe("Name")

Transforms:
dataframe_lookup("my_dataframe", "Bob Brown", "Email") -> "bob.brown@example.com"
```

We may want to use `ID` as our primary key in which case we'd get something like

```
Initial variable setup:
my_dataframe = file("s3://dataframe.csv) -> csv_dataframe("ID")

Transforms:
dataframe_lookup("my_dataframe", "12345", "Email") -> "john.doe@example.com"
```

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

Note that the `key` or `field` values can contain variables using the [embedded syntax](../../concepts/transforms.md#embedded) so the key can be used dynamically for eg.

```
# Extract the customer name from a json response body
res_body -> json_path(".customer.name") -> json_store("name")

# Then modify a subsequent request using that variable
req_body -> json_path(".customer.id") -> dataframe_lookup("my_dataframe", "${{name}}", "ID")
```
