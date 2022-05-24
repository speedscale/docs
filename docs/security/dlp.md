# Data Loss Prevention

Speedscale can be configured to redact sensitive data and personally indentifiable information (PII) from HTTP traffic via it's data loss preventiion (DLP) features.
This redaction happens _before_ the data leaves the customer's network, preventing Speedscale from seeing the data at all.

However, the overall shape or structure of the data is retained in order to facilitate useful testing against systems.

## Enabling DLP

First, to enable DLP on your Speedscale Operator by adding the `WITH_DLP: "true"` line.

```shell
kubectl edit -n speedscale configmap/speedscale-operator
# Add WITH_DLP: "true"
```

Restart your Speedscale Operator, and HTTP traffic sent to Speedscale will be processed for redaction.


## How it works

The redaction feature works by inspecting key/value elements in HTTP metadata and bodies, removing the value from keys considered to be sensitive.

The following types of data are currently inspected:

 * HTTP headers
 * HTTP query paramaters
 * HTTP URIs
 * HTTP forms
 * HTTP JSON bodies

To see the keys that are redacted by default, you may view the `standard` DLP configuration file.

```shell
speedctl get dlp-config standard
```


### Nested data

Sometimes, blocked keys will have values that are complex data types like a JSON array or object.
In these cases, the number of entries and the sub-keys will remain, but each value will be set to `-REDACTED-`.

For example, given this JSON body on input:

```json
{
    "token": [
        {"key": "value"},
        {"key2": "value2"},
        {"key3": "value3"}
    ]
}
```

the following will be sent to Speedscale:

```json
{
    "token": [
        {"key": "-REDACTED-"},
        {"key2": "-REDACTED-"},
        {"key3": "-REDACTED-"}
    ]
}
```

Array elements are also redacted, but the same number of entries will be present to aid in validation.

Input:

```json
{
    "unredacted": "value",
    "country": {
        "list": [
            "US",
            "CA",
            "GB",
            "JP
        ]
    }
}
```

Redacted output:

```json
{
    "unredacted": "value",
    "country": {
        "list": [
            "-REDACTED-",
            "-REDACTED-",
            "-REDACTED-",
            "-REDACTED-"
        ]
    }
}
```

## Customizing your DLP configuraton

Should you wish to customize the keys that are redacted, you can create a custom DLP configuration blocklist.

### Creating the DLP configuration file

The easiest way to create a DLP configuration file will be to copy the `standard` configuration and upload the copy.

```shell
speedctl get dlp-config standard > my-config.json
# edit my-config.json
speedctl put dlp-config my-config.json
```

### Using a custom DLP configuration file

To use a custom DLP configuration file, it must be enabled in the Speedscale Forwarder ConfigMap

Set the `DLP_CONFIG` value to the name of your custom configuration

```shell
kubectl edit -n speedscale configmap/speedscale-forwarder
# Add a line for DLP_CONFIG: my-config
```
