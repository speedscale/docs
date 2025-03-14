# url_encode

### Purpose

**url_encode** transforms a plain text string into a URL encoded string and back again.

### Usage

```json
"type": "url_encode",
```

### Example

#### Configuration

```json
"type": "url_encode",
```

#### Input Token

```
this is/a=string?with*special%characters
```

#### Transformed Token

```
this%20is%2Fa=string%3Fwith%2Aspecial%25characters
```
