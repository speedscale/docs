# xml\_path

**xml\_path** extracts a Data element from an XML document using XPath. The input token must be an XML document and the XPath must be valid. Note that we use the excellent [xml\_path](https://github.com/antchfx/xmlquery) library but not all XPath combinations are supported. Check the github page to see if a more complicated XPath is supported.

### Usage

```
"type": "xml_path",
"config": {
    "path": "<XPath>"
}
```

### Example

#### Configuration

```
"type": "xml_path",
"config": {
    "path": "/feed/entry/epoch/text()"
}
```

#### Input Token

```
<feed  version="1.0" hasPendingRequests="false" >
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

#### Transformed Token

`1642534200468`
