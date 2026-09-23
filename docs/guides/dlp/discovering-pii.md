---
sidebar_position: 3
title: Discover Sensitive Data
description: Review sensitive-data discoveries, field-level evidence, and false positives before creating and testing DLP rules.
---

# Discover Sensitive Data

Start with a [snapshot](../creating-a-snapshot.md) from a test environment. Review the DLP findings to identify which fields need redaction, then [create rules](./creating-rules.md) and verify their output. Discovery alone does not redact captured data.

## Sensitive patterns

Discovery uses value formats, known credential prefixes, and checksums where applicable. The sensitive set includes:

| Category | Recognized formats |
| --- | --- |
| Contact details | Email, E.164 phone numbers, and supported North American national phone formats |
| Government identifiers | US SSNs; supported UK National Insurance, Canadian SIN, and Indian Aadhaar formats |
| Financial identifiers | Credit cards with issuer/length and checksum checks, IBANs, and ABA routing numbers |
| Device and vehicle identifiers | MAC addresses, IMEIs, and VINs |
| Credentials | PEM private-key blocks and recognized vendor API-key/token prefixes |

The expanded patterns and field-level scoring are included in the September 2026 releases; see [Release Notes](/reference/release-notes.md). A national-ID label does not imply support for every country's identifiers. Generic credentials without a recognized format, names, addresses, and other application-specific sensitive fields may need explicit rules.

Discovery also recognizes structural formats such as UUIDs, JWTs, IP addresses, dates, and hashes. Recognizing a format and recommending sensitive-data redaction are separate decisions. Decide which fields are sensitive for your application, including fields that receive no recommendation.

## Why a value may not produce a recommendation

The analyzer examines evidence across values at a JSON field location. It considers how often the field appears, how many distinct values it contains, how often a sensitive pattern matches, and whether values resemble other known formats.

Checksummed numeric patterns can match unrelated numbers by accident. Credit-card, routing-number, and IMEI candidates may therefore be suppressed when the field evidence points to another format or too few values match. Stronger patterns are retained. Missing field-profile evidence does not automatically suppress a finding.

This reduces false positives but does not establish that an unflagged field is safe. Review both the proposed sensitive locations and representative unflagged payloads.

## Review locations and create rules

1. Inspect the request or response that produced a finding.
2. Check the proposed field path, including nested arrays. Discovery groups equivalent array locations using wildcard indices.
3. Decide whether the entire field or only a matching part needs redaction.
4. Create the rule and test it against representative traffic, including values that should remain unchanged.
5. Inspect the resulting RRPairs before applying the rule to future capture or replay.

Use the path syntax expected by the chosen transform. See [`dlp_json`](../transformation/transforms/dlp_json.md) and [`dlp_field`](../transformation/transforms/dlp_field.md); do not assume that every JSONPath dialect or advanced expression is supported.

## Work locally with proxymock

The local DLP and filter editors let you author rules against RRPair files. `proxymock dlp test` previews a rule; `proxymock dlp apply` writes redacted copies. See [Author DLP and Filter Rules Locally](/proxymock/guides/local-rules.md) for commands and output handling.

For BYOC imports, `--dlp-config` applies a local rule before imported RRPairs are written. See [Use BYOC Traffic with proxymock](/byoc/use-traffic.md#redact-on-the-way-in). The downloaded source objects still contain their original data; local import redaction does not rewrite the bucket.

Continue with [DLP Recommendations](./recommendations.md), [Creating Rules](./creating-rules.md), and [Applying Rules](./applying-rules.md).
