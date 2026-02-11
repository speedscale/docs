---
sidebar_position: 8
---

# db_add_row

## Purpose

The `db_add_row` transform adds new rows to database result sets from PostgreSQL and MySQL responses. This is useful for injecting test data, simulating additional database records, or modifying result sets during replay scenarios.

## Usage

```json
{
  "type": "db_add_row",
  "position": "append",
  "index": 0
}
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `position` | string | No | Where to insert the new row: `"append"` (default), `"prepend"`, or a numeric index (e.g., `"1"`) |
| `index` | integer | No | For MySQL only: which resultset to modify. If not specified, applies to all resultsets |

## Supported Database Protocols

- **PostgreSQL**: Both simple query (`QueryResponse`) and extended query (`ExecuteResponse`) protocols
- **MySQL**: Both text protocol (`MySQLTextResultsets`) and binary protocol (`MySQLBinaryResultsets`)

## Example

### Basic Configuration

Append a new row to the result set:

```json
{
  "type": "db_add_row"
}
```

### Prepend a Row

Insert a new row at the beginning:

```json
{
  "type": "db_add_row",
  "position": "prepend"
}
```

### Insert at Specific Index

Insert a row at position 2:

```json
{
  "type": "db_add_row",
  "position": "2"
}
```

### MySQL: Target Specific Resultset

For MySQL responses with multiple resultsets, modify only the first one:

```json
{
  "type": "db_add_row",
  "index": 0,
  "position": "append"
}
```

## Example Chains

The `db_add_row` transform is typically used with response body accessors:

```
res_body() -> db_add_row()
```

With variable substitution:

```
res_body() -> db_add_row() -> set_variable(name="modified_results")
```

Target specific resultset in MySQL:

```
res_body() -> db_add_row(index=0, position="prepend")
```

## Before and After Example

### PostgreSQL Execute Response

#### Before (Original Data)

```json
{
  "messages": [
    {
      "dataRow": {
        "values": [
          {"asString": "user-123"},
          {"asString": "John"},
          {"asString": "Doe"},
          {"asString": "john@example.com"}
        ]
      }
    }
  ]
}
```

#### Configuration

```json
{
  "type": "db_add_row",
  "position": "append"
}
```

#### Insert Values

```
new-user-456,Jane,Smith,jane@example.com
```

#### After (Transformed Data)

```json
{
  "messages": [
    {
      "dataRow": {
        "values": [
          {"asString": "user-123"},
          {"asString": "John"},
          {"asString": "Doe"},
          {"asString": "john@example.com"}
        ]
      }
    },
    {
      "dataRow": {
        "values": [
          {"asString": "new-user-456"},
          {"asString": "Jane"},
          {"asString": "Smith"},
          {"asString": "jane@example.com"}
        ]
      }
    }
  ]
}
```

### MySQL Text Response

#### Before (Original Data)

```json
{
  "resultsets": [
    {
      "columns": [
        {"name": "id", "type": "MYSQL_FIELD_TYPE_LONG"},
        {"name": "name", "type": "MYSQL_FIELD_TYPE_VARCHAR"}
      ],
      "rows": [
        {
          "fields": [
            {"asString": "1"},
            {"asString": "Product A"}
          ]
        }
      ]
    }
  ]
}
```

#### Configuration

```json
{
  "type": "db_add_row",
  "position": "prepend"
}
```

#### Insert Values

```
2,Product B
```

#### After (Transformed Data)

```json
{
  "resultsets": [
    {
      "columns": [
        {"name": "id", "type": "MYSQL_FIELD_TYPE_LONG"},
        {"name": "name", "type": "MYSQL_FIELD_TYPE_VARCHAR"}
      ],
      "rows": [
        {
          "fields": [
            {"asString": "2"},
            {"asString": "Product B"}
          ]
        },
        {
          "fields": [
            {"asString": "1"},
            {"asString": "Product A"}
          ]
        }
      ]
    }
  ]
}
```

## Data Type Handling

The transform automatically handles various data types:

### PostgreSQL

- **String values**: Set as `asString` in Value messages
- **Binary values**: Set as `asBytes` when template row uses bytes
- **NULL values**: Created as empty Value objects

### MySQL

- **String values**: Set as `asString` in MySQLTypedValue messages
- **Numeric types**: Integers, floats, doubles (as strings for simplicity)
- **Temporal types**: Timestamps, dates, times
- **NULL values**: Field marked with `null: true`
- **Type preservation**: Field types copied from existing rows

## Handling Missing or Extra Values

- **Fewer values than columns**: Missing columns are set to NULL
- **More values than columns**: Extra values are truncated to match column count
- **No existing rows**: Uses provided values to determine column count

## Variable Substitution

The transform supports variable substitution in the inserted values:

```
user-${{user_id}},${{first_name}},${{last_name}},${{email}}
```

Variables are resolved before row insertion using the current variable cache.

## Notes

- Values should be provided as comma-separated strings
- Column count is determined from existing rows or defaults to the number of provided values
- For DescribeResponse (PostgreSQL), new rows can be added but they contain metadata, not data
- The transform preserves the structure and format of the original response

## Error Handling

The transform returns errors for:
- Invalid position values (defaults to append)
- Unable to detect database technology from JSON structure
- Failed JSON marshaling/unmarshaling
- Missing source JSON (Mutate not called)
