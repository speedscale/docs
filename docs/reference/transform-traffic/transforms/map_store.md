# map_store

### Purpose

**map_store** stores values in a hashmap of key/value pairs. This transform is most commonly used to replace a unique ID with a dynamically generated ID in multiple locations. For example, you may have a transaction ID that you want to randomize but it is used in five more subsequent requests. You would store each unique transaction ID using `map_store` and then retrieve the ID using `map_load`. For this use case you wouldn't use a simple `var_store` because there are multiple transaction IDs and the correct old value must be matched to the correct new value and there may be many.

This transform does not map any changes to the data by itself. You should put this transform at the beginning of a chain of modifications you wish to make to the UID being modified. For example:

extract an HTTP query parameter -> `map_store` -> replace with a random string

The `map_store` transform will automatically the record incoming transaction ID and store the random string that it gets transformed into as an association that be retried with `map_load`. You can make any modification you like downstream of the `map_store` transform.

### Usage

```
"type": "map_store",
"config": {
    "hashKey": "<string>"
}
```

| Key                | Description                                                                                                                                                                                           |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **hashKey**        | [optional] prefix to identify different hash maps. Think of this as a prefix that gets appended to each key entry to prevent collisions.

### Example

#### Configuration

```
"type": "map_store",
"config": {
    "hashKey": "test_data_set_1"
}
```
