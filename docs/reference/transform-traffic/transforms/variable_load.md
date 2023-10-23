# var_load

### Purpose

**var_load** replaces the current token with the value stored in the variable. The variable store is persistent across requests.

### Usage

```
"type": "var_load",
"config": {
    "name": "<string>"
}
```

- **name** - name of variable to pull value from

### Example

#### Configuration

```
"type": "var_load",
"config": {
    "name": "my_variable"
}
```

#### Input Token

`R2D2`

#### Transformed Token

`value_of_my_variable`
