# xml_path

### Purpose

**xml_path** extracts a Data element from an XML document using XPath. The input token must be an XML document and the XPath must be valid. Note that we use the excellent [xml_path](https://github.com/antchfx/xmlquery) library but not all XPath combinations are supported. Check the github page to see if a more complicated XPath is supported.

### Usage

```json
"type": "xml_path",
"config": {
    "path": "<XPath>"
}
```

### Example

#### Example Chains

```
req_body() -> xml_path(path="//user/email/text()")
```

This will extract the email text from a user element in the request body XML.

```
res_body() -> xml_path(path="//product[@id='123']/name/text()")
```

This will extract the name of a product with ID '123' from the response body XML.

```
req_body() -> xml_path(path="//items/item[1]/@value") -> constant(new="foo")
```

This will extract the value attribute from the first item element in the XML and replace it with the text "foo".

### Before and After Example

#### Configuration

```json
{
  "type": "xml_path",
  "config": {
    "path": "/feed/entry/epoch/text()"
  }
}
```

#### Before (Original XML Values)

- **Request Body XML (User Data)**:
```xml
<user>
  <email>john.doe@example.com</email>
  <id>123</id>
</user>
```

- **Response Body XML (Product Catalog)**:
```xml
<catalog>
  <product id="123">
    <name>Laptop Computer</name>
    <price>999.99</price>
  </product>
  <product id="456">
    <name>Mouse</name>
    <price>25.00</price>
  </product>
</catalog>
```

- **Feed XML (System Data)**:
```xml
<feed version="1.0" hasPendingRequests="false">
  <status>Good</status>
  <errmsg>OK</errmsg>
  <entry type="data">
    <epoch>1642534200468</epoch>
    <hostname>127.0.0.1</hostname>
    <type>normal</type>
    <items>
      <item name="Item1" datapointid="18480" value="19"/>
      <item name="Item2" datapointid="18481" value="706714"/>
      <item name="Item3" datapointid="18482" value="706713"/>
    </items>
  </entry>
</feed>
```

#### After (XPath Extracted)

- **User Email** (using `//user/email/text()`): `john.doe@example.com`
- **Product Name** (using `//product[@id='123']/name/text()`): `Laptop Computer`
- **Epoch Timestamp** (using `/feed/entry/epoch/text()`): `1642534200468`
- **First Item Value** (using `//items/item[1]/@value`): `19`
