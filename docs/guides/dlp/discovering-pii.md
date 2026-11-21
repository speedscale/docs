---
sidebar_position: 3
title: Discover Sensitive Data
description: Review sensitive-data discoveries, field-level evidence, and false positives before creating and testing DLP rules.
---

# Discover Sensitive Data

Start with a [snapshot](../creating-a-snapshot.md) from a test environment. Review the DLP findings to identify which fields need redaction, then [create rules](./creating-rules.md) and verify their output. Discovery alone does not redact captured data.

## Sensitive patterns

Discovery uses value formats, known credential prefixes, and checksums where applicable, and for fields whose values have no format of their own, the field's key name. The sensitive set includes:

| Category | Recognized formats |
| --- | --- |
| Contact details | Email, E.164 phone numbers, and supported North American national phone formats |
| Government identifiers | US SSNs; supported UK National Insurance, Canadian SIN, and Indian Aadhaar formats |
| Financial identifiers | Credit cards with issuer/length and checksum checks, IBANs, and ABA routing numbers |
| Device and vehicle identifiers | MAC addresses, IMEIs, and VINs |
| Credentials | PEM private-key blocks and recognized vendor API-key/token prefixes |

## Fields recognized by key name

Some personal data has no format a value check can recognize: "Ada", "SW1Y 4JH" and "314" could be anything. For JSON body fields, discovery also reads the field's key, so a value under a key such as `firstName` or `postalCode` is recognized when the value is shaped like that kind of data.

| Label | Example keys |
| --- | --- |
| Person Name | `firstName`, `lastName`, `surname`, `fullName`, `cardholderName`, `holderName`, `ownerName`, `guardianName`, `emergencyContact`; `name` inside a customer, user, contact, billing or shipping object, or an object named for a person's role such as a doctor, examiner or creditor |
| Street Address | `street`, `addressLine1`, `address1`, `addr1`, `billingAddress`; `line1` and `line2` inside an address, billing or shipping object; `address` inside a customer or contact object |
| Postal Code | `postalCode`, `postcode`, `zip`, `zipCode` |
| Date of Birth | `dateOfBirth`, `birthDate`, `dob` |
| Card Security Code | `cvv`, `cvc`, `securityCode` |
| Secret | `password`, `pin`, `clientSecret`, `accessToken`, `refreshToken`, `securityAnswer`; any key ending in `password` or `secret`, such as `newPassword` or `webhookSecret` |
| Phone Number | `phone`, `mobile`, `telephone`, including bare digits such as `4045551001` |
| National ID | `ssn`, `sin`, `nino`, `aadhaar`, `passportNumber`, `driversLicenseNumber` |

Keys match regardless of case and separators, so `first_name`, `firstName` and `FIRST-NAME` are the same key. A key-name finding needs a plausible value: a name with no digits, a postal code with a digit, a date for a date of birth, three or four digits for a security code. `name` on a product and `address` on a server are not personal data, so those keys count only inside an object that describes a person. Addresses and postal codes inside a store, vendor, office, clinic, hotel, warehouse or other business object are not recommended. Roles that also name software or organizations, such as provider, agent, account or manager, do not make their `name` a person's name, so write a rule for those fields when they hold people. For names, addresses, postal codes, dates of birth, security codes and secrets, a field whose values mostly do not fit the class its key names is suppressed, like a weak pattern.

A value format is more specific than a key, so an email under a `contactName` key is still reported as an email. A key name does take precedence over a non-sensitive format: a date under `dateOfBirth` is a date of birth, not a timestamp.

Key names are read only in JSON request and response bodies, not in query parameters, headers or SQL columns.

The expanded patterns and field-level scoring are included in the September 2026 releases; see [Release Notes](/reference/release-notes.md). A national-ID label does not imply support for every country's identifiers. Fields whose keys are not in the lists above, credentials stored under generic key names, and other application-specific sensitive fields may need explicit rules.

Discovery also recognizes structural formats such as UUIDs, JWTs, IP addresses, dates, and hashes. Recognizing a format and recommending sensitive-data redaction are separate decisions. Decide which fields are sensitive for your application, including fields that receive no recommendation.

## Why a value may not produce a recommendation

The analyzer examines evidence across values at a JSON field location. It considers how often the field appears, how many distinct values it contains, how often a sensitive pattern matches, and whether values resemble other known formats.

Checksummed numeric patterns can match unrelated numbers by accident. Credit-card, routing-number, and IMEI candidates may therefore be suppressed when the field evidence points to another format or too few values match. Name, address, postal code, date of birth, security code and secret findings are suppressed the same way when too few of the field's values fit the class. Stronger patterns are retained. Missing field-profile evidence does not automatically suppress a finding.

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
