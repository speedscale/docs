---
sidebar_position: 5
title: Creating DLP Rules
description: Learn how to create, configure, and manage DLP rules from recommendations.
---

# Creating DLP Rules

DLP rules (also called DLPConfig) are configurations that define how data should be redacted and transformed. Rules are created from recommendations and then applied to forwarders in your production environment.

## What is a DLP Rule?

A DLP rule is a named configuration that contains:

- **Transform Chains**: Sequences of filters, extractors, and transforms
- **Pattern Discovery Settings**: Configuration for discovering data patterns
- **Field names to mask** (`redactlist`): Names masked wherever they appear
- **Metadata**: Name, ID, and protection status

### DLP Rule Components

#### Rule ID and Name

- **ID**: Unique identifier (e.g., `my-dlp-rule`)
- **Name**: Human-readable name for the rule

#### Transform Chains

The core of a DLP rule:

- **Multiple Chains**: Rules can contain multiple transform chains
- **Chain Order**: Chains are processed in order
- **Chain Scope**: Each chain can target different RRPairs
- **Chain Relationships**: If you need to reference one chain from another, use a variable and reference it by name

#### Pattern Discovery Settings

The `discover_patterns` setting:

- **Purpose**: Enables automatic pattern discovery for REDACTED tokens
- **When Enabled**: System attempts to identify what type of data was in redacted tokens
- **Use Case**: Useful for generating test data recommendations
- **Performance**: Slight performance impact when enabled

#### Field Names to Mask

