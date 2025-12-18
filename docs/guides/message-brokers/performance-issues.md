---
title: Common Performance Issues
sidebar_position: 14
---

Understanding common performance issues with message brokers is essential for effective load testing and optimization. This guide catalogs the most frequent performance problems you'll encounter with Kafka, RabbitMQ, and other message brokers, helping you identify bottlenecks during load testing and in production.

## Why This Matters for Load Testing

When load testing message broker integrations with Speedscale, you'll want to watch for these issues as you scale traffic. Many performance problems only appear under realistic load patterns, making load testing critical for uncovering bottlenecks before they impact production.

## 1. Broker-Side Resource Saturation

### Disk I/O bottlenecks
- **Kafka:** Sequential writes and page cache behavior dominate performance. Frequent fsyncs or insufficient RAM cause latency spikes.
- **RabbitMQ:** Durable queues and persistent messages can become disk-bound.
- **Symptoms:** Rising publish latency, consumer lag, periodic latency cliffs.

### Network saturation
- Small messages increase packet and syscall overhead.
- Cross-AZ/region replication traffic can dominate bandwidth.
- **Symptoms:** Throughput plateaus, p99 latency worsens.

### CPU pressure
- TLS, compression, routing, and message copying all consume CPU.
- RabbitMQ topic/fanout exchanges with many bindings are CPU-intensive.

### Memory pressure and GC
- JVM (Kafka) and Erlang VM (RabbitMQ) suffer from GC pauses under memory pressure.
- **Symptoms:** Latency spikes, uneven throughput.

## 2. Durability and Replication Tradeoffs

### Ack and durability settings
- **Kafka:** `acks=all`, high `min.insync.replicas` increase safety but hurt tail latency.
- **RabbitMQ:** Publisher confirms, durable queues, persistent messages add overhead.

### Replication catch-up
- Lagging replicas consume bandwidth and disk I/O during recovery.

## 3. Partition and Queue Topology

### Too few partitions or hot spots (Kafka)
- Limits parallelism; skewed keys overload single brokers.

### Too many partitions or queues
- Metadata, file handles, and background work explode.
- Slower failover and rebalances.

## 4. Consumer-Side Backpressure

### Slow consumers
- Processing slower than production rate causes lag spirals.

### Rebalance storms (Kafka)
- Frequent consumer group rebalances cause pauses.

### Prefetch and unacked tuning (RabbitMQ)
- High prefetch hoards messages; low prefetch limits throughput.

## 5. Message Shape and Client Behavior

### Message size extremes
- Large messages cause GC and network fragmentation.
- Tiny messages waste per-message overhead.

### Retry storms
- Aggressive retries amplify load and cause cascading failures.

### Connection churn
- Frequent connection or channel creation is expensive.

## 6. Serialization and Schema Management

### Serialization overhead
- **JSON vs Binary Formats:** JSON is human-readable but verbose and slow to parse. Binary formats like Avro, Protocol Buffers, or MessagePack reduce payload size and CPU overhead.
- **Schema evolution:** Incompatible schema changes break consumers. Use schema registries (Kafka Schema Registry, Confluent Schema Registry) to manage compatibility.
- **Deserialization CPU cost:** Complex schemas with deep nesting increase CPU usage per message.

### Schema registry issues
- **Registry unavailability:** Schema registry outages can block producers and consumers.
- **Cache tuning:** Insufficient schema cache causes excessive registry lookups.
- **Version proliferation:** Too many schema versions increases registry overhead.

## 7. Security and Authentication Overhead

### TLS/SSL encryption
- CPU overhead from encryption/decryption, especially at high throughput.
- Certificate validation adds latency to connection establishment.
- **Symptoms:** High CPU usage, reduced throughput compared to plaintext.

### SASL authentication
- **Kafka:** SASL/SCRAM, SASL/PLAIN, Kerberos add authentication overhead.
- **RabbitMQ:** EXTERNAL, PLAIN mechanisms impact connection setup time.
- Token refresh and re-authentication can cause periodic latency spikes.

### ACL evaluation
- Complex ACL rules increase authorization overhead per request.
- Can become a bottleneck with fine-grained permissions.

