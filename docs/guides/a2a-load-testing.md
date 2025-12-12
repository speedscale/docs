# Load Testing Agent-to-Agent (A2A) API Calls

## What is the A2A Protocol?

The [Agent-to-Agent (A2A) protocol](https://github.com/a2aproject/A2A) is an open protocol that enables communication and interoperability between opaque agentic applications. As AI systems become more specialized and distributed, A2A provides a standardized way for diverse AI agents built on different frameworks and hosted on separate servers to discover, negotiate with, and collaborate on tasks.

### Key Features of A2A

The A2A protocol solves the challenge of agent silos by enabling:

- **Discovery**: Agents expose their capabilities through "Agent Cards" that detail what they can do and how to connect
- **Negotiation**: Agents can negotiate preferred interaction formats including text, forms, and media
- **Collaboration**: Multiple agents can work together securely on extended tasks
- **Opacity**: Agents collaborate without revealing internal state, memory, or proprietary tools

### Technical Foundation

The A2A protocol is built on standard web technologies:

- **Protocol**: JSON-RPC 2.0 over HTTP(S) for standardized messaging
- **Communication Patterns**:
  - Synchronous request/response exchanges
  - Streaming via Server-Sent Events (SSE)
  - Asynchronous push notifications
- **Data Types**: Text, files, and structured JSON payloads

The A2A Protocol is a Linux Foundation open-source project with contributions from Google, licensed under Apache 2.0.

## Load Testing A2A with Speedscale

Since A2A uses JSON-RPC 2.0 over HTTP(S), it can be load tested like any other HTTP-based API using Speedscale's traffic replay capabilities. The standard HTTP foundation means existing load testing infrastructure and techniques apply directly to A2A implementations.

### How Traffic Replay Works for A2A

Speedscale captures real A2A traffic between agents and replays it at scale:

1. **Capture**: Deploy the Speedscale sidecar to capture live A2A traffic between your agents, including JSON-RPC calls, SSE streams, and async notifications
2. **Transform**: Use [extractors and transformers](/transform/extractors/) to handle dynamic values in Agent Cards, session tokens, or agent-specific identifiers
3. **Replay**: Configure a [test config](/reference/glossary.md#test-config) with your desired load pattern (see [Load Testing guide](/guides/replay/load-test.md))
4. **Analyze**: Review response accuracy, latency, and throughput to identify bottlenecks

### Configuring Load Patterns for A2A

A2A workloads often involve complex multi-agent interactions. Consider these approaches:

- **Staged Load**: Gradually increase RPS to simulate agent network growth
- **Soak Testing**: Run sustained load to expose resource leaks in long-running agent conversations
- **Low Data Mode**: Enable [low data mode](/reference/glossary.md#low-data-mode) for high-throughput testing while focusing on status codes and errors

See the [Load Testing guide](/guides/replay/load-test.md) for detailed configuration instructions.

## Common Performance and Testing Issues with A2A

### 1. Long-Running Agent Conversations

A2A enables extended multi-turn conversations between agents. These long-lived sessions can:

- Exhaust connection pools if not properly managed
- Cause memory leaks in state management
- Create cascading delays when agents wait on each other

**Testing Strategy**: Use soak tests with realistic conversation lengths to identify memory leaks and connection exhaustion. Monitor agent response times throughout the test duration.

### 2. Server-Sent Events (SSE) Streaming

A2A's streaming support via SSE introduces specific challenges:

- Connection timeout configuration must accommodate streaming duration
- Load balancers may drop long-lived connections
- High connection counts from streaming can saturate file descriptors

**Testing Strategy**: Capture and replay SSE streams to validate connection stability. Test with various load balancer timeout configurations to ensure streaming reliability at scale.

### 3. Agent Discovery and Negotiation Overhead

The A2A discovery phase involves:

- Fetching and parsing Agent Cards
- Content negotiation between agents
- Capability matching and format selection

**Testing Strategy**: Measure the time agents spend in discovery vs. actual work. Consider caching Agent Cards when appropriate to reduce discovery overhead.

### 4. JSON-RPC Error Handling

JSON-RPC 2.0 defines specific error codes and structures. Common issues include:

- Improper error propagation between agents
- Timeout handling when dependent agents become unresponsive
- Inconsistent error response formats

**Testing Strategy**: Use [assertions](/reference/configuration/assertions/) to validate JSON-RPC error responses. Test failure scenarios where downstream agents return errors or time out.

### 5. Dynamic Agent Networks

In production A2A deployments, agent availability changes dynamically:

- Agents may come online or go offline
- Agent capabilities may be updated
- Network topology changes as agents are added

**Testing Strategy**: Capture traffic from various network states. Test with different agent configurations to ensure your system handles topology changes gracefully.

### 6. Authentication and Security

A2A communications often involve:

- Agent authentication and authorization
- Secure token exchange between agents
- Rate limiting and abuse prevention

**Testing Strategy**: Use Speedscale's [transform capabilities](/transform/extractors/) to handle authentication tokens during replay. Test rate limiting behavior under high load to ensure legitimate agent traffic isn't blocked.

## Best Practices

1. **Capture Representative Traffic**: Ensure your captured snapshots include the full range of A2A interactions: discovery, negotiation, synchronous calls, and streaming
2. **Test Agent Independence**: Load test individual agents as well as the full agent network to identify single points of failure
3. **Monitor End-to-End Latency**: Track total conversation time across multiple agent hops, not just individual request latency
4. **Validate Agent Card Changes**: Test backward compatibility when updating agent capabilities to ensure existing agent relationships continue working

## Learn More

- [Load Testing Guide](/guides/replay/load-test.md) - Configure and run load tests
- [Traffic Replay Concepts](/concepts/replay.md) - Understand how replay works
- [Extractors and Transformers](/transform/extractors/) - Handle dynamic values in A2A traffic
- [A2A Protocol Specification](https://github.com/a2aproject/A2A) - Official protocol documentation
