---
description: "Understand how Smart Mock's AI agent automatically optimizes transform chains through iterative experimentation to achieve high-quality API mocks."
sidebar_position: 2
title: Smart Mock
---

# How Smart Mock Works

Mock Pilot is an AI agent that automatically creates and optimizes transform chains to produce high-quality API mocks from your captured traffic snapshots. Instead of manually crafting transforms, Mock Pilot experiments iteratively, learns from results, and adapts its approach until it achieves optimal Mock Accuracy.

## The Core Process

### 1. **Snapshot Analysis**
Mock Pilot begins by analyzing your traffic snapshot—the real requests and responses recorded from your live system. It identifies:
- Dynamic data patterns (timestamps, IDs, tokens)
- Authentication mechanisms
- Data relationships across requests
- Potential areas requiring transformation

### 2. **Initial Transform Strategy**
Based on its analysis, Mock Pilot develops an initial hypothesis about what transforms are needed:
- **Data normalization** for dynamic values like timestamps and request IDs
- **Authentication handling** for tokens and signatures
- **Response customization** for test-specific scenarios
- **PII redaction** for sensitive data

### 3. **Transform Chain Generation**
Mock Pilot creates one or more **transform chains**—sequences of data modification functions that will be applied to your snapshot. Each chain follows this pattern:

```
Extractor → Transform → Transform → ... → Result
```

For example, a chain might:
1. Extract a JWT token from request headers
2. Decode and modify the token's expiration time
3. Re-encode and sign the token
4. Insert it back into the request

### 4. **Experimental Execution**
Mock Pilot runs experiments by:
1. Applying transform chains to your snapshot
2. Using the transformed data to create mocks
3. Testing those mocks against expected behaviors
4. Measuring **Mock Accuracy**—how well the mocks perform

### 5. **Accuracy Measurement**
Mock Accuracy quantifies how effectively the generated mocks serve realistic API responses. The AI agent measures:
- **Response correctness**: Do mocks return appropriate data structures?
- **Dynamic data handling**: Are timestamps, IDs, and tokens properly managed?
- **Edge case coverage**: Do mocks handle various request scenarios?
- **Authentication flow**: Do auth mechanisms work as expected?

### 6. **Iterative Optimization**
Based on accuracy results, Mock Pilot adapts its approach:

**If accuracy is low:**
- Analyzes what went wrong (mismatched data formats, auth failures, etc.)
- Modifies existing transform chains
- Generates new chains targeting identified issues
- Runs additional experiments

**If accuracy is high:**
- Fine-tunes chains for edge cases
- Optimizes performance
- Validates consistency across different request patterns

### 7. **Convergence and Results**
Mock Pilot continues iterating until:
- Mock Accuracy reaches the highest achievable level
- No further improvements are detected over several iterations
- A maximum iteration limit is reached

## What Mock Pilot Learns

Throughout the process, the AI agent builds understanding about:

### **Data Patterns**
- Which fields contain dynamic values that need normalization
- How data relationships flow between requests (e.g., IDs from one response used in subsequent requests)
- What constitutes realistic vs. problematic test data

### **System Behavior**
- Authentication token lifecycles and refresh patterns
- Expected response formats and data types
- Error conditions and how they should be mocked

### **Transform Effectiveness**
- Which transform types work best for different data scenarios
- Optimal sequencing of transforms within chains
- Performance implications of different approaches

## The Intelligence Behind Mock Pilot

Mock Pilot combines several AI capabilities:

**Pattern Recognition**: Identifies complex data patterns across large traffic snapshots that would be time-consuming for humans to analyze manually.

**Strategy Adaptation**: Learns from failed experiments and adjusts its approach, trying alternative transform strategies when initial attempts don't achieve target accuracy.

**Optimization**: Balances multiple objectives—accuracy, performance, maintainability—to find the best overall solution.

**Contextual Understanding**: Recognizes domain-specific patterns in your API traffic and applies appropriate transform strategies.

## Output: Production-Ready Transform Chains

When Mock Pilot completes its optimization process, it delivers:

1. **Optimized Transform Chains**: JSON configurations ready to use in your testing workflows
2. **Accuracy Report**: Detailed metrics showing how well the mocks perform
3. **Recommendations**: Insights about your API patterns and suggested testing strategies
4. **Usage Instructions**: How to apply the generated transforms in your specific environment

These transform chains can be immediately integrated into your existing Speedscale workflows, providing high-quality mocks that reliably support your API testing needs.

## Benefits of AI-Driven Mock Creation

**Speed**: What might take hours of manual transform configuration happens in minutes.

**Accuracy**: AI optimization often discovers transform strategies that humans might miss.

**Consistency**: Systematic experimentation ensures comprehensive coverage of your API patterns.

**Adaptability**: As your APIs evolve, Mock Pilot can quickly generate updated transform chains.

**Learning**: Each project builds the AI's understanding of effective transform patterns for future use.

Mock Pilot transforms the complex task of creating effective API mocks from a manual craft into an automated, intelligent process—letting you focus on testing strategy rather than data transformation mechanics.