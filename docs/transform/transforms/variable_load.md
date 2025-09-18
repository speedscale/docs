# var_load

### Purpose

**var_load** replaces the current token with the value stored in the variable. The variable store is persistent across requests.

### Usage

```json
"type": "var_load",
"config": {
    "name": "<string>"
}
```

- **name** - name of variable to pull value from

### Example

#### Configuration

```json
"type": "var_load",
"config": {
    "name": "my_variable"
}
```