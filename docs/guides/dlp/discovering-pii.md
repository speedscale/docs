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

## Classify fields with a local model

proxymock can ask a language model you run about the fields that patterns and key names leave undecided. The model only proposes: each sensitive verdict becomes an ordinary `dlp_field` recommendation that you review, accept or reject like any other.

The model is asked about two kinds of field:

- fields that no pattern or key name recommends, such as a person's name under a vague key
- credit-card, routing-number and IMEI fields whose evidence sits close to the suppression threshold, where the model's verdict replaces the count heuristic

Any server that speaks the OpenAI chat API works, such as Ollama, vLLM or llama.cpp. Only the `openai-compatible` provider is accepted.

```bash
proxymock recommendations list --in ./proxymock \
  --dlp-model-provider openai-compatible \
  --dlp-model-base-url http://localhost:11434/v1 \
  --dlp-model qwen3:14b
```

The same flags work on `proxymock web` and on `proxymock recommendations accept` and `reject`. Each flag falls back to an environment variable, so a CI job or an MCP client can enable the classifier without changing its command line.

| Flag | Environment variable | Meaning |
| --- | --- | --- |
| `--dlp-model-provider` | `SPEEDSCALE_DLP_MODEL_PROVIDER` | `openai-compatible`; setting it enables the classifier |
| `--dlp-model-base-url` | `SPEEDSCALE_DLP_MODEL_BASE_URL` | API root of the model server, for example `http://localhost:11434/v1` |
| `--dlp-model` | `SPEEDSCALE_DLP_MODEL` | model id on that server |
| `--dlp-model-api-key` | `SPEEDSCALE_DLP_MODEL_API_KEY` | optional key sent to the model server |
| `--dlp-model-exposure` | `SPEEDSCALE_DLP_MODEL_EXPOSURE` | `samples` (default) or `metadata` |
| none | `SPEEDSCALE_DLP_MODEL_REASONING_EFFORT` | passed to the server; `none` turns off a reasoning model's thinking where the server supports it |

### Recommended model

Speedscale certifies `qwen3:14b` from the Ollama library, the Q4_K_M build with ID `bdbd181c33f2`, run with thinking turned off. Verdicts from it carry `dlpModelCertified: true`. Any other model still works, and its verdicts carry `dlpModelCertified: false`.

Speedscale picked it on a labeled corpus of 2,269 recorded fields, 886 of them sensitive, with five sample values per field. The scores below are the model's own, before patterns, key names and the rules in [Results and the cache](#results-and-the-cache) take part:

| Model | Precision | Recall | F1 | Correct verdicts flipped by an instruction planted in a value | Fields per minute |
| --- | --- | --- | --- | --- | --- |
| `qwen3:8b` | 0.703 | 0.994 | 0.824 | 24.5% | 274 |
| `qwen3:14b` | 0.855 | 0.990 | 0.918 | 5.8% | 155 |
| `qwen3:32b` | 0.875 | 0.999 | 0.933 | 21.5% | 86 |

`qwen3:32b` scores slightly higher but runs at half the speed and was talked out of a correct verdict almost four times as often. With patterns, key names and those rules in front of it, `qwen3:14b` scores precision 0.992 and recall 0.990 on the same corpus.

The speeds in the table were measured on an Apple M5 Max GPU with four requests in flight. Ollama loads `qwen3:14b` at about 16 GB with its default 40,960-token context, so the minimum is 16 GB of free GPU memory, or of unified memory on Apple silicon. The model also runs on CPU alone in 16 GB of free RAM: on the same machine's 18-core CPU it classified 24 fields per minute, about a sixth of the GPU speed, so a first analysis of a large workspace takes noticeably longer. Each field is asked about only once, so later analyses of the same traffic are fast on either.

Run it with Ollama:

```bash
ollama pull qwen3:14b
ollama list
SPEEDSCALE_DLP_MODEL_REASONING_EFFORT=none proxymock recommendations list --in ./proxymock \
  --dlp-model-provider openai-compatible \
  --dlp-model-base-url http://localhost:11434/v1 \
  --dlp-model qwen3:14b
```

