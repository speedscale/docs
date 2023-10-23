# var_store

### Purpose

**var_store** stores the current token in the variable store. The variable store is persistent across requests.

### Usage

```
"type": "var_store",
"config": {
    "name": "<string>"
}
```

- **name** - name of variable to insert token into

### Example

#### Configuration

```
"type": "var_store",
"config": {
    "name": "my_variable"
}
```

#### Input Token

`R2D2`

#### Transformed Token

`R2D2`

(token is not changed, but value is stored in variable `my_variable`)
