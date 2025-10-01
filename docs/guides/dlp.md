---
sidebar_position: 100
title: Redacting PII (DLP)
---

Speedscale can be configured to redact personally identifiable (PII) or other sensitive information (PII) from
traffic via it's data loss prevention (DLP) features. This redaction happens _before_ data leaves your
network, preventing the Speedscale service from seeing the data at all. However, the overall shape or structure of the
data is retained in order to facilitate useful testing against systems.

<iframe src="https://player.vimeo.com/video/1117962434?badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479" width="640" height="582" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>

:::caution Note
If you find that the DLP configuration is inadequate for your needs, get in touch with us
on the [community Slack](https://slack.speedscale.com) to discuss your specific requirements.
:::

## Prerequisites

To follow the guide below, you will need:

1. [speedctl](/setup/install/cli)
2. An [installed Speedscale Operator](../quick-start.md).
3. An [active sidecar capturing traffic](/setup/sidecar/install.md)


## How It Works

Speedscale's DLP engine works by inspecting key/value elements in recorded traffic and replacing keys
containing data considered to be sensitive with a redacted string form of their values. This redacted form
string is the result of concatenating a prefix string `REDACTED-` with the hexadecimal string value of the
original value's SHA-256 hash. For example:

- A string value `example` would be redacted and replaced with the string
  `REDACTED-50d858e0985ecc7f60418aaf0cc5ab587f42c2570a884095a9e8ccacd0f6545c`
- A number value `42` would be redacted and replaced with the string
  `REDACTED-73475cb40a568e8da8a045ced110137e159f890ac4da883b6b17dc651b3a8049`
- A boolean value `false` would be redacted and replaced with the string
  `REDACTED-fcbcf165908dd18a9e49f7ff27810176db8e9f63b4352213741664245224f8aa`

The built-in standard behavior operates on any traffic, inspecting and redacting data in the
following locations:

- HTTP headers
- HTTP query parameters
- HTTP URIs
- HTTP forms
- HTTP JSON bodies
- Postgres bodies

To see the keys that are redacted by default, you may view the Speedscale-maintained `standard` DLP
configuration in the main [UI](https://app.speedscale.com/dlpConfig/standard). Or via the command line using
`speedctl`:

```shell
speedctl get dlp-config standard
```

## Automatic Data Pattern Detection

In addition to key-based redaction rules, Speedscale's DLP engine automatically identifies and can redact common sensitive data patterns regardless of their field names. The engine recognizes the following data types:

### Personal Information
- **Email addresses** - Standard email format validation
- **Social Security Numbers (SSN)** - US SSN format patterns
- **Phone numbers** - E.164 international phone number format

### Financial Data
- **Credit card numbers** - Major credit card number patterns

### Technical Identifiers
- **UUIDs** - Various UUID formats including:
  - UUID v3 (MD5-based)
  - UUID v4 (random)
  - UUID v5 (SHA1-based)
  - RFC4122 compliant formats
- **Hash values** - Common cryptographic hash formats:
  - MD4, MD5
  - SHA-256, SHA-384, SHA-512
  - RIPEMD-128
  - TIGER-128, TIGER-160, TIGER-192
- **JWT tokens** - JSON Web Token format
- **Trace and Span IDs** - Distributed tracing identifiers

### Network and Location Data
- **IP addresses** - IPv4 and IPv6 addresses
- **URLs and URIs** - Web addresses and resource identifiers
- **Geographic coordinates** - Latitude and longitude values

### Database Content
- **SQL statements** - SQL query patterns
- **SQL statement names** - Prepared statement identifiers
- **SQL portal names** - Database connection identifiers

### Temporal Data
- **Date/time values** - Various datetime format patterns

These automatic patterns work alongside your custom redaction rules, providing comprehensive coverage for sensitive data that might be missed by field-name-based rules alone.

:::tip
Including the SHA-256 hash of a value in its final redacted form, you can identify differences in datasets
without needing any access to the original unredacted data. This could be very useful if you need to validate
data equality when performing traffic replays.
:::


## Enabling

DLP features are **NOT** enabled by default and must be turned on and configured to match your specific needs.
Use the following `speedctl` command, which will apply configuration to your operator installation that enable
DLP features:

```shell
speedctl infra dlp enable
```

The above command is interactive and will present you with the option to select a specific installation
connected to your Speedscale account.

### Enabling at Install Time

If you are installing the Speedscale operator via the Helm chart, it is possible to enable DLP at install
time. When running `helm install`, use the following additional argument to the command:

```
--set dlp.enabled=true
```

Alternatively, edit the helm chart `values.yaml` file to set the following:

```yaml
dlp:
    enabled: true

    # Optionally: specify the DLP configuration to use
    config: "standard"
```


## Configuring

DLP configurations consist of a set of redaction rules or instructions that will be applied to specific fields
or attributes of recorded traffic. Each configuration follows the same structure using the [transform rules format](../concepts/transforms.md)

```json
{
  "id": "my-custom-dlp-config",
  "transforms": [
    {
      "filters": {
        "filters": [
          {
            "operator": "CONTAINS",
            "detectedLocation": "login"
          }
        ]
      },
      "extractor": {
        "type": "json_path",
        "config": {
          "path": "http.req.http.headers[\"Authorization\"][0].jwt.claims.name"
        }
      },
      "transforms": [
        {
          "type": "tag_session"
        }
      ],
      "tags": {
        "source": "dashboard"
      }
    }
  ]
}
```


To create a new DLP configuration, navigate to the `DLP Rules` section listed on the UI sidebar (shown below).

![DLP](./dlp/dlp-sidebar.png)

From this screen, you will be presented with a simple editor that allows you to view existing configurations,
make copies, or create new ones.

![DLP Config Editor](./dlp/dlp-config.png)

Alternatively, if you prefer to create or edit DLP configuration in your own editor, you can use `speedctl` to
manage obtaining and uploading them:

```shell
# download
speedctl get dlp-config my-config > my-config.json

# upload
speedctl put dlp-config my-config.json
```


### Configuration Caveats

Some redaction behavior for HTTP could differ from your expectations, particularly with JSON data, where
blocked keys will have values that are complex data types like a JSON array or object. In these cases, the
number of entries and the sub-keys will remain, but each value will be set to its redacted string form.

For example, with a nested JSON object:

```json
{
  "token": [
    {"key": "value"},
    {"key2": "value2"},
    {"key3": "value3"}
  ]
}
```

A configuration setting to redact `token` will result in the following:

```json
{
    "token": [
        {"key": "REDACTED-cd42404d52ad55ccfa9aca4adc828aa5800ad9d385a0671fbcbf724118320619"},
        {"key2": "REDACTED-0537d481f73a757334328052da3af9626ced97028e20b849f6115c22cd765197"},
        {"key3": "REDACTED-89dc6ae7f06a9f46b565af03eab0ece0bf6024d3659b7e3a1d03573cfeb0b59d"}
    ]
}
```

Similarly, an array or list value behaves the same way:

```json
{
  "unredacted": "value",
  "country": {
    "list": [
      "US",
      "CA",
      "GB",
      "JP"
    ]
  }
}
```

Configuring `list` to be redacted:

```json
{
  "unredacted": "value",
  "country": {
    "list": [
      "REDACTED-9b202ecbc6d45c6d8901d989a918878397a3eb9d00e8f48022fc051b19d21a1d",
      "REDACTED-4b650e5c4785025dee7bd65e3c5c527356717d7a1c0bfef5b4ada8ca1e9cbe17",
      "REDACTED-b4043b0b8297e379bc559ab33b6ae9c7a9b4ef6519d3baee53270f0c0dd3d960",
      "REDACTED-569ec6135d377e8ac326be2be2fd4cd8f3538fc3c23f33a89e81a4ed83671b7e"
    ]
  }
}
```

:::caution Note
Redacting individual or specific elements in an array or list is unsupported at this time.
:::


## Verifying

Recorded traffic is viewable directly from the Speedscale [traffic viewer](https://app.speedscale.com/analyze)
and can be used to verify if DLP configurations are working as expected.

![Traffic Viewer](./observe-traffic-viewer.png)

Click on one of the rows in the traffic list to expand and view the request, response, and metadata associated
with the transaction. For example, the following transaction contains an `Authorization` header with a
potentially sensitive JWT bearer token as its value.

![RRPair](./rrpair.png)

With DLP enabled and configured to redact the `Authorization` header, the recorded transaction will insted be
shown like the following:

![Redacted](./dlp/redacted.png)

Note, that it is still possible to manipulate redacted data during a replay using traffic
[transforms](../reference/transform-traffic/README.md). However, we may not want to ever capture or record
this data, or even let it leave your cluster, which is what DLP provides.


## Support for Additional Protocols

As mentioned, protocol support for DLP is primarily limited to HTTP traffic but may expand to additional
protocols in the future. If you need DLP support for non-HTTP traffic, drop us a message on our
[community Slack](https://slack.speedscale.com) to discuss your specific needs. At this time, the following
additional protocols are supported:

- PostgreSQL


## DLP Cookbook

Other than the `standard` DLP configuration, which is relatively trivial, there are no predefined behaviors
configured since DLP policies are typically organization specific. The following are some configuration
examples of how DLP can be configured to fit your specific needs.

### Redact KMS Data

[Amazon KMS](https://aws.amazon.com/kms) provides keys that can be used to encrypt or digitally sign data. If
your application uses KMS directly, redacting potentially sensitive information in KMS requests and responses
may be desirable. The following DLP configuration will scrub both encrypted and decrypted data present in
observed KMS traffic (as well as any `Authorization` header):

```json
{
  "id": "kms-redaction",
  "redactlist": {
    "entries": {
      "all": [
        "authorization",
        "CiphertextBlob",
        "Plaintext"
      ]
    }
  }
}
```

Refer to the [KMS documentation](https://docs.aws.amazon.com/kms/index.html) for more information about data
that you may wish to have redacted.

### Redact PostgreSQL Traffic

Postgres traffic can be redacted using a similar mechanism to HTTP redaction. However, because message _type_
is significant for postgres traffic, the configuration structure is slightly different. Instead of broadly
specifying named fields or keys to redact, as is the case with HTTP, you must specify a list of items that
indicate the message type in addition to the fields to redact. For example:

```json
{
  "id": "postgres-redaction",
  "redactlist": {
    "entries": {
      "postgres": [
        {
          "kind": "msg_query",
          "fields": [
            "query_string"
          ]
        }
      ]
    }
  }
}
```

The above configuration configures the DLP engine to redact query strings from postgres `QUERY` message types,
either from the client or server. Additional items following the pattern `{"kind":"", "fields":[]}` can be
specified in the `postgres` array. However, both `kind` and fields must resolve to a known message type and
field. The postgres protocol is documented [here](https://www.postgresql.org/docs/current/protocol.html) and
generally speaking `kind` values follow the form `msg_<name>` where `<name>` is `snake_case` form of the
message type, and `fields` are the `snake_case` form of the field names.

Another example to redact passwords:

```json
{
  "id": "postgres-redaction",
  "redactlist": {
    "entries": {
      "postgres": [
        {
          "kind": "msg_password_message",
          "fields": [
            "password"
          ]
        }
      ]
    }
  }
}
```

:::caution Note
Redaction for postgres is limited to string and character fields at this time
:::

## Replaying with PII replaced

For replays to work, redacted data usually needs to be replaced with realistic test values. Fortunately, that's easy to accomplish using the following procedure:

1. Export all redacted values to a CSV
2. Assign replacement values
3. Train Speedscale AI on replacement values during replay

Let's walk through each step with examples.

### Export Redacted Values

Take note of the snapshot ID for the snapshot you would like to replay. Open the Snapshot and click on the three dot menu. Select `Extract DLP modified tokens`. This command will extract all redacted fields contained within your snapshot. Redacted values are de-duplicated and their location in the traffic should not matter for discovery or replacement. If done through the UI, you should be automatically brought to the new user data containing the redacted tokens. It will look something like this:



:::note
Speedscale commands can be initiated via the UI or via API. Here is the equivalent command line:
```bash
speedctl extract dlp-redacted <snapshot id> --upload
```
:::

You'll want to pull these redacted files down to your local machine. You can do this by clicking the download button the user data. You can also download manually using `speedctl pull user-data <id>`. We'll be editing this file in the next step. Take note of the user-data ID (ex: `8b879152...`) as well.

### Assign Replacement Values

Open the `.csv` file created in the previous step in your favorite spreadsheet editor. You should see something like this:

![example_csv](./dlp/example_csv.png)

Enter replacement values into the second column. During replay, every instance of `READCTED-<...>` will be replaced with the value you enter. If you enjoy using the command line this can also be done using your default text editor with `speedctl edit user-data <userdata id>`.

Save the file and then push to Speedscale using the Add button in the UI or upload it via the API. When you're done you should see your CSV uploaded under User Data with the same ID.

```bash
speedctl push userdata <userdata id>
```

### Replace PII with new values

1. Navigate to your snapshot in the Speedscale Cloud UI.
2. Open the Transform Editor.
3. Open the `Variables (Tests)` tab.
4. Create a transform chain consisting of these components `source=read_file("s3://<userdata id>") : train_csv()`. In the UI it should look like this:

![example_transforms](./dlp/example_transforms.png)

That's it, now all redacted fields will be replaced with new values. There are no practical limits on how many CSVs can be pre-trained. Also remember that this can be combined with Speedscale's generative AI capabilities.