## 8. Monitoring and Observability Gaps

### Missing or inadequate metrics
- Can't optimize what you can't measure.
- Key metrics: consumer lag, throughput, latency percentiles (p50, p95, p99), error rates.

### Alert fatigue
- Too many alerts or poorly tuned thresholds mask real issues.
- Missing alerts for critical conditions (high consumer lag, broker resource exhaustion).

### Lack of distributed tracing
- Hard to correlate message flow across services.
- Difficult to identify bottlenecks in multi-hop message flows.

## 9. Testing and Load Testing Challenges

### Insufficient load testing
- Many performance issues only appear under realistic production load.
- **Testing in lower environments** with reduced load may miss bottlenecks.
- **Solution:** Use tools like Speedscale to replay production traffic patterns in test environments.

### Environment differences
- Configuration drift between environments masks issues.
- Test brokers with different hardware specs don't reflect production behavior.
- Network topology differences affect latency and throughput.

### Unrealistic test data
- Synthetic data may not match production message sizes or complexity.
- Missing edge cases (large messages, malformed messages, bursty traffic).

:::tip Load Testing with Speedscale

Speedscale helps overcome these challenges by capturing real production traffic patterns and replaying them in test environments. This ensures your load tests reflect actual usage patterns, message sizes, and timing.

[Learn how to load test message brokers with Speedscale](./index.md)

:::

## 10. Operational Issues

### Dead letter queue handling
- Messages that repeatedly fail processing accumulate in DLQs.
- Unmonitored DLQs can hide data loss or processing failures.
- **Symptoms:** Silent data loss, missing messages downstream.

### Poison messages
- A single malformed or problematic message can stall an entire queue or partition.
- Consumers may crash or hang when processing poison messages.
- **Solution:** Implement proper error handling, message validation, and DLQ strategies.

### Connection pool exhaustion
- Limited connection pools cause contention under load.
- Connection leaks gradually exhaust available connections.
- **Symptoms:** Connection timeouts, blocked threads, cascading failures.

### Clock skew and time synchronization
- Timestamp inconsistencies affect message ordering and retention.
- Can cause messages to be dropped or processed out of order.
- **Solution:** Use NTP or similar time synchronization across all brokers and clients.

## 11. Broker-Specific Common Issues

### Kafka
- **Leader imbalance:** Uneven distribution of partition leaders causes hot brokers.
- **ISR shrink:** In-sync replica set shrinking indicates replication lag or broker issues.
- **Network/request thread saturation:** Limited handler threads bottleneck request processing.
- **Page cache misses:** Reading cold data from disk instead of cache hurts performance.
- **Log compaction pressure:** Compaction falling behind increases storage and read overhead.

### RabbitMQ
- **Memory and disk alarms:** Triggering flow control blocks publishers, causing cascading backpressure.
- **Exchange and binding explosions:** Too many bindings increase routing overhead.
- **Queue type tradeoffs:** Classic vs quorum vs stream queues have different performance characteristics.
- **Too many queues or consumers per node:** Resource overhead per queue/consumer limits scalability.

## Identifying Issues During Load Testing

When load testing with Speedscale, watch for these indicators:

1. **Latency increases:** p95/p99 latency spikes under load indicate bottlenecks
2. **Consumer lag:** Growing lag suggests processing can't keep up with production rate
3. **Error rate increases:** Timeouts, connection failures, or processing errors
4. **Resource exhaustion:** CPU, memory, disk I/O, or network saturation
5. **Throughput plateaus:** Inability to scale beyond certain message rates

Use Speedscale's captured traffic to create realistic load scenarios that expose these issues before they impact production.

## Recommendations

1. **Start with production traffic patterns:** Use Speedscale to capture and replay real traffic
2. **Monitor comprehensively:** Track broker, client, and application metrics
3. **Test at scale:** Don't assume lower-environment results will hold in production
4. **Tune iteratively:** Adjust broker, client, and application configs based on load test results
5. **Plan for failure:** Test broker failures, network partitions, and client crashes
6. **Document baselines:** Establish performance baselines to detect degradation
