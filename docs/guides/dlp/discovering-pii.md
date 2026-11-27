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

## Classify fields with a language model

proxymock can ask a language model about the fields that patterns and key names leave undecided. The model only proposes: each sensitive verdict becomes an ordinary `dlp_field` recommendation that you review, accept or reject like any other.

The model is asked about two kinds of field:

- fields that no pattern or key name recommends, such as a person's name under a vague key
- credit-card, routing-number and IMEI fields whose evidence sits close to the suppression threshold, where the model's verdict replaces the count heuristic

The model can be one you run on any server that speaks the OpenAI chat API, such as Ollama, vLLM or llama.cpp, with the `openai-compatible` provider. It can also be your own OpenAI or Anthropic account, with the `openai` or `anthropic` provider; see [Use your OpenAI or Anthropic account](#use-your-openai-or-anthropic-account). Or it can be a model service in your own cloud account: Amazon Bedrock, Azure OpenAI or Google Vertex AI; see [Use a model service in your cloud account](#use-a-model-service-in-your-cloud-account).

```bash
proxymock recommendations list --in ./proxymock \
  --dlp-model-provider openai-compatible \
  --dlp-model-base-url http://localhost:11434/v1 \
  --dlp-model qwen3:14b
```

The same flags work on `proxymock web` and on `proxymock recommendations accept` and `reject`. Each flag falls back to an environment variable, so a CI job or an MCP client can enable the classifier without changing its command line.

### When the model runs

Asking the model adds time and model usage to an analysis, several minutes with a large model on your own server, so ordinary analysis never calls it. Analysis still applies the verdicts the model gave before, so its recommendations stay after a reanalysis.

- `proxymock recommendations list` with the `--dlp-model-*` flags asks the model, since the flags are the request.
- In `proxymock web`, started with the `--dlp-model-*` flags, the Recommendations view shows **Classify with the DLP model**. It warns that the run can take several minutes, then reanalyzes the selected recording with the model.
- In the Speedscale dashboard, a snapshot's Prepare tab shows **Classify with the DLP model** for tenants with a DLP model. It warns the same way, then reanalyzes the snapshot with the model; the snapshot shows as in progress until it finishes.
- From the command line, `speedctl analyze snapshot <snapshot-id> --classify-fields` starts the same Speedscale Cloud reanalysis. It fails with `no DLP model is configured for this tenant` when the tenant has none.

Each run asks only about fields the model has not classified before.

| Flag | Environment variable | Meaning |
| --- | --- | --- |
| `--dlp-model-provider` | `SPEEDSCALE_DLP_MODEL_PROVIDER` | `openai-compatible`, `openai`, `anthropic`, `bedrock` or `azure-openai`. See [When the model runs](#when-the-model-runs). |
| `--dlp-model-base-url` | `SPEEDSCALE_DLP_MODEL_BASE_URL` | API root of the model server, for example `http://localhost:11434/v1`, or the Azure OpenAI resource endpoint; `openai-compatible` and `azure-openai` only |
| `--dlp-model` | `SPEEDSCALE_DLP_MODEL` | model id on that server or account |
| `--dlp-model-api-key` | `SPEEDSCALE_DLP_MODEL_API_KEY` | key for the provider; required for `openai`, `anthropic` and `azure-openai`, optional for `openai-compatible`, not used for `bedrock` |
| `--dlp-model-region` | `SPEEDSCALE_DLP_MODEL_REGION` | AWS region for `bedrock`; defaults to your AWS configuration |
| `--dlp-model-api-version` | `SPEEDSCALE_DLP_MODEL_API_VERSION` | Azure OpenAI API version for `azure-openai`; defaults to `2024-10-21` |
| `--dlp-model-exposure` | `SPEEDSCALE_DLP_MODEL_EXPOSURE` | `samples` or `metadata`; the default is `samples` for `openai-compatible` and `metadata` for every other provider |
| `--dlp-adjudicator-model` | `SPEEDSCALE_DLP_ADJUDICATOR_MODEL` | optional second model on the same provider that decides grey-zone card, routing-number and IMEI fields |
| none | `SPEEDSCALE_DLP_MODEL_REASONING_EFFORT` | passed to the server; `none` turns off a reasoning model's thinking where the server supports it. Leave it unset for `anthropic`, which has no `none` value |

### Recommended model

Speedscale certifies `qwen3:14b` from the Ollama library, the Q4_K_M build with ID `bdbd181c33f2`, run with thinking turned off. It also certifies Claude Haiku 5.5 on Amazon Bedrock under the inference profile id `us.anthropic.claude-haiku-5-5`; see [Amazon Bedrock](#amazon-bedrock). Verdicts from either carry `dlpModelCertified: true`. Any other model still works, and its verdicts carry `dlpModelCertified: false`.

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

### Use your OpenAI or Anthropic account

If your organization already has an agreement with OpenAI or Anthropic, proxymock can call that account instead of a model you run:

```bash
SPEEDSCALE_DLP_MODEL_API_KEY=<your key> proxymock recommendations list --in ./proxymock \
  --dlp-model-provider anthropic \
  --dlp-model <model id>
```

Use `--dlp-model-provider openai` the same way for an OpenAI account. A vendor provider needs an API key and takes no base URL.

A vendor provider runs in `metadata` exposure unless you ask for more: the model receives each field's location, counts and pattern hits, and no recorded value leaves proxymock. To send sample values as well, pass `--dlp-model-exposure samples`; proxymock then prints a notice that values are going to the vendor, and each recommendation's `dlpModelExposure` tag records what the model saw. The [free-text check](#free-text-fields) reads values, so it runs with a vendor provider only in `samples` exposure.

The data you send is governed by your own agreement with the vendor. Speedscale makes no claim about how a vendor stores or uses it.

You choose the model, and Speedscale makes no accuracy commitment for it: its verdicts carry `dlpModelCertified: false`. The model must follow instructions to answer in JSON, and each request holds up to 16 fields, a few thousand tokens. As a guide, open models of 14B parameters or more scored F1 0.886 to 0.891 on the corpus in `metadata` exposure and an 8B model scored 0.823, so pick a model at least as capable as a 14B open model.

With patterns, key names and the rules in [Results and the cache](#results-and-the-cache) in front of it, each of these models scored as follows on the same corpus in `metadata` exposure:

| Provider | Model | Precision | Recall | F1 |
| --- | --- | --- | --- | --- |
| `anthropic` | `claude-haiku-5-5` | 0.980 | 0.986 | 0.983 |
| `openai` | `gpt-5-mini` | 0.983 | 0.986 | 0.984 |
| `openai-compatible` | `qwen3:14b` | 0.987 | 0.972 | 0.979 |

Without sample values the model judges a field by its location alone, so a bare `name` key or a city, state or country field is more often misjudged than in `samples` exposure. These are results on one synthetic corpus, not a commitment for your traffic.

A second model can decide the grey-zone card, routing-number and IMEI fields while a cheaper one classifies the rest. Name it with `--dlp-adjudicator-model`; it runs on the same provider and key. Published results favour a stronger second model over asking the same model again.

### Use a model service in your cloud account

If your captured traffic lives in your own AWS, Azure or Google Cloud account, the model service approved in that account can classify it, so model calls stay in the account you already chose for the traffic. These services run inside your cloud account but outside the cluster or machine proxymock reads traffic in, so they also default to `metadata` exposure. Whether sample values may go to a service in your own account is your call; pass `--dlp-model-exposure samples` to allow it.

#### Amazon Bedrock

```bash
proxymock recommendations list --in ./proxymock \
  --dlp-model-provider bedrock \
  --dlp-model-region us-east-1 \
  --dlp-model <model or inference profile id>
```

proxymock signs requests with the AWS default credential chain: environment variables, your shared profile and SSO login, or an instance or pod role, the same credentials `proxymock import` uses for buckets. It takes no API key. The region comes from `--dlp-model-region`, then `AWS_REGION` or your profile.

The model id is a Bedrock model id or an inference profile id, such as one starting with `us.` or `eu.`. Some models can only be called through an inference profile; Bedrock then rejects the base model id with a message that on-demand throughput is not supported. The prefix of a cross-region profile decides which regions may serve the request, so pick it with your data residency rules in mind.

proxymock streams answers through the Converse API. For a direct model call, grant `bedrock:InvokeModelWithResponseStream` on the foundation model ARN in your Region. For an inference profile, grant the same action on the profile ARN and on the underlying foundation model ARN in every Region the profile can route to. See the [Bedrock inference profile prerequisites](https://docs.aws.amazon.com/bedrock/latest/userguide/inference-profiles-prereq.html).

Speedscale certifies `us.anthropic.claude-haiku-5-5`, the US inference profile for Claude Haiku 5.5, which can route a request to us-east-1, us-east-2 or us-west-2. With patterns, key names and the rules in [Results and the cache](#results-and-the-cache) in front of it, it scored precision 0.977, recall 0.992 and F1 0.984 on the corpus in `samples` exposure. On its own it scored F1 0.994, and an instruction planted in one sample value changed 1 of its 883 correct sensitive verdicts. Qwen3 32B on Bedrock (`qwen.qwen3-32b-v1:0`) scored a similar F1 0.987 in the full pipeline, but a planted instruction changed 22.5% of its correct verdicts, so Speedscale does not certify it. Verdicts from the same Haiku model under any other id, such as the Anthropic API's `claude-haiku-5-5`, carry `dlpModelCertified: false`: its resistance to planted instructions was measured only through this profile.

Confirm your account has access to the model. If you get `AccessDeniedException`, check the IAM resource grants and any service control policies for the destination Regions. proxymock caps each answer at 4,096 tokens, so a request does not reserve the model's full output quota.

#### Azure OpenAI

```bash
SPEEDSCALE_DLP_MODEL_API_KEY=<resource key> proxymock recommendations list --in ./proxymock \
  --dlp-model-provider azure-openai \
  --dlp-model-base-url https://<resource>.openai.azure.com \
  --dlp-model <deployment name>
```

`--dlp-model` is the name of your deployment, not the model name, and is used exactly as written. The key is one of the resource's keys, from Keys and Endpoint in the Azure portal; proxymock sends it in the `api-key` header. Requests use API version `2024-10-21` unless `--dlp-model-api-version` names another.

#### Google Vertex AI

proxymock has no Vertex provider of its own. Vertex AI serves Gemini models through an OpenAI-compatible endpoint, so use the `openai-compatible` provider with a Google Cloud access token as the key:

```bash
SPEEDSCALE_DLP_MODEL_API_KEY="$(gcloud auth application-default print-access-token)" \
proxymock recommendations list --in ./proxymock \
  --dlp-model-provider openai-compatible \
  --dlp-model-base-url https://aiplatform.googleapis.com/v1/projects/<project>/locations/global/endpoints/openapi \
  --dlp-model google/<model id> \
  --dlp-model-exposure metadata
```

Pass `--dlp-model-exposure metadata` yourself: `openai-compatible` defaults to `samples`, because it is usually a server you run. An access token lasts one hour by default. A first analysis of a large workspace can outlast it, so for long runs put an OpenAI-compatible gateway that refreshes Google credentials, such as LiteLLM, in front of Vertex and point `--dlp-model-base-url` at the gateway. The principal behind the token needs permission to call Vertex AI models in that project.

As with a vendor account, you choose the model and your agreement with the cloud provider governs the data. Verdicts carry `dlpModelCertified: false` unless the model is `us.anthropic.claude-haiku-5-5` on Bedrock.

### What the model receives

The classifier sends one request per endpoint, with up to 16 fields in it. Exposure defaults to `samples` with `openai-compatible` and to `metadata` with the other providers.

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

A recommendation the model proposed carries the tags `dlpClass`, `dlpReason`, `dlpModel`, `dlpModelCertified` and `dlpModelExposure`. The `dlpClassification` tag says how the model took part: `classified` when it proposed the field, `adjudicated` when it decided a grey-zone card, routing-number or IMEI field, and `not classified` when it was asked and gave no usable answer. With `--dlp-adjudicator-model`, `dlpModel` on an adjudicated field names the adjudicator.

A field the model could not classify keeps the result discovery gives without a model.

The redaction rule a model recommendation creates labels each `REDACTED-` token with the model's class, so a masked field becomes, for example, `REDACTED-BANK_ACCOUNT_NUMBER-<hash>`, and [test data generation](./test-data-generation.md) regenerates it as that class. A value with a sensitive format of its own keeps its own label, so an email the model called a bank account number stays an email. `IP_ADDRESS` and `FREE_TEXT_PII` add no label, since neither has one format.

A verdict that contradicts the rules discovery already applies gets no recommendation:

- a street address or postal code inside a business object such as `store`, `office`, `clinic` or `warehouse`, the same objects key-name discovery skips
- a date of birth whose key names another event, such as `createdAt`, `orderDate`, `shipDate` or `founded`
- a card number, IBAN, routing number, SSN, email, MAC address, IMEI or VIN in a field where no value matches that class's pattern, such as a masked card number

Verdicts are saved in `.proxymock/dlp-classifications.json` in the workspace, so each field is asked about once and a second analysis of unchanged traffic makes no model call. An adjudicator model's verdicts are saved beside it, in `.proxymock/dlp-classifications-adjudicator.json`. Changing the model or the exposure starts a new cache. Delete the files to classify every field again.

Verdicts from a [certified model](#recommended-model) carry `dlpModelCertified: true`, and verdicts from any other model carry `dlpModelCertified: false`. A model can call ordinary data sensitive, such as an order date or a product description, so review its proposals before you accept them, whichever model made them.

### Teach the classifier your data

The model can misread what a field means, such as a hotel's address, an insurer named in a `payer` field, or a server's IP address. Your accept and reject decisions on its recommendations steer it, for your workspace or Speedscale tenant only.

- Rejecting a model recommendation asks why. **Not sensitive** records the field as not sensitive: the model is not asked about it again, and the same key on other endpoints, such as `Customer.FirstName` or `customer.first_name`, gets no recommendation either. **Sensitive, no rule needed** only hides the recommendation.
- On the command line, `proxymock recommendations reject --id <id> --reason not-sensitive` does the same. Without `--reason`, the recommendation is only hidden.
- In the Speedscale dashboard, **Ignore** on a model recommendation in a snapshot's Prepare tab asks the same question. **Restore** undoes the decision, and **Accept** records the class.
- Accepting a model recommendation records its class, so the same key on another endpoint is proposed with that class without asking the model.
- Decisions on related fields, whose keys share a word such as `property` in `property.zip` and `Property.PostalCode`, go to the model as examples. An example carries the field's location and class, never a value, so examples are sent in `metadata` exposure too. A field whose examples change is asked again once.
- A decision never overrides a card number, IBAN, routing number, SSN, email, MAC address, IMEI or VIN whose values match that class's pattern.

In proxymock, decisions are saved in `.proxymock/dlp-decisions.json` in the workspace, beside the verdict cache. They stay on your machine, apply to that workspace only, and train no model. Undoing a reject removes its decision. Delete the file to forget every decision.

In Speedscale cloud, decisions are kept per tenant in the tenant's storage and apply to every snapshot that tenant classifies. They are never shared with another tenant or used to train a model.

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
