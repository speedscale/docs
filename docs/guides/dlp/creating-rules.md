---
sidebar_position: 5
title: Creating DLP Rules
description: Create DLP rules in the dashboard by listing field names to mask, adding transform chains, or both.
---

# Creating DLP Rules

A DLP rule (also called a `DLPConfig`) says what the forwarder masks. It can hold two kinds of masking, and one rule can use both:

- **Field names to mask**: names masked wherever they appear in HTTP traffic. Start here for any field with a distinctive name.
- **Transform chains**: chains that each select one location and replace its value.

A rule does nothing until a forwarder applies it. See [Applying Rules to Production](./applying-rules.md).

## The DLP Rule Editor

Open **DLP Rules** in the dashboard navigation. Select a rule to edit it, or click **Create DLP rule** and enter an id. The id names the rule everywhere, including the forwarder's `SPEEDSCALE_DLP_CONFIG` setting, and cannot be changed later.

The editor has four tabs. All four edit the same rule, so a change on one tab is kept when you switch to another, and **Save** stores everything at once.

| Tab | What it edits |
|-----|---------------|
| **Transformations** | The rule's transform chains. |
| **Mask fields by name** | The list of field and header names to mask. |
| **Scope** | Whether the rule is a baseline or a group rule, and for a group rule its owner, workloads and on switch. See [Group Rules in the Dashboard](./group-rules-dashboard.md). |
| **Advanced** | The whole rule as JSON. |

Rules maintained by Speedscale, such as `standard`, are protected and cannot be edited or deleted. Click **Copy DLP rule** to make an editable copy.

## Masking Fields by Name

A rule can list field and header names to mask wherever they appear. In the rule JSON this is the `redactlist`. Use it when a sensitive field shows up in many places: a card number that sits in a dozen request and response shapes needs one name here, where it would need a transform chain for every path.

### What a Name Matches

Each name is matched against HTTP traffic in these places:

- **JSON bodies**: any key at any depth or array index, in request and response bodies whose `Content-Type` is JSON.
- **Form bodies**: any field in a request body sent as `application/x-www-form-urlencoded`.
- **Query parameters**: any parameter in the request URL.
- **Headers**: every value of a matching request or response header, including repeated headers such as a second `Set-Cookie`.

Names match without regard to case, so `cardnumber` also masks `CardNumber`. A name is matched whole and is never read as a path: enter `CardNumber`, not `Payments.CreditCard.CardNumber`. When a name holds an object or an array, everything inside it is masked.

### What Replaces Each Value

Each matched value is replaced with `REDACTED-<hash>`, where the hash is computed from the original value. The same value always gets the same hash, so two different customer IDs stay different after masking, and replays and mocks can still tell them apart. When [pattern discovery](#pattern-discovery) is on, the detected pattern is added before the hash. An `Authorization` header keeps its scheme and masks only the credential, for example `Bearer REDACTED-<hash>`. The RRPair is marked as redacted.

### Editing the List

Select the **Mask fields by name** tab. Type a name and click **Add**, or paste several names separated by commas or line breaks. Click the **x** on a name to remove it. If a name contains a dot, the tab warns that it looks like a path. Click **Save** when you are done.

In the rule JSON the list lives under `redactlist.entries.http`:

```json
{
  "id": "payments-pii",
  "redactlist": {
    "entries": {
      "http": ["Authorization", "Set-Cookie", "CardNumber", "CcvCode", "BirthDate", "ClientId"]
    }
  }
}
```

The entry key names the protocol, not a location in the RRPair. `all` is accepted as another name for the HTTP list. When a rule has both, the `all` list is used and the `http` list is ignored, and the dashboard tab edits the `all` list.

## Masking with Transform Chains

A transform chain starts with an extractor that selects a value, runs it through transforms, and writes the result back. For DLP, the last transform replaces the value. See [Transforms](../../concepts/transforms.md) for how chains work in general.

### From Recommendations

DLP recommendations propose chains for the sensitive values Speedscale finds in a snapshot. To add one to a rule:

1. Open the snapshot's **Prepare** tab and select a DLP suggestion under **To review**. See [DLP Recommendations](./recommendations.md).
2. Accept it, then select **Save and reanalyze**.
3. Open the saved transform's menu and select **Add to DLP rule**.
4. Choose an existing rule, or create a new one with a unique id.

Accepting a suggestion changes only the snapshot. The chain masks captured traffic once it is in a rule that a forwarder applies.

### Writing a Chain

On the **Transformations** tab, add a chain and pick its steps. To mask one field in a JSON body:

1. Extractor: **Request Body** or **Response Body**.
2. Transform: **JSON Path**, with a path inside the body such as `CreditCardOnFile.CardNumber`. Clear **Create if missing**, so bodies without the field stay unchanged.
3. Transform: **DLP Redact Field** (`dlp_field`), which replaces the value with `REDACTED-<hash>`.

In the rule JSON:

```json
{
  "id": "payments-pii",
  "transforms": [
    {
      "extractor": { "type": "res_body" },
      "transforms": [
        {
          "type": "json_path",
          "config": { "path": "CreditCardOnFile.CardNumber", "create": "false" }
        },
        { "type": "dlp_field" }
      ]
    }
  ]
}
```

Keep these points in mind when writing chains:

- **Start the JSON Path at a field inside the body.** The body extractor already selects the body, so the path never starts with `http.req.body`, `http.res.body` or `$`. The editor rejects those prefixes.
- **Use `#` to select every element of an array**, as in `Payments.#.ClientId`. Every element then receives the same replacement value, computed from the whole array. Mask the field by name instead when distinct values must stay distinct.
- **A header chain masks one value.** The **HTTP Request Header** and **HTTP Response Header** extractors read the first value unless you set **index**, so a second `Set-Cookie` is left unmasked. Mask headers by name to cover every value.
- **Choose the replacement.** **DLP Redact Field** keeps distinct values distinct. **Constant** replaces every value with the same text, which can break replays and mocks that match on IDs.
- **Add filters to limit which RRPairs a chain runs on**, such as one host or endpoint. See [Filters](../../concepts/filter.md).

Chains run in order. To use a value from one chain in another, store it in a variable and reference it by name.

## Choosing Between Names and Chains

| Use | When |
|-----|------|
| Field names to mask | The field name is distinctive and appears in many places, the field holds several values (arrays, repeated headers), or distinct values must stay distinct for replay and mock matching. |
| Transform chains | You need one exact location, the field name is too common to mask everywhere (such as `id` or `name`), you want a replacement other than a hash, or the traffic is not HTTP. |

A common rule lists the distinctive names (`Authorization`, `CardNumber`, `BirthDate`) and adds chains only for the few locations a name cannot express safely.

## Pattern Discovery

With `discover_patterns` set to `true`, the forwarder detects what kind of value it masked, such as an email or a card number, and adds that pattern to the `REDACTED-` token. [Test data generation](./test-data-generation.md) uses the pattern to produce realistic replacements. Detection costs some forwarder CPU, so leave it off when you do not generate test data from production snapshots.

```json
{
  "id": "payments-pii",
  "discover_patterns": true
}
```

## Next Steps

- [Applying Rules to Production](./applying-rules.md): point a forwarder at the rule and check the result.
- [DLP Rules for Multiple Groups](./group-rules.md): give each group its own scoped rule.
- [speedctl DLP CLI reference](./cli-reference.md): pull and push rules as JSON.
