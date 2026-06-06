---
description: "Extract an XML value with XPath using the xml_path transform in Speedscale, let downstream transforms rewrite it, then re-insert the new value back into the same node — text, attribute, or element."
sidebar_position: 34
---

# xml_path

The `xml_path` transform extracts a value from an XML document using an XPath expression and acts as a window onto that value for the rest of the chain. Downstream transforms see only the extracted text; when they're done, `xml_path` writes the new value back into the same node of the original document.

The same chain shape handles text nodes, attribute values, and full element bodies — the node type at the XPath target determines how the re-insertion is performed.

- **Transform type name (config/API):** `xml_path`
- **Shorthand format:** `xml_path(path=...)`
- **Engine:** [`xmlquery`](https://github.com/antchfx/xmlquery) — supports XPath 1.0 plus several XPath 2.0 functions. See [XPath syntax](https://en.wikipedia.org/wiki/XPath) for the spec.

## Quick Start

Extract the text inside an element:

```json
"type": "xml_path",
"config": {
    "path": "/feed/entry/epoch/text()"
}
```

Extract an attribute value:

```json
"type": "xml_path",
"config": {
    "path": "//items/item[1]/@value"
}
```

## How It Works

The transform runs in two phases as a bookend around the rest of the chain.

1. **First phase** — parse the XML document, run the XPath query, and return the inner text of the **first** matched node. The original document is remembered for re-insertion.
2. **Second phase** — re-parse the original document, locate the same node, and write the downstream chain's output into that node. The re-serialized document is the chain's output.

```
input:  <feed><entry><epoch>1642534200468</epoch></entry></feed>
        └─ 1st phase, path=/feed/entry/epoch/text():
              extracted = "1642534200468"
        └─ downstream produces "new-epoch"
        └─ 2nd phase: writes "new-epoch" into the text node
output: <feed><entry><epoch>new-epoch</epoch></entry></feed>
```

### Node Type Handling

The XPath result's node type determines how the new value is written:

| Node type at the XPath result | Re-insertion behavior |
|---|---|
| Text / CharData / Comment | The node's text content is replaced with the new value verbatim. |
| Attribute | The attribute's value on the parent element is replaced. |
| Element | If the new value looks like XML (contains `<` and `>`), it is parsed and its children replace the element's children. Otherwise it is treated as text content. |

The element-fragment parsing lets a downstream transform return either plain text or a sub-tree, and the chain produces a valid document either way. If parsing the fragment fails, the transform falls back to writing it as text.

### Multiple Matches

If the XPath query returns multiple nodes, only the **first** is used — both for extraction and for re-insertion. To rewrite every match, narrow the XPath until it points at a single node and run separate chains per match.

### Missing Matches

If the XPath query matches nothing in the first phase, the transform returns the original token with a "no data element returned by XPath" error. The second phase, run on the same instance, sees no matches and returns the original document unchanged.

## Configuration

```json
"type": "xml_path",
"config": {
    "path": "<XPath expression>"
}
```

| Parameter | Required | Default | Description |
|---|---|---|---|
| `path` | **Yes** | — | XPath expression. Missing config fails chain initialization. Invalid XPath syntax fails per-token. |

`path` supports `${{...}}` variable substitution, resolved at runtime against the variable cache. Both phases re-resolve the path, so a `${{var:...}}` reference always reflects the current cache.

## Examples

### Example 1 — Replace a text node

```
res_body() → xml_path(path="/feed/entry/epoch/text()") → date(layout=epoch_ms)
```

- Input: `<feed><entry><epoch>1642534200468</epoch></entry></feed>`
- `xml_path` extracts `1642534200468`.
- `date` shifts the epoch relative to replay time.
- `xml_path` writes the new epoch back into the same text node.

### Example 2 — Replace an attribute

```
req_body() → xml_path(path="//items/item[1]/@value") → constant(value="999")
```

- Input: `<items><item value="19"/><item value="20"/></items>`
- Output: `<items><item value="999"></item><item value="20"></item></items>`

Note: the serializer expands self-closing tags into full open/close tags. The document is semantically identical, but the bytes change.

### Example 3 — Replace an element with raw XML

```
res_body() → xml_path(path="//user") → constant(value="<name>Jane</name><id>42</id>")
```

- Input: `<root><user><name>old</name><id>1</id></user></root>`
- Output: `<root><user><name>Jane</name><id>42</id></user></root>`

Because the new value contains XML markup, it is parsed and its children become the element's children.

### Example 4 — Predicate to select a specific node

```
req_body() → xml_path(path="//product[@id='123']/name/text()") → constant(value="Updated Name")
```

- Input:
  ```xml
  <catalog>
    <product id="123"><name>Laptop</name></product>
    <product id="456"><name>Mouse</name></product>
  </catalog>
  ```
- Output: the `name` text under the product with `id='123'` becomes `Updated Name`. The other product is untouched.

### Example 5 — Combine with `smart_replace`

```
smart_replace() → res_body() → xml_path(path="//session/id/text()") → rand_string(pattern="sess_[a-z0-9]{16}")
```

`xml_path` extracts the session id; `rand_string` produces a replacement; `smart_replace` registers the mapping so the same id is rewritten everywhere it appears in the RRPair — headers, body, URL — even across XML/JSON boundaries. See [`smart_replace`](./smart_replace.md).

## Common Misconceptions

1. **"It rewrites every node matching the XPath."**
   No. Only the first matched node is touched. Narrow the XPath or use a predicate to target the one you need.

2. **"Output bytes are identical to input except for the replaced value."**
   No. The document is re-serialized, which may normalize whitespace, expand self-closing tags (`<a/>` → `<a></a>`), and re-quote attributes. The structure and semantics are preserved, not the exact bytes.

3. **"The new value is always written as text."**
   For text nodes and attributes, yes. For element nodes, an XML-shaped value is parsed and inserted as a sub-tree. If you want literal `<` and `>` characters inside an element, escape them upstream (e.g. with `&lt;` / `&gt;`).

4. **"Full XPath 2.0 / 3.0 is supported."**
   The engine is XPath 1.0 with a subset of 2.0 functions. Complex 2.0/3.0 constructs (e.g. higher-order functions, regex match groups) are not available.

5. **"Element selection without `/text()` returns just the inner text."**
   It returns the *inner text* concatenation of all descendant text for extraction, but the re-insertion goes to the element node, not a text child. If you want to *only* operate on the immediate text content, use `/text()`.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Chain init: `missing parameter path` | `path` not set | Add `"path": "..."` |
| Runtime error parsing XML | Input isn't well-formed XML | Verify the body is XML, check encoding and namespaces |
| Error: `no data element returned by XPath` | The XPath didn't match | Test the XPath against a sample document |
| Self-closing tags become full tags | Re-serialization expands `<a/>` to `<a></a>` | This is expected; the document is still semantically equivalent |
| New value lands as text but should be a sub-tree | The new value doesn't start with `<` and end with `>` | Ensure the upstream transform produces XML-shaped output |
| `unsupported node type, contact Speedscale support` | The XPath landed on a node type the transform doesn't know how to write to | Adjust the XPath to target a text node, attribute, or element |
| Wrong node modified | XPath matches multiple nodes; the first is used | Use a predicate (`[@id='...']`, `[1]`, `[position()=N]`) to disambiguate |

## Related Transforms

- [`json_path`](./json_path.md) — JSON equivalent.
- [`json_selector`](./json_selector.md) — for "find by key/value somewhere in the document" semantics.
- [`regex`](./regex.md) — for non-structured extraction when XPath isn't ergonomic.
- [`smart_replace`](./smart_replace.md) — propagate a rewritten value across the entire RRPair.

## Advanced Notes

- The XML document is parsed twice per chain (once per phase). For very large bodies in tight loops this matters, but it keeps the re-insertion working off a clean copy.
- The transform does not require recorded response data.
- The serializer emits the document with the standard `xmlquery` formatting. Downstream services should parse XML rather than byte-match the body.
