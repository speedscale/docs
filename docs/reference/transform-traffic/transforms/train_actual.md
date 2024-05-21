# train_actual

### Purpose

**train_actual** tells the Speedscale AI to replace a value in your original traffic with a new value seen when the traffic is replaced. For example, let's say we have a constantly changing request ID returned by the server. That request ID is different during each replay but it still maps to the responses that were originally recorded. Speedscale can be taught to understand the relationship between all the requests and responses using this transform. Once you "tag" a piece of data using this transform, all instances of that tagged data sent by the Speedscale Load Generator will be replaced with the value returned during the server at replay time.

In all future transactions, Speedscale will replace the recorded value with the replay value. You do not need to identify each instance. Speedscale will uniquely identify each instance and will not get confused by multiple request IDs.

### Usage

```json
"type": "train_actual",
"config": {
    "overwrite": "<boolean>",
}
```

- *** overwrite *** - boolean value indicating whether a new value should be trained each time this transform is run. In most situations this should be left as the default value of false.

### Example

#### Configuration

```json
"type": "train_actual",
"config": {
    "overwrite": "true",
}
```