`ollama list` shows the ID of the build you pulled; the certified build is `bdbd181c33f2`.

Run it with vLLM, which serves an AWQ build of the same model on an NVIDIA GPU:

```bash
vllm serve Qwen/Qwen3-14B-AWQ \
  --reasoning-parser qwen3 \
  --default-chat-template-kwargs '{"enable_thinking": false}'
```

```bash
proxymock recommendations list --in ./proxymock \
  --dlp-model-provider openai-compatible \
  --dlp-model-base-url http://localhost:8000/v1 \
  --dlp-model Qwen/Qwen3-14B-AWQ
```

The AWQ build is a different 4-bit quantization from the Ollama build, and Speedscale has not measured it on the corpus, so its verdicts carry `dlpModelCertified: false`.

### What the model receives

The classifier sends one request per endpoint, with up to 16 fields in it.

| Sent | `samples` exposure | `metadata` exposure |
| --- | --- | --- |
| host and HTTP method | yes | yes |
| field location, for example `http.res.bodyBase64.customer.name` | yes | yes |
| how many values the field had and how many were distinct | yes | yes |
| how many values matched each sensitive pattern | yes | yes |
| up to five distinct values of the field, each cut at 200 characters | yes | no |

Headers, query strings, URL paths and whole bodies are never sent. In `metadata` exposure no recorded value leaves proxymock.

Sample values are recorded traffic, and a value written to steer the model can change its answer. The model is told to ignore instructions inside values, but use `metadata` exposure for traffic that may carry hostile input.

### Free-text fields

A note, a support message or a recorded prompt can carry personal data inside a sentence, where no pattern sees it. When the model calls a field free text, or the field's values read like prose, proxymock runs a second check on it.

The check sends up to ten distinct values of the field, each cut at 1,000 characters, in one request, and asks which of them mention personal data and of what kinds. The field carries personal data when any sampled value does.

A field that carries personal data gets a recommendation to redact the whole field. A sample can miss personal data in a field whose text varies a lot, so a rule that redacted only the spans found would leave the rest of the field unchecked. The recommendation's `dlpFreeTextKinds`, `dlpFreeTextSampled` and `dlpFreeTextWithPII` tags show what the sample found.

A field the check finds clean gets no recommendation, even when the model first called it free text. At most 200 fields are checked per analysis. A field over that limit keeps the model's first verdict, tagged `dlpFreeTextCheck: not yet checked`, and is checked by a later analysis.

The check runs in `samples` exposure only; in `metadata` exposure proxymock sends no values, so free-text fields are judged by their location alone.

### Results and the cache

A recommendation the model proposed carries the tags `dlpClass`, `dlpReason`, `dlpModel` and `dlpModelCertified`. The `dlpClassification` tag says how the model took part: `classified` when it proposed the field, `adjudicated` when it decided a grey-zone card, routing-number or IMEI field, and `not classified` when it was asked and gave no usable answer.

A field the model could not classify keeps the result discovery gives without a model.

A verdict that contradicts the rules discovery already applies gets no recommendation:

- a street address or postal code inside a business object such as `store`, `office`, `clinic` or `warehouse`, the same objects key-name discovery skips
- a date of birth whose key names another event, such as `createdAt`, `orderDate`, `shipDate` or `founded`
- a card number, IBAN, routing number, SSN, email, MAC address, IMEI or VIN in a field where no value matches that class's pattern, such as a masked card number

Verdicts are saved in `.proxymock/dlp-classifications.json` in the workspace, so each field is asked about once and a second analysis of unchanged traffic makes no model call. Changing the model or the exposure starts a new cache. Delete the file to classify every field again.

Verdicts from the [recommended model](#recommended-model) carry `dlpModelCertified: true`, and verdicts from any other model carry `dlpModelCertified: false`. A model can call ordinary data sensitive, such as an order date or a product description, so review its proposals before you accept them, whichever model made them.

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
