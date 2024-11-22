# url_decode

### Purpose

**url_decode** transforms a URL encoded string into plain text and back again.

### Usage

```json
"type": "url_decode",
```

### Example

#### Configuration

```json
"type": "url_decode",
```

#### Input Token

```
this%20is%2Fa=string%3Fwith%2Aspecial%25characters
```

#### Transformed Token

```
this is/a=string?with*special%characters
```
