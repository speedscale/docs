---
sidebar_position: 12
title: CLI Reference
description: CLI reference for managing DLP rules with speedctl.
---

# CLI Reference

:::note Administrator Access Required
Only administrators can modify DLP rules. You must have the appropriate permissions to pull and push DLP rules.
:::

This section provides CLI reference documentation for managing DLP rules using `speedctl`. Use these commands to pull DLP rules to your local machine for editing and push them back to Speedscale.

## Pulling DLP Rules

Use `speedctl pull dlp-rule` to download a DLP rule from Speedscale to your local machine.

```bash
speedctl pull dlp-rule <rule-id>
```

By default, the rule is downloaded to `~/.speedscale/data/dlp-rules/<rule-id>.json`.

### Example

```bash
speedctl pull dlp-rule prod-payment-data-redaction
```

After pulling, you can edit the rule file locally. The file contains the DLP configuration including transform chains, filters, and extractors.

## Pushing DLP Rules

Use `speedctl push dlp-rule` to upload a modified DLP rule from your local machine back to Speedscale.

```bash
speedctl push dlp-rule <rule-id>
```

### Example

```bash
speedctl push dlp-rule prod-payment-data-redaction
```

After pushing, the updated rule is available in Speedscale. Forwarders that reference the rule will automatically apply the changes; no manual refresh or redeployment is required.

## Typical Workflow

1. **Pull** the rule from Speedscale: `speedctl pull dlp-rule my-dlp-rule`
2. **Edit** the rule file locally (e.g., `~/.speedscale/data/dlp-rules/my-dlp-rule.json`)
3. **Push** the updated rule back: `speedctl push dlp-rule my-dlp-rule`
4. **Apply** the rule to forwarders via the UI or your deployment configuration

## Next Steps

- [Creating DLP Rules](./creating-rules.md) - Create and configure DLP rules

## Related Documentation

- [Creating DLP Rules](./creating-rules.md) - Rule creation guide
- [Applying Rules to Production](./applying-rules.md) - Production deployment
