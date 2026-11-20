---
sidebar_position: 10
title: Best Practices
description: Practical guidance for writing DLP rules that mask what they should, keep replays working, and stay correct as services change.
---

# Best Practices

## Find What to Mask

- **Discover in a test environment** whose traffic has the same shape as production. Discovery finds formats such as emails and card numbers, so also read representative payloads for names, addresses and internal identifiers that no pattern recognizes. See [Discover Sensitive Data](./discovering-pii.md).
- **Capture every endpoint that carries sensitive data**, including error responses, which often echo the request.
- **Treat a missing recommendation as unknown, not safe.** Decide for each field whether it is sensitive in your application.

## Write the Rule

- **Mask distinctive field names by name.** `Authorization`, `CardNumber` or `BirthDate` in the **Mask fields by name** list covers every place the field appears, every array element and every value of a repeated header. See [Masking Fields by Name](./creating-rules.md#masking-fields-by-name).
- **Use transform chains for the exceptions**: a common name such as `id` that is sensitive in one place only, a replacement other than a hash, or non-HTTP traffic.
- **Keep distinct values distinct.** Prefer field names or **DLP Redact Field** over **Constant**, so masked IDs still differ and replays and mocks can match on them.
- **Clear Create if missing** on every JSON Path step used for masking, so bodies without the field are left alone.
- **Mask the whole credential header**, not a part of it. A name in the list keeps the `Bearer` scheme and masks the token.

## Roll Out

- **Test the rule against recorded traffic first** with `proxymock dlp test` or a test cluster, and compare the masked RRPairs with the originals. See [Applying Rules to Production](./applying-rules.md).
- **Check a snapshot after every change**: the fields you meant to mask show `REDACTED-` tokens, and nothing else changed.
- **Turn on pattern discovery only when you need it.** It makes [test data generation](./test-data-generation.md) possible but costs forwarder CPU.

## Managing DLP Across Groups

When one forwarder captures traffic for several groups (teams, products, business units, however redaction ownership is divided in your organization), give each group its own scoped rule rather than having everyone edit a single document. See [DLP Rules for Multiple Groups](./group-rules.md) for the mechanics; the practices below are about how groups divide the work.

### Dividing Redaction Between Groups

- **Baseline for what is sensitive everywhere**: credentials, authorization headers, government identifiers
- **Group rules for what is specific to one API**: an internal customer id, a partner reference, a domain field
- **One rule per group**, holding that group's fields, rather than one rule per field
- **Scope to the namespaces and services the group owns**, and no wider

### Ownership

- **Name an owner on every rule** so the group to ask is recorded, not remembered
- **Let the owning group change its own rule** without coordinating with other groups
- **Require agreement for baseline changes**, because they affect every group
- **Keep disabled rules** instead of deleting them, so the history of what was redacted survives an audit

### Keeping Coverage Honest

- **Review scopes when workloads are renamed**: a scope names namespaces and services exactly, so a rename takes the rule out of service silently
- **Check new services**: a service in a namespace nobody scoped receives only the baseline
- **Verify with a snapshot after every change**, confirming both that your fields are redacted and that other groups' traffic is unchanged
- **Remember that unattributed traffic gets the baseline only**, which is what makes a well-maintained baseline worth the effort

## Name Rules Clearly

Use ids that say whose data and what kind, such as `payments-pii` or `baseline-credentials`. The id appears in forwarder settings and on every masked RRPair, so a clear id tells a reader which rule to open.
