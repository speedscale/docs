---
sidebar_position: 3
title: Discovering PII in Test Environment
description: Learn how to capture traffic, create snapshots, and discover PII using Speedscale's DLP engine.
---

# Discovering PII in Test Environment

The first phase of the DLP workflow involves capturing traffic from your test environment and discovering Personally Identifiable Information (PII) within that traffic. This phase happens safely in your test environment before any rules are applied to production.

:::info Prerequisites
Before discovering PII, you need to have:
- Speedscale installed and configured (see [Quick Start Guide](../quick-start.md))
- A snapshot created from captured traffic (see [Creating Snapshots](../guides/creating-a-snapshot.md))
:::

## Understanding PII Discovery

Once you've created a snapshot, Speedscale's DLP engine analyzes it to discover PII and sensitive data patterns.

### How DLP Engine Discovers PII

The DLP engine uses multiple techniques to discover PII:

#### Pattern Matching Algorithms

- **Regex Patterns**: Pattern matching for common PII formats
- **Format Validation**: Validates data against known formats
- **Context Analysis**: Analyzes surrounding context for better accuracy

#### Context-Aware Discovery

The engine considers:

- **Field Names**: Analyzes field names (e.g., "email", "ssn", "credit_card")
- **Data Location**: Considers where data appears (headers, body, query params)
- **Data Relationships**: Understands relationships between data fields
- **Application Context**: Uses application-specific context

#### Discovery Accuracy and False Positives

- **High Accuracy**: Engine is tuned for high accuracy
- **False Positive Handling**: You can ignore false positives
- **Review Process**: Always review recommendations before applying
- **Continuous Improvement**: Engine improves over time

### Supported PII Types and Patterns

Speedscale's DLP engine can discover over 30 types of sensitive data:

#### Contact Information

- **Email Addresses** (`DATA_PATTERN_EMAIL`): Standard email format validation
- **Phone Numbers** (`DATA_PATTERN_E164_PHONE_NUMBER`): E.164 format phone numbers

#### Identity Information

- **Social Security Numbers** (`DATA_PATTERN_SSN`): U.S. SSN format (XXX-XX-XXXX)
- **UUIDs**: Various UUID formats
  - `DATA_PATTERN_UUID`: Generic UUID
  - `DATA_PATTERN_UUID3`, `DATA_PATTERN_UUID3_RFC4122`: UUID version 3
  - `DATA_PATTERN_UUID4`, `DATA_PATTERN_UUID4_RFC4122`: UUID version 4
  - `DATA_PATTERN_UUID5`, `DATA_PATTERN_UUID5_RFC4122`: UUID version 5
  - `DATA_PATTERN_UUID_RFC4122`: RFC4122 compliant UUIDs

#### Financial Information

- **Credit Card Numbers** (`DATA_PATTERN_CREDIT_CARD`): Major credit card formats with Luhn algorithm validation

#### Network Information

- **IP Addresses**: 
  - `DATA_PATTERN_IP4_ADDR`: IPv4 addresses
  - `DATA_PATTERN_IP6_ADDR`: IPv6 addresses
  - `DATA_PATTERN_IP_ADDR`: Generic IP addresses
  - `DATA_PATTERN_IP4`, `DATA_PATTERN_IP6`, `DATA_PATTERN_IP`: IP pattern variants

#### Authentication Tokens

- **JWTs** (`DATA_PATTERN_JWT`): JSON Web Tokens in standard format

#### Location Data

- **Geographic Coordinates**:
  - `DATA_PATTERN_LATITUDE`: Latitude values
  - `DATA_PATTERN_LONGITUDE`: Longitude values

#### URLs and Identifiers

- **URLs**: 
  - `DATA_PATTERN_URL`: Generic URLs
  - `DATA_PATTERN_HTTP_URL`: HTTP/HTTPS URLs
  - `DATA_PATTERN_URI`: URIs

#### Database Information

