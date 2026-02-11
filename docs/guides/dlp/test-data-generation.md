---
sidebar_position: 8
title: Generating Test Data
description: Learn how to generate realistic test data from redacted production snapshots by applying recommendations or creating them manually.
---

# Generating Test Data

After applying DLP rules to production and capturing redacted traffic in a snapshot, you can generate realistic test data to replace `REDACTED-` tokens. This enables comprehensive testing with data that behaves like production data but contains no sensitive information.

## Prerequisites

Before generating test data, ensure you have:

- A snapshot containing `REDACTED-` tokens (created from production traffic after DLP rules are applied)
- Access to the snapshot in the Speedscale dashboard

## Applying Test Data Recommendations

The system automatically analyzes snapshots with `REDACTED-` tokens and generates recommendations for test data generation. These recommendations suggest appropriate test data types based on discovered patterns, field names, and context.

### Reviewing Recommendations

1. **Open Snapshot**: Open a snapshot containing `REDACTED-` tokens
2. **View Recommendations**: Navigate to the test data recommendations section
3. **Review Details**: Each recommendation shows:
   - **Pattern Type**: Type of data to generate (email, SSN, credit card, etc.)
   - **Location**: JSONPath where the token appears
   - **Format**: Expected format of the generated data
   - **Impact**: Number of tokens affected

### Selecting Recommendations

Available test data patterns include:

- **Email Addresses**: Realistic email addresses
- **Phone Numbers**: E.164 format phone numbers
- **Credit Card Numbers**: Valid format credit cards (test numbers)
- **SSNs**: SSN format (test values)
- **UUIDs**: Various UUID formats
- **IP Addresses**: IPv4 and IPv6 addresses
- **Dates/Timestamps**: Realistic dates and timestamps
- **All supported PII patterns**: Any pattern type supported by DLP

### Applying Recommendations

#### Individual Application

1. **Select Recommendation**: Choose a recommendation to apply
2. **Review Details**: Review the recommendation details and configuration
3. **Configure Test Data** (optional): Customize data format or generation rules if needed. Individual recommendations can be edited during the application process or after the fact by modifying the snapshot used for testing.
4. **Apply**: Apply the recommendation to generate test data
5. **Verify**: Verify that test data has been generated correctly

#### Bulk Application

1. **Select Multiple**: Select multiple recommendations using checkboxes
2. **Bulk Actions**: Use the bulk action menu
3. **Configure** (optional): Configure test data settings for all selected recommendations
4. **Apply All**: Apply all selected recommendations at once
5. **Review**: Review the applied recommendations and generated test data

## Creating Recommendations Manually

If automatic recommendations don't meet your needs, or you want to create test data for specific patterns, you can create recommendations manually.

### Manual Recommendation Process

1. **Identify REDACTED Tokens**: Open your snapshot and either open the Recommendations tab to view automatic recommendations, or edit the snapshot Transform Chains manually to pinpoint a data token. Note the JSONPath locations and field names where tokens appear.

2. **Determine Test Data Type**: Based on the field names, context, and your knowledge of the data structure, determine what type of test data should replace each token.

3. **Create Transform Chain**: Recommendations will automatically create transform chains that can be modified. For manual creation, create a transform chain that:
   - **Filters**: Identifies the RRPairs containing the tokens (using filters like path, method, service, etc.)
   - **Extracts**: Extracts the token locations using JSONPath extractors
   - **Transforms**: Applies a transform to generate test data (e.g., `GenerateEmail`, `GenerateSSN`, `GenerateCreditCard`)

4. **Apply Transform Chain**: Apply the transform chain to the snapshot to generate test data.

### Example: Manual Email Test Data Recommendation

```
req_body() -> json_path(path="email") -> rand_string(pattern="(?:[a-z0-9!#$%&'*+\x2f=?^_`\x7b-\x7d~\x2d]+(?:\.[a-z0-9!#$%&'*+\x2f=?^_`\x7b-\x7d~\x2d]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9\x2d]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9\x2d]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9\x2d]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])")
```

This example:
- Extracts the request body using `req_body()`
- Extracts the `email` field using JSONPath with `json_path(path="email")`
- Generates realistic email addresses matching the email pattern using `rand_string()` to replace `REDACTED-` tokens

For more information on creating transform chains, see [Creating DLP Rules](./creating-rules.md).

## Test Data Characteristics

Generated test data maintains:

- **Format Compliance**: Matches the original data format (e.g., email format, phone number format)
- **Realistic Patterns**: Uses realistic patterns and value ranges
- **Data Relationships**: Preserves relationships between related tokens when possible
- **Uniqueness**: Ensures uniqueness where needed (e.g., unique email addresses)

## Next Steps

After generating test data:

- [Best Practices](./best-practices.md) - Learn test data best practices

## Related Documentation

- [DLP Recommendations](./recommendations.md) - Understanding recommendations
- [Creating DLP Rules](./creating-rules.md) - How to create rules for redaction
