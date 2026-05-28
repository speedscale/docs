---
description: "Reference for Speedscale's embedded ${{...}} substitution syntax, including variable substitution and the special keywords for environment variables, random strings, files, user data, dataframes, and secrets."
sidebar_position: 5
---

# Embedded Syntax

Most transform configuration fields support an embedded substitution syntax. Anywhere you can type a
value — for example the `new` field of a [constant](./transforms/constant.md), or the `key` and
`field` of a [dataframe lookup](./transforms/dataframe.md) — you can embed a placeholder of the form:

```
${{ ... }}
```

Each placeholder is resolved at runtime, just before the transform runs, against the
[variable cache](../../reference/glossary.md#variable-cache) for the current
[vUser](../../reference/glossary.md#vuser). The substituted result is then used as the field value.
Placeholders that cannot be resolved are simply left in place, so a typo fails open rather than
erroring.

The simplest form is a plain [variable](./variables.md) name, but several **special keywords** are
also recognized. They are summarized here and described in detail below.

| Form | Resolves to | Example |
| ---- | ----------- | ------- |
| `${{name}}` | The value of variable `name` from the variable cache | `${{customer_id}}` |
| `${{env_var:NAME}}` | The value of the `NAME` environment variable | `${{env_var:HOME}}` |
| `${{rand_string:"PATTERN"}}` | A random string matching a regex-style pattern | `${{rand_string:"SPDID-[a-z0-9]{10}"}}` |
| `${{file:FILENAME}}` | The entire contents of a file (local path or `s3://` user data) | `${{file:s3://payload.json}}` |
| `${{dataframe:NAME:KEY:FIELD}}` | A single cell looked up from a loaded dataframe | `${{dataframe:people:${{id}}:Email}}` |
| `${{secret:NAME/KEY}}` | A value read from a mounted secret | `${{secret:mongo-creds/password}}` |

:::note
Substitution is a simple text replacement, not an expression language. There is no dot-notation,
array indexing, or JSON-path access into a stored value (e.g. `${{user.email}}` is treated as a
literal variable name, not a field lookup). The only nesting supported is inside the `key` and
`field` parts of a `dataframe:` directive.
:::

## Variable substitution

A bare name is replaced with the value of that [variable](./variables.md) from the variable cache.
Variables are populated by transforms like [var_store](./transforms/variable_store.md), by
[runtime variables](./variables.md), or extracted from earlier traffic.

```
${{customer_id}}
```

For example, to embed a stored value inside a `constant`:

```json
{
  "type": "constant",
  "config": {
    "new": "Bearer ${{access_token}}"
  }
}
```

## `env_var` — environment variables

Reads an environment variable from the process running the replay. Returns an empty string when the
variable is unset.

```
${{env_var:NAME}}
```

```json
{
  "type": "constant",
  "config": {
    "new": "${{env_var:BUILD_VERSION}}"
  }
}
```

## `rand_string` — generated random strings

Generates a random string that matches the supplied regex-style pattern. The pattern is given as a
JSON-escaped string literal (wrapped in double quotes). This is the inline equivalent of the
[rand_string](./transforms/rand_string.md) transform.

```
${{rand_string:"PATTERN"}}
```

```json
{
  "type": "constant",
  "config": {
    "new": "${{rand_string:\"order-[a-z0-9]{12}\"}}"
  }
}
```

## `file` — inline file contents

Inserts the **entire** contents of a file. Two sources are supported:

- a local filesystem path, e.g. `${{file:/var/secrets/token}}`
- `s3://<name>` to pull a [user data](../../reference/glossary.md#user-data) document from the
  Speedscale cloud, e.g. `${{file:s3://payload.json}}`

This is useful when you want to embed an arbitrary blob — JSON, XML, a token, anything — without
imposing any structure on it. Unlike a dataframe, the file is not parsed; its raw bytes become the
value.

```json
{
  "type": "constant",
  "config": {
    "new": "${{file:s3://default-request-body.json}}"
  }
}
```

:::tip
Pulling from `s3://` requires a connection to the file store (available during cloud replays). For
the **CSV/tabular** lookup case, and for a portable reference that also works in local proxymock
replays, see the `dataframe:` keyword below and the [file extractor](./extractors/file.md).
:::

## `dataframe` — keyed lookup {#dataframe-lookup}

Looks up a single cell from a dataframe that was loaded as a runtime variable. This is the inline
equivalent of the [dataframe_lookup](./transforms/dataframe.md) transform.

```
${{dataframe:NAME:KEY:FIELD}}
```

- **NAME** — the name of the dataframe runtime variable (set up with a `csv_dataframe` variable)
- **KEY** — the primary-key value of the row to read
- **FIELD** — the column to return

`KEY` and `FIELD` may themselves contain `${{...}}` placeholders, so the lookup can be driven
dynamically by other variables:

```
${{dataframe:people:${{customer_name}}:Email}}
```

The lookup is performed against an already-loaded, in-memory dataframe — the keyword itself does not
fetch anything. The dataframe's source CSV (including pulling it from cloud
[user data](../../reference/glossary.md#user-data) via the portable `dataframe:` filename scheme) is
resolved when the `csv_dataframe` runtime variable loads. See [Dataframe](./transforms/dataframe.md)
and the [file extractor](./extractors/file.md) for how that source is located in cloud vs. local
replays.

## `secret` — mounted secrets

Reads a value from a secret made available to the replay (for example a Kubernetes secret mounted by
the operator). The format is `name/key`:

```
${{secret:NAME/KEY}}
```

```json
{
  "type": "constant",
  "config": {
    "new": "${{secret:mongo-creds/password}}"
  }
}
```

The `secret:` keyword is recognized by the transforms that handle credentials —
[constant](./transforms/constant.md), [jwt_resign](./transforms/jwt_resign.md),
[aws_auth](./transforms/aws_auth.md), and the SASL auth transform — and the value is never written
to logs or dumps.