A list of field and header names (`redactlist` in the rule JSON). Each name is masked wherever it appears in HTTP traffic, at any depth, without writing a path for it. Use it for fields that show up in many places, and use transform chains for one specific location or for a replacement other than a hash. A rule can use both. See [Masking Fields by Name](#masking-fields-by-name).

#### Protected Status

Some rules are protected:

- **Default Rules**: Speedscale-provided default rules are protected
- **Cannot Modify**: Protected rules cannot be edited or deleted
- **Can Clone**: You can clone protected rules to create editable copies
- **Use Case**: Prevents accidental modification of critical rules

## Creating a New DLP Rule from Recommendations

### Creating Rules from Individual Recommendations

To create a rule from a single recommendation:

1. **Open Prepare**: Select the Prepare tab in your snapshot
2. **Select Recommendation**: Select the suggestion you want to use under **To review**, then accept it
3. **Add it to a rule**: Open the transform's menu and select **Add to DLP rule**
4. **Select or Create Rule**: 
   - Choose existing rule to add to, or
   - Create a new rule with a unique ID
5. **Configure Rule**: Set rule name
6. **Confirm**: Confirm rule creation

### Naming Best Practices

When creating DLP rules, follow these naming best practices:

- **Descriptive Names**: Use names that describe the rule's purpose
- **Environment Prefixes**: Include environment (e.g., `prod-`, `test-`)
- **Service Names**: Include service names when rule is service-specific
- **Date Suffixes**: Optionally include dates for versioning

Examples:
```
prod-payment-data-redaction
ecommerce-customer-pii-rule
api-keys-redaction-v2
```

## DLP Rule Configuration Options

### Rule ID and Name

#### ID Requirements and Constraints

- **Uniqueness**: IDs must be unique across your organization
- **Format**: Alphanumeric characters, hyphens, underscores
- **Length**: Reasonable length limits
- **Immutability**: IDs cannot be changed after creation

#### Name Best Practices

- **Clarity**: Use clear, descriptive names
- **Consistency**: Follow consistent naming conventions
- **Searchability**: Use names that are easy to search
- **Documentation**: Names should be self-documenting

### Transform Chains Configuration

#### Adding Transform Chains

- **From Recommendations**: Add chains from recommendations
- **Manual Creation**: Create chains manually
- **From Templates**: Use chain templates
- **Import**: Import chains from other rules

#### Chain Ordering and Priority

- **Processing Order**: Chains are processed in order
- **Priority**: Earlier chains take precedence
- **Optimization**: Order chains for performance. Pick the most restrictive filters first to limit processing overhead
- **Dependencies**: Consider chain dependencies

#### Chain Modification

- **Edit Chains**: Modify existing chains
- **Remove Chains**: Remove chains from rules
- **Reorder Chains**: Change chain processing order
- **Clone Chains**: Duplicate chains for modification

### Pattern Discovery Settings (`discover_patterns`)

#### Enabling Pattern Discovery

Set `discover_patterns: true` in your DLP rule:

- **Purpose**: Enable automatic pattern discovery
- **When to Enable**: When you need test data generation
- **Production Rules**: Production rules will be more accurate because random data will be generated using the same pattern
- **Performance Trade-off**: If this is disabled, the original pattern will not be retained, but performance of the forwarder will improve
- **Use Case**: Production rules that will be used for test data generation

#### How Pattern Discovery Works

When enabled:

1. **Token Analysis**: System analyzes REDACTED tokens
2. **Pattern Matching**: Attempts to match patterns
3. **Type Inference**: Infers original data type
4. **Recommendation Generation**: Generates test data recommendations

#### Pattern Discovery Use Cases

- **Test Data Generation**: Generate realistic test data
- **Data Type Identification**: Identify what was redacted
- **Recommendation Quality**: Improve test data recommendations
- **Data Relationships**: Maintain data relationships

### Masking Fields by Name

A DLP rule can list field and header names to mask wherever they appear. In the rule JSON this is the `redactlist`. Use it when a sensitive field shows up in many places: a card number that sits in a dozen request and response shapes needs one name here, where it would need one transform chain per path.

#### What a Name Matches

Each name is matched against HTTP traffic in these places:

- **JSON bodies**: any key at any depth or array index, in request and response bodies whose `Content-Type` is JSON.
- **Form bodies**: any field in a request body sent as `application/x-www-form-urlencoded`.
- **Query parameters**: any parameter in the request URL.
- **Headers**: every value of a matching request or response header, including repeated headers such as a second `Set-Cookie`.

Names match without regard to case, so `cardnumber` also masks `CardNumber`. A name is matched whole and is never read as a path: enter `CardNumber`, not `Payments.CreditCard.CardNumber`. When a name holds an object or an array, everything inside it is masked.

#### What Replaces Each Value

Each matched value is replaced with `REDACTED-<hash>`, where the hash is computed from the original value. The same value always gets the same hash, so two different customer IDs stay different after masking, and replays and mocks can still tell them apart. When [pattern discovery](#pattern-discovery-settings-discover_patterns) is on, the detected pattern is added before the hash. An `Authorization` header keeps its scheme and masks only the credential, for example `Bearer REDACTED-<hash>`. The RRPair is marked as redacted.

#### Editing the List in the Dashboard

Open the DLP rule and select the **Mask fields by name** tab. Type a name and click **Add**, or paste several names separated by commas or line breaks. Click the **x** on a name to remove it. If a name contains a dot, the tab warns that it looks like a path. Click **Save** when you are done.

The **Transformations**, **Mask fields by name**, **Scope** and **Advanced** tabs all edit the same rule, so a change on one tab is kept when you switch to another. The **Advanced** tab shows the list as JSON.

#### Rule JSON

The list lives under `redactlist.entries.http`:

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

#### Choosing Between Names and Transform Chains

| Use | When |
|-----|------|
| Field names to mask | The field name is distinctive and appears in many places, or you need distinct values to stay distinct for replay and mock matching. |
| Transform chains | You need one exact location, a field whose name is too common to mask everywhere (such as `id` or `name`), a replacement other than a hash, or traffic other than HTTP. |

### Protected Rules

Protected rules are immutable configurations that cannot be modified or deleted. They are typically Speedscale-provided default rules or critical rules that shouldn't be changed. If you need to modify a protected rule, you can clone it to create an editable copy.

## Next Steps

After creating DLP rules:

- [Applying Rules to Production](./applying-rules.md) - Apply rules to forwarders in production

## Related Documentation

- [DLP Recommendations](./recommendations.md) - Understanding recommendations
- [Cluster Inspector](../capture/infra.md) - Forwarder configuration
