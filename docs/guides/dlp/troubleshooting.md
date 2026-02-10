---
sidebar_position: 11
title: Troubleshooting
description: Common DLP issues and how to resolve them.
---

# Troubleshooting

:::note Document Format
This document is verbose and formatted for LLM use. It provides detailed diagnostic information and resolution strategies to support AI-assisted troubleshooting.
:::

This section helps you troubleshoot common DLP issues and resolve problems quickly.

## Common Issues

### Recommendations Not Appearing

#### Possible Causes

- **Snapshot Not Analyzed**: Snapshot may not have been analyzed yet
- **No PII Discovered**: No PII may have been discovered
- **Filter Issues**: Filters may be hiding recommendations
- **Permission Issues**: You may not have permission to view recommendations

#### Diagnostic Steps

1. **Check Snapshot Status**: Verify snapshot analysis is complete
2. **Check Filters**: Clear filters and check again
3. **Check Permissions**: Verify you have recommendation access
4. **Check Snapshot Content**: Verify snapshot contains traffic
5. **Check Analysis Logs**: Review analysis logs for errors

#### Resolution Strategies

- **Wait for Analysis**: Wait for snapshot analysis to complete
- **Adjust Filters**: Adjust or clear filters
- **Request Permissions**: Request appropriate permissions
- **Re-analyze Snapshot**: Trigger snapshot re-analysis
- **Check Traffic**: Verify snapshot contains relevant traffic

### PII Not Being Redacted

#### Verification Steps

1. **Check Rule Application**: Verify DLP rule is applied to forwarder
2. **Check Rule Configuration**: Verify rule configuration is correct
3. **Check Filter Criteria**: Verify filters match your traffic
4. **Check Extractor Configuration**: Verify extractors are correct
5. **Test with Sample Traffic**: Test with sample traffic

#### Rule Application Checks

- **Forwarder Configuration**: Check `SPEEDSCALE_DLP_CONFIG` is set
- **Rule Status**: Verify rule is active
- **Forwarder Status**: Verify forwarder is healthy
- **Rule Version**: Check rule version is correct

#### Filter Criteria Validation

- **Filter Syntax**: Verify filter syntax is correct
- **Filter Matching**: Verify filters match your traffic
- **Filter Scope**: Check filter scope is appropriate
- **Filter Performance**: Check filter performance

#### Resolution Procedures

1. **Fix Configuration**: Fix any configuration issues
2. **Update Filters**: Update filters if needed
3. **Test Changes**: Test changes in staging
4. **Apply to Production**: Apply to production
5. **Monitor Results**: Monitor results

### REDACTED Tokens Not Found

#### Token Identification

- **Search for REDACTED**: Search for `REDACTED-` prefix
- **Check Snapshot**: Verify snapshot contains redacted traffic
- **Check Location**: Verify tokens are in expected locations
- **Check Format**: Verify token format is correct

#### Snapshot Analysis

- **Open Snapshot**: Open snapshot in dashboard
- **Search Tokens**: Search for REDACTED tokens
- **View RRPairs**: View RRPairs containing tokens
- **Count Tokens**: Count total tokens

#### Pattern Matching Issues

- **Pattern Discovery**: Check if pattern discovery is enabled
- **Pattern Matching**: Verify pattern matching is working
- **Pattern Validation**: Validate discovered patterns

#### Resolution Steps

1. **Verify Redaction**: Verify redaction is working
2. **Check Snapshot**: Check snapshot contains redacted data
3. **Enable Pattern Discovery**: Enable pattern discovery if needed
4. **Re-analyze**: Re-analyze snapshot
5. **Contact Support**: Contact support if issues persist

### Test Data Not Generating

#### Recommendation Validation

- **Check Recommendations**: Verify recommendations exist
- **Check Recommendation Type**: Verify recommendation type is correct
- **Check Pattern Discovery**: Verify pattern discovery worked

#### Test Data Configuration Checks

- **Configuration**: Verify test data configuration
- **Data Types**: Verify data types are supported
- **Format**: Verify format is correct
- **Validation**: Verify validation rules

#### Generation Process Verification

- **Process Status**: Check generation process status
- **Error Logs**: Check error logs
- **Performance**: Check performance issues
- **Resources**: Check resource availability

#### Resolution Strategies

1. **Review Recommendations**: Review recommendations
2. **Fix Configuration**: Fix configuration issues
3. **Enable Pattern Discovery**: Enable pattern discovery
4. **Re-generate**: Re-generate test data
5. **Contact Support**: Contact support if needed

## Rule Application Issues

### Rules Not Applying to Forwarders

#### Configuration Verification

- **Check Configuration**: Verify forwarder configuration
- **Check Rule ID**: Verify rule ID is correct
- **Check Rule Exists**: Verify rule exists
- **Check Permissions**: Verify permissions

#### Forwarder Status Checks

- **Forwarder Health**: Check forwarder health
- **Traffic Viewer**: Check traffic viewer
- **Forwarder Restart**: Check if forwarder needs restart
- **Network Connectivity**: Check network connectivity

#### Rule Validation

- **Rule Syntax**: Verify rule syntax
- **Rule Structure**: Verify rule structure
- **Rule Dependencies**: Check rule dependencies
- **Rule Version**: Check rule version

### Filter Criteria Not Matching

#### Filter Syntax Validation

