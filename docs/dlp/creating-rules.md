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
- **RedactList**: Key-based redaction rules
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

#### RedactList Configuration

:::caution Deprecated
RedactList is retained for backwards compatibility and is not recommended for new installations. Use transform chains instead for better flexibility and control.
:::

Key-based redaction rules:

- **Purpose**: Redact entire keys/fields rather than values
- **Protocol-Specific**: Can be configured per protocol (HTTP, gRPC, etc.)
- **Key Matching**: Matches keys by name
- **Use Case**: Quick redaction of known sensitive fields

#### Protected Status

Some rules are protected:

- **Default Rules**: Speedscale-provided default rules are protected
- **Cannot Modify**: Protected rules cannot be edited or deleted
- **Can Clone**: You can clone protected rules to create editable copies
- **Use Case**: Prevents accidental modification of critical rules

## Creating a New DLP Rule from Recommendations

### Creating Rules from Individual Recommendations

To create a rule from a single recommendation:

1. **Open Recommendations**: Navigate to the Recommendations tab in your snapshot
2. **Select Recommendation**: Click on the recommendation you want to use
3. **Click "Apply"**: Click the "Apply" or "Add to DLP Rule" button
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

### RedactList Configuration

:::caution Deprecated
RedactList is retained for backwards compatibility and is not recommended for new installations. Use transform chains instead for better flexibility and control.
:::

#### RedactList Purpose and Structure

RedactLists provide key-based redaction:

- **Key Matching**: Matches keys/field names
- **Protocol Support**: Works across protocols
- **Simple Configuration**: Easy to configure
- **Performance**: Efficient key-based matching

#### Configuring Key-Based Redaction

Example configuration:

```json
{
  "redactlist": {
    "entries": {
      "http.req.body": ["password", "ssn", "creditCard"],
      "http.res.body": ["apiKey", "token"]
    }
  }
}
```

#### Protocol-Specific Redaction

- **HTTP**: Redact HTTP request/response bodies
- **gRPC**: Redact Protocol Buffer messages
- **Database**: Redact SQL query parameters
- **All Protocols**: Use "all" key for all protocols

### Protected Rules

Protected rules are immutable configurations that cannot be modified or deleted. They are typically Speedscale-provided default rules or critical rules that shouldn't be changed. If you need to modify a protected rule, you can clone it to create an editable copy.

## Next Steps

After creating DLP rules:

- [Applying Rules to Production](./applying-rules.md) - Apply rules to forwarders in production

## Related Documentation

- [DLP Recommendations](./recommendations.md) - Understanding recommendations
- [Cluster Inspector](../observe/infra.md) - Forwarder configuration
