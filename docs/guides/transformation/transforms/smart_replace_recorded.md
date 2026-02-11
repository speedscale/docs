---
sidebar_position: 25
---

# smart_replace_recorded

### Purpose

**smart_replace_recorded** identifies values in your original traffic for smart replacement whenever they are encountered. For example, let's say we have a constantly changing request ID returned by the server. That request ID is different during each replay but it still maps to the responses that were originally recorded. Speedscale can be taught to understand the relationship between all the requests and responses using this transform. Once you "tag" a piece of data using this transform, all instances of that tagged data sent by the Speedscale Load Generator will be replaced with the value returned during the server at replay time.

In all future transactions, Speedscale will replace the recorded value with the replay value. You do not need to identify each instance. Speedscale will uniquely identify each instance and will not get confused by multiple request IDs.

### Usage

```json
"type": "smart_replace_recorded",
"config": {
    "overwrite": "<boolean>",
}
```

- **overwrite** - If false, the key=value mapping will be made permanently. If true, the key=value mapping will be rewritten each time `smart_replace_recorded` is called. This is helpful if you want to rotate values through a CSV continuously. For most use cases, overwrite=false (the default) is desired.

### Example
<iframe src="https://player.vimeo.com/video/1117518907?badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479" width="640" height="582" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>
<p><a href="https://vimeo.com/986454551">smart_replace_recorded example</a> from <a href="https://vimeo.com/speedscale">Speedscale</a> on <a href="https://vimeo.com">Vimeo</a>.</p>


#### Configuration

```json
"type": "smart_replace_recorded",
"config": {
    "overwrite": "true",
}
```
