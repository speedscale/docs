---
sidebar_position: 11
title: Troubleshooting
description: Find out why a DLP rule leaves a field visible, changes traffic it should not, or produces no recommendations.
---

# Troubleshooting

Start with one RRPair that shows the problem. Open it in **Traffic** or in a snapshot and note three things: the field's exact location, whether the RRPair shows a DLP rule id, and when it was captured. DLP masks traffic as it is captured, so an RRPair captured before a rule change never reflects that change.

## A Field Is Not Masked

### No DLP rule id on the RRPair

The forwarder did not apply any rule to it.

- Check **Infrastructure** for the forwarder: **Redaction rule** must name the rule, and redaction must be turned on (`SPEEDSCALE_DLP_CONFIG` and `WITH_DLP`). See [Applying Rules to Production](./applying-rules.md).
- For a group rule, check that it is enabled and that its scope names the cluster, namespace and service exactly. A renamed workload falls out of scope. See [Group Rules](./group-rules.md).

### The rule ran, but a transform chain missed the field

- **The path starts with `http.req.body` or `http.res.body`.** In the RRPair JSON those fields are always empty, and the captured body is under `bodyBase64`. After a **Request Body** or **Response Body** extractor, start the JSON Path at a field inside the body, such as `CreditCardOnFile.CardNumber`. In a **JSONPath** extractor that reads the whole RRPair, use `http.req.bodyBase64.CreditCardOnFile.CardNumber`. The editor now rejects the `body` prefix, but older rules may still have it.
- **The path names one array element.** `Payments.0.ClientId` covers only the first payment. Use `Payments.#.ClientId`, or mask `ClientId` by name.
- **A header has several values.** A header chain reads the first value unless you set **index**. Mask the header by name to cover every value, such as a second `Set-Cookie`.
- **A filter excludes the RRPair.** Check the chain's filters against the RRPair's host, path and method.

### The rule ran, but a field name in the list missed the field

- **The entry is a path.** Names are matched whole: `Payments.CreditCard.CardNumber` matches only a key spelled with those dots. Enter `CardNumber`.
- **The body is not marked as JSON.** Names are matched in JSON bodies only when the `Content-Type` contains `json`, and in form fields only for `application/x-www-form-urlencoded` request bodies. Other bodies, such as plain text or XML, need a transform chain.
- **The rule has an `all` list.** When a rule has both `all` and `http` lists, only `all` is used. The **Mask fields by name** tab shows a note and edits the `all` list in that case.

## Masking Changed Traffic It Should Not

- **New fields appear in bodies.** A **JSON Path** transform with **Create if missing** on adds its path to every body that lacks it. A path such as `http.res.body` then inserts `{"http":{"res":{"body":...}}}` into each JSON body. Clear **Create if missing** for masking.
- **Different IDs became the same value.** **Constant** writes the same text for every value, and a `#` array path gives every element one shared replacement. Replays and mocks that match on those IDs then fail. Mask the field by name, or use **DLP Redact Field** on a string field with a path without `#`, to keep distinct values distinct.
- **Numeric IDs became `0`.** A **JSON Path** step keeps a numeric field a number, so a `REDACTED-` replacement, which is not a number, is written as `0`. Mask numeric fields by name: the list replaces the number with a distinct `REDACTED-<hash>` string.
- **A common field name masked too much.** A name in the list masks that key everywhere, including unrelated APIs. For names like `id` or `name`, use a transform chain limited to one location.

## Recommendations Do Not Appear

- **Analysis has not finished.** Recommendations appear in the snapshot's **Prepare** tab after analysis completes.
- **The traffic has no recognized patterns.** Discovery recognizes formats such as emails, card numbers and tokens. Names, addresses and application-specific identifiers often produce no recommendation and need a rule you write. See [Discover Sensitive Data](./discovering-pii.md).
- **The suggestion was ignored.** Check **Ignored** in Prepare.

## Test Data Is Not Generated

Realistic replacement values depend on the pattern recorded in each `REDACTED-` token. A token captured without [pattern discovery](./creating-rules.md#pattern-discovery) holds only a hash, so the kind of value it replaced cannot be recovered. Turn on pattern discovery in the rule that masks the traffic, capture new traffic, and create a new snapshot. See [Generating Test Data](./test-data-generation.md).

## Contacting Support

Send the rule id, one affected RRPair (its id or a redacted copy), the field you expected to be masked, and the time the traffic was captured.
