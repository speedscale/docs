# tag_session

### Purpose

**tag_session** tells the Speedscale AI model to use the current data token as a session identifier. Session identifiers are used to group request together. For example, there might be a specific client that first authenticates, then requests a list of transactions and then deletes one. That's three separate requests that are part of the same sequence and probably use the same session ID. Once the session ID is tagged it can be used for grouping and filtering in the traffic viewer.

### Usage

```json
"type": "tag_session"
```