- **Syntax Check**: Verify filter syntax
- **Operator Check**: Verify operators are correct
- **Value Check**: Verify values are correct
- **Escape Characters**: Check escape characters

#### Filter Testing

- **Sample Data**: Test with sample data
- **Edge Cases**: Test edge cases
- **Performance**: Test performance
- **Validation**: Validate results

#### Filter Debugging

- **Enable Debugging**: Enable filter debugging
- **Check Logs**: Check filter logs
- **Trace Execution**: Trace filter execution
- **Analyze Results**: Analyze filter results

### Performance Degradation

#### Performance Monitoring

- **Latency**: Monitor latency
- **Throughput**: Monitor throughput
- **Resource Usage**: Monitor resource usage
- **Error Rates**: Monitor error rates

#### Rule Optimization

- **Narrow Filters**: Narrow filter criteria
- **Optimize Extractors**: Optimize extractors
- **Optimize Transforms**: Optimize transforms
- **Reduce Chain Length**: Reduce chain length

#### Performance Tuning

- **Resource Allocation**: Allocate resources appropriately
- **Caching**: Enable caching where appropriate
- **Parallel Processing**: Enable parallel processing
- **Load Balancing**: Balance load appropriately

## Pattern Discovery Issues

### Patterns Not Being Discovered

#### Discovery Configuration Checks

- **Pattern Discovery Enabled**: Verify `discover_patterns` is enabled
- **Configuration Correct**: Verify configuration is correct
- **Rule Applied**: Verify rule is applied
- **Traffic Present**: Verify traffic is present

#### Pattern Validation

- **Pattern Format**: Verify pattern format
- **Pattern Matching**: Verify pattern matching
- **Pattern Accuracy**: Verify pattern accuracy

#### Discovery Algorithm Understanding

- **Algorithm Behavior**: Understand algorithm behavior
- **Pattern Types**: Understand supported pattern types
- **Context Requirements**: Understand context requirements
- **Limitations**: Understand limitations

#### Resolution Strategies

1. **Enable Discovery**: Enable pattern discovery
2. **Check Configuration**: Check configuration
3. **Provide Context**: Provide more context
4. **Manual Patterns**: Use manual patterns if needed
5. **Contact Support**: Contact support for assistance

### Incorrect Pattern Classification

#### Pattern Validation

- **Review Patterns**: Review discovered patterns
- **Validate Accuracy**: Validate pattern accuracy
- **Check Context**: Check context
- **Compare with Known**: Compare with known patterns

#### Classification Accuracy

- **Pattern Matching**: Verify pattern matching
- **Type Inference**: Verify type inference
- **Validation**: Validate classifications

#### Manual Correction

- **Override Patterns**: Override incorrect patterns
- **Manual Classification**: Manually classify patterns
- **Custom Patterns**: Use custom patterns
- **Pattern Refinement**: Refine patterns

## Debugging Tools and Techniques

### Snapshot Inspection

#### Snapshot Analysis Tools

- **Dashboard Tools**: Use dashboard inspection tools
- **Search Functions**: Use search functions
- **Filter Tools**: Use filter tools
- **Export Tools**: Use export tools

#### RRPair Inspection

- **View RRPairs**: View individual RRPairs
- **Inspect Structure**: Inspect RRPair structure
- **Check Values**: Check values
- **Trace Flow**: Trace data flow

#### Token Identification

- **Search Tokens**: Search for tokens
- **Identify Locations**: Identify token locations
- **Count Tokens**: Count tokens
- **Analyze Patterns**: Analyze token patterns

### Transform Chain Validation

#### Chain Structure Validation

- **Structure Check**: Verify chain structure
- **Component Check**: Verify components
- **Order Check**: Verify order
- **Dependencies Check**: Check dependencies

#### Chain Execution Testing

- **Test Execution**: Test chain execution
- **Trace Execution**: Trace execution
- **Check Results**: Check results
- **Validate Output**: Validate output

#### Chain Debugging

- **Enable Debugging**: Enable debugging
- **Check Logs**: Check logs
- **Trace Steps**: Trace execution steps
- **Analyze Results**: Analyze results

### Log Analysis

#### Log Access

- **Traffic Viewer**: Access traffic viewer
- **Rule Logs**: Access rule execution logs
- **Error Logs**: Access error logs
- **Audit Logs**: Access audit logs

#### Log Interpretation

- **Parse Logs**: Parse log entries
- **Identify Errors**: Identify errors
- **Trace Execution**: Trace execution
- **Analyze Patterns**: Analyze patterns

#### Error Identification

- **Error Messages**: Identify error messages
- **Error Codes**: Identify error codes
- **Error Context**: Understand error context
- **Error Resolution**: Resolve errors

## Getting Help

### Support Resources

- **Documentation**: Check documentation
- **Knowledge Base**: Search knowledge base
- **Community**: Check community forums
- **Support Tickets**: Open support tickets

### Contacting Support

When contacting support, provide:

- **Issue Description**: Clear description of issue
- **Steps to Reproduce**: Steps to reproduce
- **Configuration**: Relevant configuration
- **Logs**: Relevant logs
- **Screenshots**: Screenshots if applicable

## Next Steps

After resolving issues:

- [Best Practices](./best-practices.md) - Review best practices

## Related Documentation

- [Creating DLP Rules](./creating-rules.md) - Rule creation
- [Applying Rules to Production](./applying-rules.md) - Production deployment
