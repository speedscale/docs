# map_load

### Purpose

**map_load** retrieves values stored using [map_store](map_store.md). This transform is most commonly used to replace a unique ID with a dynamically generated ID in multiple locations. For example, you may have a transaction ID that you want to randomize but it is used in five more subsequent requests. You would store each unique transaction ID using `map_store` and then retrieve the ID using `map_load`. For this use case you wouldn't use a simple `var_store` because there are multiple transaction IDs and the correct old value must be matched to the correct new value and there may be many.

If no matching value is found in the specified hash map then the value is not modified.

### Usage

```
"type": "map_load",
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
"type": "map_load",
"config": {
    "hashKey": "test_data_set_1"
}
```