- **SQL Statements** (`DATA_PATTERN_SQL`): SQL query patterns
- **SQL Statement Names** (`DATA_PATTERN_SQL_STATEMENT_NAME`): Named SQL statements
- **SQL Portal Names** (`DATA_PATTERN_SQL_PORTAL_NAME`): SQL portal identifiers

#### Temporal Data

- **Dates and Timestamps** (`DATA_PATTERN_DATETIME`): Various date/time formats

#### Distributed Tracing

- **Trace IDs** (`DATA_PATTERN_TRACE_ID`): Distributed tracing trace identifiers
- **Span IDs** (`DATA_PATTERN_SPAN_ID`): Distributed tracing span identifiers

#### Hash Values

- **MD4, MD5**: `DATA_PATTERN_MD4`, `DATA_PATTERN_MD5`
- **SHA Variants**: `DATA_PATTERN_SHA256`, `DATA_PATTERN_SHA384`, `DATA_PATTERN_SHA512`
- **Other Hashes**: `DATA_PATTERN_RIPEMD128`, `DATA_PATTERN_TIGER128`, `DATA_PATTERN_TIGER160`, `DATA_PATTERN_TIGER192`

### Pattern Recognition and Data Classification

#### How Patterns are Matched

- **Format Validation**: Validates data against known formats
- **Checksum Validation**: Uses checksums (e.g., Luhn for credit cards)
- **Range Validation**: Validates against expected ranges
- **Context Validation**: Uses context to improve accuracy

#### Pattern Validation

- **Format Checking**: Ensures data matches expected format
- **Checksum Verification**: Validates checksums where applicable
- **Context Analysis**: Analyzes surrounding context
- **Cross-Reference**: Cross-references with other discovered patterns

### JSONPath Location Identification

The DLP engine uses JSONPath to identify where PII is located within RRPairs.

#### JSONPath Syntax Overview

JSONPath is a query language for JSON data. For complete JSONPath documentation, see the [official JSONPath specification](https://goessner.net/articles/JsonPath/index.html) and [RFC 9535](https://datatracker.ietf.org/doc/html/rfc9535). Note that while most JSONPath features are supported, not all advanced features may be available.

- **Root**: `$` represents the root object
- **Child**: `.` accesses child properties
- **Array**: `[]` accesses array elements
- **Wildcard**: `*` matches all elements
- **Recursive**: `..` searches recursively

#### How Locations are Identified

- **Precise Paths**: Identifies exact JSONPath to PII location
- **Nested Structures**: Handles deeply nested JSON structures
- **Array Elements**: Identifies PII within arrays
- **Multiple Occurrences**: Identifies all occurrences of PII

#### Location Precision and Accuracy

- **Exact Locations**: Provides exact JSONPath to PII
- **Field-Level Precision**: Identifies specific fields containing PII
- **Value-Level Precision**: Can identify specific values within fields
- **Regex Submatches**: Uses regex to identify specific parts of values

#### Nested Data Structure Handling

The engine handles:

- **Deep Nesting**: Handles deeply nested JSON structures
- **Array Nesting**: Identifies PII within nested arrays
- **Object Nesting**: Identifies PII within nested objects
- **Mixed Structures**: Handles mixed arrays and objects

## Next Steps

After discovering PII in your snapshot:

- [Understanding DLP Recommendations](./recommendations.md) - Learn about the recommendations generated from PII discovery
- [Creating DLP Rules](./creating-rules.md) - Create DLP rules from recommendations

## Related Documentation

- [Quick Start Guide](../quick-start.md) - Speedscale installation and setup
- [Installation Documentation](../setup/install/README.md) - Environment-specific installation guides
- [CLI Installation](../setup/install/cli.md) - Installing the Speedscale CLI
- [Kubernetes Operator](../setup/install/kubernetes-operator.md) - Installing the Kubernetes operator
- [Creating Snapshots](../guides/creating-a-snapshot.md) - Detailed snapshot management guide
- [Capturing Traffic](../concepts/capture.md) - Traffic capture concepts
- [Local Capture](../guides/local-capture.md) - Local traffic capture techniques
